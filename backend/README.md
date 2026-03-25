# Backend Run Guide

This backend is a FastAPI service that proxies Ollama, persists interactions, and exposes monitoring endpoints.

## Recommended: Run with Docker Compose (Development)

From the repository root:

```bash
docker compose up --build backend -d
```

Notes:

- This uses `docker-compose.yml` + `docker-compose.override.yml` by default.
- Backend will be available at `http://localhost:8000`.
- Required dependencies (`postgres`, `redis`, `ollama`) start via `depends_on`.

Ports (development):

- Backend API: `http://localhost:8000`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`
- Ollama: `http://localhost:11434`


## Run with Docker Compose (Production-Style)

From the repository root:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build backend -d
```

Endpoint:

- Backend published port: `http://localhost:80`


## Local (Non-Container) Run

From `backend/`:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Environment notes:

- If `POSTGRES_URL` is not set, backend falls back to local SQLite (`data/local.db`).
- For Ollama on host, set:

```bash
export OLLAMA_URL=http://localhost:11434
```

- Slow model load tuning (especially for first request/cold starts):

```bash
export OLLAMA_REQUEST_TIMEOUT_SECONDS=300
export OLLAMA_STREAM_CONNECT_TIMEOUT_SECONDS=10
export OLLAMA_STREAM_READ_TIMEOUT_SECONDS=600
export OLLAMA_WARMUP_TIMEOUT_SECONDS=90
export OLLAMA_KEEP_ALIVE=15m
```

`OLLAMA_STREAM_READ_TIMEOUT_SECONDS=0` disables stream read timeout.


## Run Tests (Container)

From repository root:

```bash
docker compose run --rm backend python -m pytest -q
```

This is the preferred command in this image for reliable import-path resolution.


## Useful Backend Endpoints

- `POST /chat`
- `POST /chat_stream`
- `GET /chat_runtime_status`
- `GET /metrics`
- `GET /health`
- `GET /ollama_status`
- `GET /runtime_status`
- `GET /history`
