from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import requests
import os
import json
import uuid

from redis_store import (
    append_stream_chunk,
    enforce_rate_limit,
    enqueue_generation_request,
    get_cached_response,
    mark_generation_complete,
    push_session_turn,
    runtime_snapshot,
    set_cached_response,
    set_generation_status,
)

router = APIRouter()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
# default model for all chat endpoints; avoids magic strings scattered about
DEFAULT_MODEL = "phi3:mini"


def _env_float(name: str, default: float) -> float:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return float(value)
    except ValueError:
        return default


def _env_optional_float(name: str, default: float) -> float | None:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        parsed = float(value)
        if parsed <= 0:
            return None
        return parsed
    except ValueError:
        return default


OLLAMA_REQUEST_TIMEOUT_SECONDS = _env_float("OLLAMA_REQUEST_TIMEOUT_SECONDS", 300.0)
OLLAMA_STREAM_CONNECT_TIMEOUT_SECONDS = _env_float("OLLAMA_STREAM_CONNECT_TIMEOUT_SECONDS", 10.0)
OLLAMA_STREAM_READ_TIMEOUT_SECONDS = _env_optional_float("OLLAMA_STREAM_READ_TIMEOUT_SECONDS", 600.0)
OLLAMA_KEEP_ALIVE = os.getenv("OLLAMA_KEEP_ALIVE", "15m")


class ChatRequest(BaseModel):
    prompt: str
    user: str = "anonymous"


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
        "keep_alive": OLLAMA_KEEP_ALIVE,
        # keep batches modest so that CPU memory for intermediate tensors
        # doesn't blow up; the server log shows 256 by default.
        "batch_size": 128,
        # limit the number of predicted tokens if client doesn't override
        "num_predict": 100,
    }


# `/chat` is a simple non-streaming proxy entrypoint.  The frontend uses this
# for quick synchronous requests or when streaming is not required.  Metrics
# instrumentation (token counts, etc.) is also triggered here.
def _save_interaction(prompt: str, response_text: str, user: str = "anonymous"):
    """Persist an interaction record to the database if available."""
    try:
        from models.interaction import InteractionModel
        from db import SessionLocal

        db = SessionLocal()
        record = InteractionModel(prompt=prompt, response=response_text, user=user)
        db.add(record)
        db.commit()
    except Exception:
        # ignore problems (database may not be configured in some environments)
        pass


@router.get("/chat_runtime_status")
def chat_runtime_status():
    return runtime_snapshot()


@router.post("/chat")
def chat(request: ChatRequest):
    user = request.user or "anonymous"
    limit = enforce_rate_limit(user)
    if not limit["allowed"]:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Retry in {limit['retry_after']}s",
        )

    payload = _build_payload(request.prompt, stream=False)

    cached = get_cached_response(request.prompt, payload["model"])
    if cached:
        _save_interaction(request.prompt, cached, user=user)
        push_session_turn(user, request.prompt, cached)
        return {"response": cached, "cached": True}

    job_id = enqueue_generation_request(user, request.prompt, payload["model"])
    set_generation_status(user, "generating")

    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json=payload,
            timeout=OLLAMA_REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Ollama request failed: {exc}") from exc
    finally:
        mark_generation_complete(job_id)
        set_generation_status(user, "idle")

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

    # persist interaction for business analytics
    response_text = data.get("response", "")
    _save_interaction(request.prompt, response_text, user=user)
    set_cached_response(request.prompt, payload["model"], response_text)
    push_session_turn(user, request.prompt, response_text)

    return {"response": response_text, "cached": False}


@router.post("/chat_stream")
def chat_stream(request: ChatRequest):
    user = request.user or "anonymous"
    limit = enforce_rate_limit(user)
    if not limit["allowed"]:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Retry in {limit['retry_after']}s",
        )

    payload = _build_payload(request.prompt, stream=True)
    cached = get_cached_response(request.prompt, payload["model"])

    if cached:
        _save_interaction(request.prompt, cached, user=user)
        push_session_turn(user, request.prompt, cached)

        def cached_stream():
            yield cached

        return StreamingResponse(cached_stream(), media_type="text/plain")

    stream_id = str(uuid.uuid4())
    job_id = enqueue_generation_request(user, request.prompt, payload["model"])
    set_generation_status(user, "generating")

    # we set stream=True on the requests call so we can iterate over the
    # token chunks as they arrive.
    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json=payload,
            stream=True,
            timeout=(
                OLLAMA_STREAM_CONNECT_TIMEOUT_SECONDS,
                OLLAMA_STREAM_READ_TIMEOUT_SECONDS,
            ),
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        mark_generation_complete(job_id)
        set_generation_status(user, "idle")
        raise HTTPException(status_code=502, detail=f"Ollama stream failed: {exc}") from exc

    # increment request count and refresh loaded models gauge before streaming
    try:
        from metrics import OLLAMA_REQUESTS, refresh_ollama_models_loaded
        OLLAMA_REQUESTS.labels(model=payload["model"]).inc()
        refresh_ollama_models_loaded(OLLAMA_URL)
    except ImportError:
        pass

    # accumulate chunks so we can persist after generation finishes
    buffer: list[str] = []

    def event_stream():
        try:
            for line in response.iter_lines():
                if not line:
                    continue
                decoded = line.decode("utf-8")
                try:
                    data = json.loads(decoded)
                    text = data.get("response", "")
                except json.JSONDecodeError:
                    text = decoded
                if text:
                    buffer.append(text)
                    append_stream_chunk(stream_id, text)
                    yield text
        finally:
            full_response = "".join(buffer)
            if full_response:
                _save_interaction(request.prompt, full_response, user=user)
                set_cached_response(request.prompt, payload["model"], full_response)
                push_session_turn(user, request.prompt, full_response)
            mark_generation_complete(job_id)
            set_generation_status(user, "idle")

    return StreamingResponse(event_stream(), media_type="text/plain")
