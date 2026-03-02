from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response

# counters and histograms for backend telemetry
REQUEST_COUNT = Counter(
    "backend_requests_total",
    "Total number of HTTP requests handled by the backend",
    ["endpoint", "method"],
)
REQUEST_LATENCY = Histogram(
    "backend_request_latency_seconds",
    "Latency of HTTP requests in seconds",
    ["endpoint"],
)
TOKENS_USED = Counter(
    "backend_tokens_total",
    "Total number of tokens consumed by requests",  # approximate or reported by the LLM
    ["model"],
)

# Ollama-specific metrics
OLLAMA_REQUESTS = Counter(
    "ollama_requests_total",
    "Number of proxied requests sent to Ollama",
    ["model"],
)
from prometheus_client import Gauge

OLLAMA_MODELS_LOADED = Gauge(
    "ollama_models_loaded",
    "Current number of models loaded in the Ollama server",
)


def refresh_ollama_models_loaded(ollama_url: str):
    """Query Ollama `/api/ps` and update gauge with number of loaded models."""
    import requests
    try:
        response = requests.get(f"{ollama_url}/api/ps")
        data = response.json()
        count = len(data.get("models", []))
        OLLAMA_MODELS_LOADED.set(count)
    except Exception:
        # ignore failures, leave previous value
        pass


def metrics_response() -> Response:
    """Return the current metrics in Prometheus format."""
    data = generate_latest()
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)
