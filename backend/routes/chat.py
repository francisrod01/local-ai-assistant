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
    payload = {"model": "phi3:mini", "prompt": request.prompt, "stream": False}
    response = requests.post(f"{OLLAMA_URL}/api/generate", json=payload)
    data = response.json()
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


@router.post("/chat_stream")
def chat_stream(request: ChatRequest):
    payload = {"model": "phi3:mini", "prompt": request.prompt, "stream": True, "num_predict": 100}
    response = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, stream=True)

    def event_stream():
        for line in response.iter_lines():
            if line:
                import json
                chunk = line.decode("utf-8")
                data = json.loads(chunk)
                yield data.get("response", "")

    return StreamingResponse(event_stream(), media_type="text/plain")
