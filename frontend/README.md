# Frontend Run Guide

This frontend is a React Router app served in development by Vite/React Router dev server.

## Recommended: Run with Docker Compose (Development)

From the repository root:

```bash
docker compose up --build frontend -d
```

Notes:

- This uses `docker-compose.yml` + `docker-compose.override.yml` by default.
- The frontend will be available at `http://localhost:5173`.
- Backend and its dependencies are started automatically through `depends_on`.

Ports (development):

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`


## Run with Docker Compose (Production-Style)

From the repository root:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build frontend nginx -d
```

Endpoints:
- Frontend via Nginx: `http://localhost:3000`
- Backend API: `http://localhost:80`

Stop commands:

```bash
docker compose -f docker-compose.yml -f docker-compose.override.yml down
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

## Frontend Commands (Inside frontend/)

```bash
npm install
npm run dev
npm run build
npm run start
npm run typecheck
```

## Local (Non-Container) Caveat

The Vite proxy in this project points API traffic to `http://backend:8000`.
That hostname is available in the Docker network, not on your host OS.

If you run frontend directly on host, you must either:

- run the app inside Compose (recommended), or
- adjust proxy targets to `http://localhost:8000` for host-based development.
