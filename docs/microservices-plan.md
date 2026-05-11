# Microservices conversion plan

The codebase is a **modular monolith**: clear folder boundaries that could become service boundaries later. This document outlines a plausible decomposition, data ownership, and integration patterns—without prescribing an immediate split (microservices bring operational cost; split when team scale or isolation needs justify it).

## Current modular boundaries

| Folder / module | Responsibility |
|-----------------|----------------|
| `outlets` | Outlet CRUD, outlet-scoped routing |
| `menu-items` | HQ master catalog |
| `outlet-menu` | Assignment of items to outlets, outlet price |
| `inventory` | Per-outlet stock rows |
| `sales` | Checkout, receipt sequence, sale lines |
| `reports` | Read-only aggregates |

## Candidate services

| Service | Owns (example tables / concepts) | Notes |
|---------|----------------------------------|--------|
| **Outlet registry** | `outlets` | Authoritative outlet identity and metadata |
| **Catalog** | `menu_items` | HQ SKU catalog; publish events on change |
| **Outlet menu** | `outlet_menu_items` | Which items sell where and at what price |
| **Inventory** | `inventories` | Stock levels; high write contention per outlet |
| **Sales / checkout** | `sales`, `sale_items`, `receipt_sequences` | Must enforce sequential receipts and stock deduction in one consistency boundary |
| **Reporting** | Read models, aggregates | Consumes events or replicated data; no blocking on checkout |

## Communication

- **Synchronous** — HTTP/JSON between services for request/response flows that need an immediate answer (e.g. “create sale” might still call inventory reservation APIs unless folded into one service).
- **Asynchronous** — **Transactional outbox** in the writer service: persist domain event + outbox row in the same DB transaction, then a relay publishes to a broker. Downstream **reporting** subscribes to `SaleCompleted` to refresh projections without coupling checkout latency to analytics.

## Data ownership

- Each table above should have **exactly one owning service** that performs writes. Others read via API or replicated read models—never dual-writes across services.
- **Sales + receipt_sequences + inventory deduction** are tightly coupled today (single TypeORM transaction). Splitting them requires either:
  - keeping them in **one “checkout” service**, or
  - a **saga** (reserve stock → commit sale → compensate on failure) with idempotency and clear failure modes—more complex than the current design.

## Challenges

- **Distributed transactions** — Avoid two-phase commit across services. Prefer single-service transactions plus sagas or eventual consistency for cross-cutting concerns.
- **Receipt sequence** — Needs a **single writer per outlet** (or distributed sequence generator with strong guarantees). Moving this to its own microservice only helps if that service is the sole mutator of `receipt_sequences`.
- **Reference data lag** — Catalog or outlet-menu changes propagating to POS clients may lag behind replication; define whether checkout rejects unknown SKUs or accepts with version pins.

## Pragmatic path

1. Keep monolith until load or team boundaries force a split.
2. First extraction candidate is often **reporting** (read-only, event-driven).
3. Leave **checkout + inventory + receipt sequence** together unless there is a strong reason to separate—those paths share locks and invariants today.
