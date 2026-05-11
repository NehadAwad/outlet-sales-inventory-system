# Offline POS strategy

Goal: keep the **register usable during network loss**, then **sync** sales when connectivity returns **without duplicate receipts** or silent stock corruption. The server should preserve the same invariants as online checkout (assignment, stock, sequential receipts)—see [`sale.service.ts`](../backend/src/modules/sales/sale.service.ts).

## Client-side persistence

- Use a **durable local store** (e.g. SQLite in a desktop shell, or IndexedDB in a PWA) for:
  - pending sale payloads (items, quantities, timestamps),
  - sync state (pending / failed / succeeded),
  - minimal catalog snapshot (SKU, name, outlet price) refreshed when online—optional for offline price display with “as of” timestamp.

## Idempotency

- Each offline sale gets a **client-generated UUID** (`Idempotency-Key` or body field) stored server-side (e.g. `sale_idempotency_keys` table: key, outletId, resulting `saleId`, createdAt).
- On sync, if the key exists, return the **existing sale** instead of creating a second row—protects against retries after ambiguous timeouts.

## Sync flow

1. Worker uploads pending sales **FIFO** or by priority when the network is available.
2. Server handles each attempt in **one database transaction** (same pattern as today): lock receipt sequence, validate outlet menu assignment, lock inventory rows, decrement stock, insert sale + lines, bump sequence.
3. On success, client marks the local record synced and stores returned `receiptNumber` / `saleId`.
4. On **recoverable** errors (5xx), retry with backoff.
5. On **business** errors (4xx: insufficient stock, item not assigned), mark failed locally and prompt staff to **adjust or void** the draft—do not infinite-retry.

## Conflicts

- **Insufficient stock** after an offline period is expected: online sales consumed inventory while the device was disconnected. Surface a clear message (“Stock changed; reduce quantity or remove line”) and require human resolution.
- **Price changes** — Optionally snapshot `unitPrice` at sale time offline; server may reject if policy requires live pricing, or accept with audit flags.

## POS and KDS (kitchen display)

- **Online** — Optional WebSocket or message bus: new ticket events to KDS, bump/status back to POS.
- **Offline POS** — KDS may not receive new tickets until connectivity returns; show **staleness** (“Last updated …”) and queue locally buffered tickets when the link is restored.
- **Offline KDS** — Risk of inconsistent kitchen state; typical mitigation is **restrict offline mode on KDS** or show read-only last-known queue with explicit reconnect sync.

## Security and audit

- Authenticate devices (outlet-scoped tokens). Rate-limit sync endpoints. Log idempotency hits and rejected payloads for fraud and support review.

## Summary

Offline POS is viable with a **local queue + server-side idempotency + the same transactional checkout** as the online path. The hard part is **UX for conflicts** (stock and catalog drift), not the wire format.
