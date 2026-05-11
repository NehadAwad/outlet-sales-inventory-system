# Scaling plan

This note sketches how the current monolith could evolve if the business grows toward **roughly 10 outlets** and on the order of **100,000 sales transactions per month** (~3.3k/day across all outlets, ~330/day per outlet on average). Numbers are assumptions for capacity planning, not SLAs.

## Assumptions

- Ten active outlets, shared PostgreSQL (e.g. Neon), single API deployment (e.g. Render) initially.
- Traffic is read-heavy for catalog and reports; writes spike around checkout.
- Receipt numbering and stock correctness remain **strongly consistent** per outlet (same guarantees as today).

## Database

- **Connection pooling** — Use the provider’s pooler (e.g. Neon) and cap application pool size so you do not exhaust `max_connections`. One misconfigured autoscaled API tier can starve the DB.
- **Indexes** — The schema already indexes hot columns (`outletId`, `menuItemId`, `createdAt` on sales). Revisit `EXPLAIN ANALYZE` on report queries as data grows; add covering indexes only when justified by measured slow queries.
- **Partitioning / archiving** — `sales` and `sale_items` grow monotonically. Options: monthly partitions (PostgreSQL declarative partitioning), or cold archive to object storage for analytics-only workloads. Keeps primary indexes smaller and vacuum cheaper.
- **Read path for analytics** — Heavy dashboards can move to a **read replica** or a dedicated analytics database fed by replication or ETL, so OLTP checkout stays isolated from large scans.

## Reporting

- Today’s endpoints aggregate raw rows. At scale, introduce **rolling aggregates** (materialized views refreshed on a schedule, or nightly jobs writing to summary tables) for revenue-by-outlet and top-selling-items.
- Bound every report query by **time range** and **outlet** to avoid full-table scans on years of history.

## API layer

- **Stateless Node** — Horizontal scaling on Render (or similar) works if sessions are not pinned to instances and DB remains the single source of truth.
- **Checkout hot path** — Sale creation already runs in one transaction with row locks; adding more API replicas increases concurrent DB writers—monitor lock wait time and connection counts before scaling instances blindly.
- **Future hardening** — **Idempotent sale submission** (client-supplied key deduplicated server-side) reduces duplicate charges when clients retry on timeouts. Not required for initial scale but valuable under flaky networks.

## Caching

- Short-TTL cache (CDN edge or in-process/Redis) for **stable reads**: master menu list, outlet directory. Invalidate or TTL on the order of minutes unless you add explicit invalidation on writes.
- Do not cache **inventory quantities** or **prices** for checkout without a clear invalidation strategy; stale reads cause oversell or pricing disputes.

## Operations

- **Structured logs** with `outletId`, `saleId`, `receiptNumber` where applicable; correlation IDs across requests.
- **Health checks** — Keep `GET /health` cheap; optional DB ping on a separate deep check if the platform supports it.
- **Migrations** — Run in CI and on deploy before traffic; avoid long blocking migrations on huge tables without expand/contract or online migration patterns.

## Summary

The current design fits modest multi-outlet load. The main levers at ~100k tx/month are **keeping reporting off the OLTP hot path**, **controlling connection and lock contention**, and **partitioning or summarizing historical sales** before raw tables become expensive to query.

## Related documents

- [architecture.md](./architecture.md) — Checkout transaction and pessimistic locking (why OLTP stays consistent as load grows).
- [erd.md](./erd.md) — Tables that grow fastest (`sales`, `sale_items`) and relationships for partitioning design. Static graphic: [ERD Diagram.png](./ERD%20Diagram.png).
