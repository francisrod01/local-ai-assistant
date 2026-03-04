from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import requests
import os

router = APIRouter()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
# default model for all chat endpoints; avoids magic strings scattered about
DEFAULT_MODEL = "phi3:mini"


class ChatRequest(BaseModel):
    prompt: str


def _build_payload(prompt: str, stream: bool):
    """Construct a request body tuned for low-memory/low-latency usage.

    - batch_size smaller than the internal default helps avoid huge spikes when
      many users are active.
    - num_predict limits the number of tokens we ask for in the test/hot path.
    """
    return {
        "model": DEFAULT_MODEL,
        "prompt": prompt,
        "stream": stream,
        # keep batches modest so that CPU memory for intermediate tensors
        # doesn't blow up; the server log shows 256 by default.
        "batch_size": 128,
        # limit the number of predicted tokens if client doesn't override
        "num_predict": 100,
    }


# `/chat` is a simple non-streaming proxy entrypoint.  The frontend uses this
# for quick synchronous requests or when streaming is not required.  Metrics
# instrumentation (token counts, etc.) is also triggered here.
@router.post("/chat")
def chat(request: ChatRequest):
    payload = _build_payload(request.prompt, stream=False)
    response = requests.post(f"{OLLAMA_URL}/api/generate", json=payload)
    data = response.json()

    # update Ollama metrics
    try:
        from metrics import TOKENS_USED, OLLAMA_REQUESTS, refresh_ollama_models_loaded
        TOKENS_USED.labels(model=payload["model"]).inc(
            data.get("usage", {}).get("total_tokens", 0)
        )
        OLLAMA_REQUESTS.labels(model=payload["model"]).inc()
        refresh_ollama_models_loaded(OLLAMA_URL)
    except ImportError:
        pass

    return {"response": data.get("response", "")}


@router.post("/chat_stream")
def chat_stream(request: ChatRequest):
    payload = _build_payload(request.prompt, stream=True)
    # we set stream=True on the requests call so we can iterate over the
    # token chunks as they arrive.
    response = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, stream=True)

    # increment request count and refresh loaded models gauge before streaming
    try:
        from metrics import OLLAMA_REQUESTS, refresh_ollama_models_loaded
        OLLAMA_REQUESTS.labels(model=payload["model"]).inc()
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
