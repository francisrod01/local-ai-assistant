from fastapi import APIRouter
from pydantic import BaseModel
import requests
import os

router = APIRouter()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")


class PullModelRequest(BaseModel):
    model_name: str


@router.get("/models")
def list_models():
    response = requests.get(f"{OLLAMA_URL}/api/tags")
    return {"models": response.json().get("models", [])}


@router.post("/pull")
def pull_model(request: PullModelRequest):
    payload = {"name": request.model_name}
    response = requests.post(f"{OLLAMA_URL}/api/pull", json=payload)
    return {"status": response.json()}


@router.get("/health")
def health():
    try:
        response = requests.get(f"{OLLAMA_URL}/")
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
    try:
        response = requests.get(f"{OLLAMA_URL}/api/ps")
        data = response.json()
        return {"models": data.get("models", []), "timestamp": response.headers.get("Date")}
    except Exception as e:
        return {"models": [], "error": str(e)}
