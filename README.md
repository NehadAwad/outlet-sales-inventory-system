# Outlet Sales & Inventory System

Multi-outlet POS with HQ menu assignment, per-outlet inventory, transactional sales, and reporting.

Full setup, API documentation, and Docker instructions will be added as implementation progresses.

## Frontend (dev)

From the repo root:

```bash
cp frontend/.env.example frontend/.env
npm run frontend:dev
```

## Database (Docker, PostgreSQL only)

For local development with the API against Postgres in Docker (matches `backend/.env.example` defaults: `DB_HOST=localhost`, `DB_PORT=5432`, `DB_NAME=pos_db`):

```bash
docker compose up -d
docker compose ps
```

Tear down (keeps data): `docker compose down`  
Tear down and **delete** data: `docker compose down -v`

