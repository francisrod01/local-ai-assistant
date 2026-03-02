from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import requests
import os

router = APIRouter()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")


class ChatRequest(BaseModel):
    prompt: str


class PullModelRequest(BaseModel):
    model_name: str


@router.post("/chat")
def chat(request: ChatRequest):
    model_name = "phi3:mini"
    payload = {"model": model_name, "prompt": request.prompt, "stream": False}
    response = requests.post(f"{OLLAMA_URL}/api/generate", json=payload)
    data = response.json()

    # update Ollama metrics
    try:
        from metrics import TOKENS_USED, OLLAMA_REQUESTS, refresh_ollama_models_loaded
        TOKENS_USED.labels(model=model_name).inc(data.get("usage", {}).get("total_tokens", 0))
        OLLAMA_REQUESTS.labels(model=model_name).inc()
        refresh_ollama_models_loaded(OLLAMA_URL)
    except ImportError:
        pass

    return {"response": data.get("response", "")}


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
    except requests.exceptions.RequestException as e:
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
    except requests.exceptions.RequestException as e:
        return {"models": [], "error": str(e)}


@router.post("/chat_stream")
def chat_stream(request: ChatRequest):
    model_name = "phi3:mini"
    payload = {"model": model_name, "prompt": request.prompt, "stream": True, "num_predict": 100}
    response = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, stream=True)

    # increment request count and refresh loaded models gauge before streaming
    try:
        from metrics import OLLAMA_REQUESTS, refresh_ollama_models_loaded
        OLLAMA_REQUESTS.labels(model=model_name).inc()
        refresh_ollama_models_loaded(OLLAMA_URL)
    except ImportError:
        pass

    def event_stream():
        for line in response.iter_lines():
            if line:
                import json
                chunk = line.decode("utf-8")
                data = json.loads(chunk)
                yield data.get("response", "")

    return StreamingResponse(event_stream(), media_type="text/plain")
