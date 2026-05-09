# Outlet Sales & Inventory System

Multi-outlet POS with HQ menu assignment, per-outlet inventory, transactional sales, and reporting.

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

## Deployment (monorepo)

Use **Root Directory** per service so only `backend/` or `frontend/` is built.

### Backend (Render Web Service)

- **Root Directory:** `backend`
- **Build command:** `npm ci && npm run build` (or `npm install && npm run build`)
- **Start command:** `npm run migration:run && npm run start`

Set environment variables in the Render dashboard (do not commit secrets):

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon Postgres URI with `sslmode=require`, **or** omit and use discrete `DB_*` + `DB_SSL=true` |
| `CORS_ORIGIN` | Your deployed frontend origin (e.g. `https://your-app.vercel.app`) |
| `PORT` | Usually injected by Render; local default remains configurable |

### Frontend (Vercel)

- **Root Directory:** `frontend`
- Set `VITE_API_BASE_URL` to your API base URL including `/api/v1` (e.g. `https://your-service.onrender.com/api/v1`).

### Database (Neon)

Run migrations via the Render **start command** above on first deploy; configure credentials only in Render/Neon, not in git.

