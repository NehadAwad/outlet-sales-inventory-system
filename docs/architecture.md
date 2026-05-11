# Architecture

This document describes how the POS API is structured, how requests flow through layers, and how **checkout** preserves correctness under **concurrent load**.

## Layered design

Traffic enters Express routers under [`backend/src/modules/`](../backend/src/modules/). Each feature area follows the same shape:

```text
routes  →  controllers  →  services  →  repositories  →  TypeORM / PostgreSQL
              ↑
        validate.middleware (Zod)
```

| Layer | Role |
|-------|------|
| **Routes** | HTTP verbs and paths; attach Zod schemas via `validate(...)`. |
| **Controllers** | Parse params/body (already validated), call services, map results to HTTP via [`ApiResponse`](../backend/src/utils/ApiResponse.ts). |
| **Services** | Business rules, orchestration, transactions where needed. |
| **Repositories** | Encapsulate queries and `save`/`find` patterns per aggregate. |

Cross-cutting concerns:

- [`error.middleware.ts`](../backend/src/middlewares/error.middleware.ts) — maps thrown [`ApiError`](../backend/src/utils/ApiError.ts) (and unexpected errors) to JSON responses.
- [`notFound.middleware.ts`](../backend/src/middlewares/notFound.middleware.ts) — 404 for unknown routes.
- [`asyncHandler`](../backend/src/utils/asyncHandler.ts) — forwards rejected promises from async controllers to Express error handling.

The frontend is a Vite + React SPA; it calls the JSON API using [`frontend/src/api/client.ts`](../frontend/src/api/client.ts) with `VITE_API_BASE_URL`.

## Transaction handling (sales)

Creating a sale must be **atomic**: receipt number allocation, stock deduction, and persistence of `Sale` + `SaleItem` rows must succeed or fail together.

[`createSale`](../backend/src/modules/sales/sale.service.ts) uses a dedicated TypeORM **`QueryRunner`**:

1. `connect()` → `startTransaction()`.
2. All reads and writes for that checkout use `queryRunner.manager` (same connection + transaction).
3. On success: `commitTransaction()`.
4. On any thrown error: `rollbackTransaction()` in `catch`, then `release()` in `finally`.

No nested transactions are required for the current flows; a single boundary matches one checkout attempt.

## Concurrency safety

Two risks under parallel requests at the same outlet:

1. **Duplicate or skipped receipt numbers** if two workers read the same `lastNumber`.
2. **Overselling** if two workers both read sufficient stock and decrement without coordination.

Mitigations in `createSale`:

- **`ReceiptSequence`** — Loaded with **`pessimistic_write`** (row-level lock in PostgreSQL). The first transaction holds the lock until commit; others block, then see the updated `lastNumber`. Together with unique constraint `(outletId, receiptNumber)` on `sales`, this prevents duplicate receipt strings for an outlet.
- **`Inventory`** rows for the line items — Selected via `QueryBuilder` with **`setLock("pessimistic_write")`** so concurrent sales for overlapping SKUs serialize at the database layer. Stock checks and decrements happen while locks are held; `stockQty >= 0` is also enforced by a DB check constraint.

Other endpoints typically use short transactions or single-row updates; the reporting module is read-only relative to checkout.

## Failure modes

- **Validation errors** — Returned as 400 with Zod issue details before service logic runs.
- **`ApiError`** — Mapped to the appropriate status (404, 409, etc.).
- **Unexpected errors** — Logged server-side and surfaced as a generic 500 in production-safe shape (see error middleware).

## Related documents

- [erd.md](./erd.md) — Data model  
- [scaling-plan.md](./scaling-plan.md) — Growth considerations  
- [microservices-plan.md](./microservices-plan.md) — Future service boundaries  
