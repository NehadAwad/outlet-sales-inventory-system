# Outlet Sales & Inventory System

Multi-outlet **POS** platform: HQ maintains a **master menu**, assigns items to **outlets** with optional **price overrides**, tracks **per-outlet inventory**, records **transactional sales** with **sequential receipts**, and exposes **reporting** (revenue by outlet, top-selling items).

## Tech stack

| Layer | Technologies |
|-------|----------------|
| API | Node.js 20+, Express 5, TypeORM, PostgreSQL, Zod |
| Web UI | React 19, Vite, TypeScript, Tailwind CSS |
| Repo layout | Monorepo: [`backend/`](backend/), [`frontend/`](frontend/) |

## Prerequisites

- **Node.js** 20+ and **npm**
- **PostgreSQL** (local, Docker via Compose, or hosted e.g. Neon)
- **Docker** (optional) for the full local stack

## Quick start

**Option A — Docker (full stack)** — Postgres, API, and Nginx UI in one command:

```bash
git clone <YOUR_REPO_URL> && cd outlet-sales-inventory-system
docker compose up --build
```

- UI: http://localhost:8080  
- API health: http://localhost:5000/health  

**Option B — Local Node** — Run Postgres yourself (or point `DATABASE_URL` / `DB_*` in `backend/.env`). From repo root:

```bash
cd backend && cp .env.example .env && npm ci && npm run migration:run:dev && npm run dev
```

Second terminal (from repo root):

```bash
cp frontend/.env.example frontend/.env
# Set VITE_API_BASE_URL=http://localhost:5000/api/v1 in frontend/.env
npm run frontend:dev
```

Open http://localhost:5173. Optional: `npm run seed --prefix backend` with the API running.

## Local setup

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env: DB_* or DATABASE_URL for your Postgres
npm ci
npm run migration:run:dev
npm run dev
```

API listens on `http://localhost:5000` by default (see `PORT` in `.env`).

### Frontend

```bash
cp frontend/.env.example frontend/.env
# Set VITE_API_BASE_URL (e.g. http://localhost:5000/api/v1)
npm run frontend:dev
```

Vite dev server: `http://localhost:5173`.

### Optional seed data

With the API running and DB migrated:

```bash
npm run seed --prefix backend
```

## API reference

Base path: **`/api/v1`**. Requests and responses use JSON.

**Response shape** — Successful payloads use `{ "success": true, "data": …, "message": … }`. Validation failures use `{ "success": false, "message": "…", "errors": … }` with HTTP **400**. Typical codes: **404** not found, **409** conflict (e.g. duplicate SKU), **500** unexpected server error.

**Authentication** — The API does **not** ship with authentication. For production, add API keys, JWT, or mutual TLS and enforce least-privilege per outlet.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness (no `/api/v1` prefix) |
| `POST` | `/api/v1/outlets` | Create outlet |
| `GET` | `/api/v1/outlets` | List outlets |
| `GET` | `/api/v1/outlets/:outletId` | Get outlet |
| `PATCH` | `/api/v1/outlets/:outletId` | Update outlet |
| `POST` | `/api/v1/outlets/:outletId/menu-items` | Assign menu item to outlet |
| `GET` | `/api/v1/outlets/:outletId/menu-items` | List outlet menu |
| `PATCH` | `/api/v1/outlets/:outletId/menu-items/:menuItemId` | Update assignment (e.g. price) |
| `DELETE` | `/api/v1/outlets/:outletId/menu-items/:menuItemId` | Remove assignment |
| `POST` | `/api/v1/outlets/:outletId/inventory` | Create/update stock row |
| `GET` | `/api/v1/outlets/:outletId/inventory` | List inventory |
| `PATCH` | `/api/v1/outlets/:outletId/inventory/:menuItemId` | Update stock quantity |
| `POST` | `/api/v1/outlets/:outletId/sales` | Create sale (transactional) |
| `GET` | `/api/v1/outlets/:outletId/sales` | List sales |
| `GET` | `/api/v1/outlets/:outletId/sales/:saleId` | Get sale with lines |
| `POST` | `/api/v1/menu-items` | Create master menu item |
| `GET` | `/api/v1/menu-items` | List menu items |
| `GET` | `/api/v1/menu-items/:menuItemId` | Get menu item |
| `PATCH` | `/api/v1/menu-items/:menuItemId` | Update menu item |
| `DELETE` | `/api/v1/menu-items/:menuItemId` | Soft-delete (`isActive` → false) |
| `GET` | `/api/v1/reports/revenue-by-outlet` | Revenue aggregate |
| `GET` | `/api/v1/reports/outlets/:outletId/top-selling-items` | Top sellers for outlet |

**Example — create sale** (replace UUIDs with real values from your DB or seed):

```bash
curl -sS -X POST "http://localhost:5000/api/v1/outlets/OUTLET_UUID/sales" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"menuItemId":"MENU_ITEM_UUID","quantity":2}]}'
```

Body: `items` is a non-empty array of `{ "menuItemId": "<uuid>", "quantity": <positive int> }`. Each item must be assigned to the outlet with sufficient stock.

## Schema

Relational model: outlets, master **menu_items**, **outlet_menu_items** (assignment + outlet price), **inventories**, **sales** + **sale_items**, **receipt_sequences**.

**Key constraints** (defense in depth with application logic):

- Unique **`outlets.code`** and **`menu_items.sku`**.
- Unique **`(outletId, menuItemId)`** on assignments and on inventory rows.
- Unique **`(outletId, receiptNumber)`** on sales so receipts do not collide per outlet.
- **`inventories.stockQty >= 0`** enforced in PostgreSQL via a CHECK constraint.

Narrative, Mermaid source, integrity rules, and a **static diagram**: **[docs/erd.md](docs/erd.md)** · **[docs/ERD Diagram.png](docs/ERD%20Diagram.png)**.

## Architecture

- **HTTP layer**: Routes register handlers; **Zod** validates params/body/query at the **route** boundary so controllers receive typed, trusted input.
- **Application layer**: Controllers stay thin and delegate to **services**; **repositories** encapsulate TypeORM queries and persistence.
- **Invariants**: Business rules (stock, assignment, receipt sequencing) live in **services** and are reinforced by **database constraints** where possible.
- **Errors**: Central error middleware maps thrown `ApiError` (and unknown errors) to HTTP responses.
- **Sales (critical path)**: `createSale` uses a **single TypeORM `QueryRunner` transaction**. It takes a **pessimistic write lock** on the outlet’s `ReceiptSequence` row to allocate the next receipt number safely under concurrency, validates outlet menu assignment, locks matching **Inventory** rows, decrements stock, persists **Sale** + **SaleItem** rows, then commits.

Frontend: React Router SPA (`/outlets`, `/menu`, `/assign-menu`, `/inventory`, `/sales`, `/reports`) calling the API via `VITE_API_BASE_URL`.

## Scaling strategy

The system as shipped targets modest multi-outlet load. To evolve toward **~10 outlets** and on the order of **~100k sales per month** (order-of-magnitude planning, not a committed SLA):

- Keep the API **stateless** so you can add more Node instances behind a load balancer; cap DB **connection pools** (Neon pooler + app limits) so replicas do not exhaust Postgres.
- Move heavy **reporting** off the OLTP path: read replicas, scheduled aggregates / materialized views, or time-bounded queries so growing `sales` / `sale_items` tables do not scan full history on every dashboard load.
- **Partition or archive** old sales data when tables become large; monitor **lock wait** on checkout as write concurrency increases.

Deeper discussion (DB, reporting, caching, operations): **[docs/scaling-plan.md](docs/scaling-plan.md)**.

## Docker (full stack)

Postgres, API (migrations on startup), and static frontend (Nginx):

```bash
docker compose up --build
```

| URL | Service |
|-----|---------|
| http://localhost:8080 | Frontend (Nginx) |
| http://localhost:5000 | API (`CORS_ORIGIN` e.g. `http://localhost:8080`) |
| localhost:5432 | Postgres (`postgres` / `postgres` / `pos_db`) |

The frontend image bakes `VITE_API_BASE_URL=http://localhost:5000/api/v1`. After changing it, rebuild: `docker compose build --no-deps frontend`.

Tear down (keep volume): `docker compose down`  
Tear down and delete data: `docker compose down -v`

If port **5000** is taken on the host, adjust [`docker-compose.yml`](docker-compose.yml) published ports and align `CORS_ORIGIN` / frontend build args.

## Deployment

Production layout: **Vercel** (static SPA), **Render** (Node API), **Neon** (Postgres). Compose above is for **local** full stack only.

### Deployed instances 

| App | URL |
|-----|-----|
| Frontend | [https://outlet-sales-inventory-system.vercel.app](https://outlet-sales-inventory-system.vercel.app) |
| API | [https://outlet-sales-inventory-system.onrender.com](https://outlet-sales-inventory-system.onrender.com) |


### Smoke test (after deploy or local run)

```bash
curl -sS "http://localhost:5000/health"
curl -sS "http://localhost:5000/api/v1/outlets"
```

For production, substitute your public API origin. Expect JSON with `"success":true` for `/health` and a list payload for outlets.


## Further reading

- [docs/architecture.md](docs/architecture.md) — Layers, transactions, concurrency  
- [docs/erd.md](docs/erd.md) — Entity-relationship diagram (Mermaid + notes); static graphic [ERD Diagram.png](docs/ERD%20Diagram.png)  
- [docs/scaling-plan.md](docs/scaling-plan.md) — Growth and capacity notes  
- [docs/microservices-plan.md](docs/microservices-plan.md) — Possible service boundaries  
- [docs/offline-pos-strategy.md](docs/offline-pos-strategy.md) — Offline sync and idempotency sketch  

