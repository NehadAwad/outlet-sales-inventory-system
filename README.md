# Outlet Sales & Inventory System

Multi-outlet POS with HQ menu assignment, per-outlet inventory, transactional sales, and reporting.

## Frontend (dev)

From the repo root:

```bash
cp frontend/.env.example frontend/.env
npm run frontend:dev
```

## Docker (full stack)

Postgres, API (migrations on startup), and static frontend (Nginx SPA):

```bash
docker compose up --build
```

| Published URL | Service |
|---------------|---------|
| http://localhost:8080 | Frontend (Nginx) |
| http://localhost:5000 | API (`CORS_ORIGIN` set to `http://localhost:8080`) |
| localhost:5432 | Postgres (`postgres` / `postgres` / `pos_db`) |

The frontend image is built with `VITE_API_BASE_URL=http://localhost:5000/api/v1` so the **browser** talks to the API on the host. After changing that URL, rebuild: `docker compose build --no-deps frontend`.

Tear down (keeps DB volume): `docker compose down`  
Tear down and **delete** data: `docker compose down -v`

If host port **5000** is already in use, stop the other process or adjust the published port in [`docker-compose.yml`](docker-compose.yml) and set matching `CORS_ORIGIN` / rebuild frontend with the matching `VITE_API_BASE_URL`.

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

