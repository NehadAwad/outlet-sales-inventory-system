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

## Deployment (Vercel + Render + Neon)

Production uses **Neon** for Postgres (not the Docker Compose database). Compose remains for **local** full-stack runs only.

### Checklist

1. **Neon** — Create a project/database; copy a connection string that includes **`sslmode=require`** (Neon’s dashboard provides this). You will set it as **`DATABASE_URL`** on Render only (never commit it).

2. **Render (API)** — Create a **Web Service**, connect this repo, set **Root Directory** to **`backend`**. Use Node **20+** (matches [`backend/package.json`](backend/package.json) `engines`). Example commands:
   - **Build:** `npm ci && npm run build`
   - **Start:** `npm run migration:run && npm run start`  
   Migrations run on each deploy before the server listens; ensure migration files are committed.

3. **Render environment variables** (dashboard; do not commit secrets):

   | Variable | Purpose |
   |----------|---------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Neon URI with TLS (`sslmode=require`) |
   | `CORS_ORIGIN` | Comma-separated **exact** frontend origins allowed to call the API (see below) |
   | `PORT` | Leave unset; Render injects it |

4. **`CORS_ORIGIN` and Vercel** — The API allows **multiple** origins from one variable: separate URLs with commas (no spaces required; trimming is applied). Include at minimum:
   - Production: `https://your-project.vercel.app`
   - Each **Preview** base URL you use (e.g. `https://your-project-git-branch-user.vercel.app`), **or** omit previews and test against production API only.  
   Docker local UI continues to use a single origin (e.g. `http://localhost:8080` in [`docker-compose.yml`](docker-compose.yml)).

5. **Vercel (frontend)** — Create a project, **Root Directory** **`frontend`**. Under **Environment Variables**, set **`VITE_API_BASE_URL`** to your Render service URL **including** **`/api/v1`**, e.g. `https://your-service.onrender.com/api/v1`. Define it for **Production** and **Preview** as needed (Preview may target a staging Render URL if you run one). Redeploy after changing this value so Vite rebakes the bundle.

6. **Smoke test** — `GET https://<your-render-host>/health` should return JSON success. Open the Vercel URL; in the browser DevTools network tab, API calls should succeed with **no CORS errors**.

Optional: commit [`render.yaml`](render.yaml) at the repo root as a Render Blueprint skeleton (`DATABASE_URL` / `CORS_ORIGIN` marked `sync: false` so you still enter secrets in the dashboard).

### Backend (Render Web Service) — summary

- **Root Directory:** `backend`
- **Build command:** `npm ci && npm run build`
- **Start command:** `npm run migration:run && npm run start`

### Frontend (Vercel) — summary

- **Root Directory:** `frontend`
- **`VITE_API_BASE_URL`:** `https://<render-service>.onrender.com/api/v1` (or your custom API domain)

### Database (Neon)

Credentials live in Neon and Render only; migrations run via the Render **start command** above.
