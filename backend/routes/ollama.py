from fastapi import APIRouter
from pydantic import BaseModel
import requests
import os

router = APIRouter()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
OLLAMA_HTTP_TIMEOUT_SECONDS = float(os.getenv("OLLAMA_HTTP_TIMEOUT_SECONDS", "5"))


def _resolve_models_for_status() -> tuple[list, str, str | None]:
    timestamp: str | None = None

    try:
        ps_response = requests.get(f"{OLLAMA_URL}/api/ps", timeout=OLLAMA_HTTP_TIMEOUT_SECONDS)
        timestamp = ps_response.headers.get("Date")
        loaded = ps_response.json().get("models", [])
        if loaded:
            return loaded, "loaded", timestamp
    except Exception:
        pass

    return [], "none", timestamp


class PullModelRequest(BaseModel):
    model_name: str


@router.get("/models")
def list_models():
    response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=OLLAMA_HTTP_TIMEOUT_SECONDS)
    return {"models": response.json().get("models", [])}


@router.post("/pull")
def pull_model(request: PullModelRequest):
    payload = {"name": request.model_name}
    response = requests.post(f"{OLLAMA_URL}/api/pull", json=payload, timeout=OLLAMA_HTTP_TIMEOUT_SECONDS)
    return {"status": response.json()}


@router.get("/health")
def health():
    try:
        response = requests.get(f"{OLLAMA_URL}/", timeout=OLLAMA_HTTP_TIMEOUT_SECONDS)
        return {"status": response.status_code, "message": response.text}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/ollama_status")
def ollama_status():
    """Proxy a simple status summary from the Ollama server.

    This endpoint returns the JSON payload of `/api/ps` along with
    timestamp and an optional error field.  Grafana panels can call
    it or use the related Prometheus metrics to display active
    model count and availability.
    """
    models, source, timestamp = _resolve_models_for_status()
    return {
        "models": models,
        "model_source": source,
        "timestamp": timestamp,
        "error": None if models else "No loaded models currently resident in Ollama runner.",
    }
