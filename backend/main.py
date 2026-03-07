from fastapi import FastAPI
from dotenv import load_dotenv
import os

# load environment variables from .env file (development)
load_dotenv()

# import the interaction model so that SQLAlchemy is aware of it
import models.interaction  # noqa: F401 (import for side effects)
from db import engine

app = FastAPI()

# register sub-routers
from routes import chat, ollama, history, chroma, monitoring
app.include_router(chat.router)
app.include_router(ollama.router)
app.include_router(history.router)
app.include_router(chroma.router)
app.include_router(monitoring.router)

# --- telemetry middleware -------------------------------------------------
# import metrics after routers to avoid circular imports
from metrics import REQUEST_COUNT, REQUEST_LATENCY

@app.middleware("http")
async def record_metrics(request, call_next):
    """FastAPI middleware that increments Prometheus counters and histograms."""
    import time
    start = time.time()
    response = await call_next(request)
    latency = time.time() - start
    endpoint = request.url.path
    method = request.method
    REQUEST_COUNT.labels(endpoint=endpoint, method=method).inc()
    REQUEST_LATENCY.labels(endpoint=endpoint).observe(latency)
    return response

# expose /metrics for Prometheus scrapers
from metrics import metrics_response

@app.get("/metrics")
def metrics_endpoint():
    return metrics_response()

# create database tables when the application starts and provide a
# lifespan context for any future startup/shutdown tasks. This ensures the DB
# is ready before any requests are handled, and also allows for clean shutdown
# if we later want to add things like connection cleanup, etc.
from contextlib import asynccontextmanager
from redis_store import set_system_flag


def _env_float(name: str, default: float) -> float:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return float(value)
    except ValueError:
        return default


OLLAMA_WARMUP_TIMEOUT_SECONDS = _env_float("OLLAMA_WARMUP_TIMEOUT_SECONDS", 90.0)
OLLAMA_KEEP_ALIVE = os.getenv("OLLAMA_KEEP_ALIVE", "15m")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # use Base from db since that's where it is defined
    import db as _db
    _db.Base.metadata.create_all(bind=engine)

    # warm up the default Ollama model so the first real user request doesn't
    # pay the cost of loading 2 GB into memory.  a short dummy generate call is
    # sufficient; the OLLAMA_MAX_LOADED_MODELS env var (see compose files) keeps
    # it resident.
    try:
        set_system_flag("model_warming_up", "1", ttl_seconds=180)
        # we avoid importing routes.chat to prevent circular dependencies
        model = "phi3:mini"
        import requests
        requests.post(
            f"{os.getenv('OLLAMA_URL','http://ollama:11434')}/api/generate",
            json={
                "model": model,
                "prompt": "Hello",
                "stream": False,
                "num_predict": 1,
                "keep_alive": OLLAMA_KEEP_ALIVE,
            },
            timeout=OLLAMA_WARMUP_TIMEOUT_SECONDS,
        )
    except Exception:
        # don't crash the app if Ollama isn't up yet; the init container already
        # pulls models and the backend will retry later.
        pass
    finally:
        set_system_flag("model_warming_up", "0", ttl_seconds=180)

    yield

# assign the lifespan handler
app.router.lifespan_context = lifespan

# `/chat` and `/chat_stream` endpoints are defined in routes/chat.py
# other Ollama helpers (models, pull, health, status) live in routes/ollama.py
# chroma-related dummy telemetry endpoints live in routes/chroma.py
# persistence routes live in routes/history.py
