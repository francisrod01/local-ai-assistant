from fastapi import APIRouter
import os
import subprocess
import socket
import http.client
from typing import Any
import requests

from db import SessionLocal
from redis_store import runtime_snapshot

router = APIRouter()

# simple in-memory cache to avoid wiping when the LLM reloads
_last_status: dict[str, Any] = {"models": [], "timestamp": None}
_last_env: dict[str, Any] = {}
_log_history: list[str] = []
OLLAMA_HTTP_TIMEOUT_SECONDS = float(os.getenv("OLLAMA_HTTP_TIMEOUT_SECONDS", "5"))


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


def _runtime_settings() -> dict[str, Any]:
    stream_read_timeout = _env_optional_float("OLLAMA_STREAM_READ_TIMEOUT_SECONDS", 600.0)
    return {
        "request_timeout_seconds": _env_float("OLLAMA_REQUEST_TIMEOUT_SECONDS", 300.0),
        "stream_connect_timeout_seconds": _env_float("OLLAMA_STREAM_CONNECT_TIMEOUT_SECONDS", 10.0),
        "stream_read_timeout_seconds": stream_read_timeout,
        "stream_read_timeout_disabled": stream_read_timeout is None,
        "warmup_timeout_seconds": _env_float("OLLAMA_WARMUP_TIMEOUT_SECONDS", 90.0),
        "keep_alive": os.getenv("OLLAMA_KEEP_ALIVE", "15m"),
    }


def _resolve_loaded_ollama_models() -> tuple[list, str]:
    base_url = os.getenv("OLLAMA_URL", "http://ollama:11434")

    try:
        resp = requests.get(f"{base_url}/api/ps", timeout=OLLAMA_HTTP_TIMEOUT_SECONDS)
        loaded = resp.json().get("models", [])
        if loaded:
            return loaded, "loaded"
    except Exception:
        pass

    return [], "none"


def _resolve_all_ollama_models() -> list:
    base_url = os.getenv("OLLAMA_URL", "http://ollama:11434")

    try:
        resp = requests.get(f"{base_url}/api/tags", timeout=OLLAMA_HTTP_TIMEOUT_SECONDS)
        available = resp.json().get("models", [])
        if available:
            return available
    except Exception:
        pass

    return []


def _decode_docker_logs_payload(payload: bytes) -> str:
    if not payload:
        return ""

    chunks: list[bytes] = []
    index = 0
    has_framing = False

    while index + 8 <= len(payload):
        if payload[index + 1:index + 4] != b"\x00\x00\x00":
            break
        frame_size = int.from_bytes(payload[index + 4:index + 8], "big")
        frame_end = index + 8 + frame_size
        if frame_end > len(payload):
            break
        chunks.append(payload[index + 8:frame_end])
        index = frame_end
        has_framing = True

    if has_framing:
        payload = b"".join(chunks) + payload[index:]

    return payload.decode("utf-8", errors="replace")


def _is_model_relevant_log_line(line: str) -> bool:
    normalized = line.lower()

    # suppress noisy health/polling lines unless user asks for all logs
    if "/api/ps" in normalized:
        return False

    important_tokens = (
        "level=warn",
        "level=error",
        "panic",
        "fatal",
        "error=",
        "load failed",
        "loading model",
        "model=",
        "llama_model_loader",
        "llm_load_tensors",
        "gguf",
        "runner",
        "context",
        "gpu",
        "memory",
        "/api/generate",
        "/api/chat",
        "token",
        "eval",
    )
    return any(token in normalized for token in important_tokens)


@router.get("/interactions")
def list_interactions(limit: int = 100):
    """Return the most recent chat interactions stored in the database.

    The frontend can call this to show a history table.
    """
    try:
        from models.interaction import InteractionModel

        db = SessionLocal()
        rows = (
            db.query(InteractionModel)
            .order_by(InteractionModel.created_at.desc())
            .limit(limit)
            .all()
        )
        # convert to simple dicts
        return [
            {
                "id": r.id,
                "user": r.user,
                "prompt": r.prompt,
                "response": r.response,
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ]
    except Exception:
        return []


@router.get("/environment")
def environment():
    """Provide basic Ollama environment configuration and host vars."""
    global _last_env
    # allow heterogenous values (strings from os.environ plus lists inserted
    # later) so pylance doesn't complain.
    env: dict[str, Any] = {
        k: v
        for k, v in os.environ.items()
        if k.startswith("OLLAMA_") or k in ("PATH", "HOME")
    }
    # add model list if Ollama is accessible
    try:
        models, source = _resolve_loaded_ollama_models()
        all_models = _resolve_all_ollama_models()
        if not models and not all_models and source == "none" and _last_env:
            return _last_env
        env["models"] = models
        env["models_source"] = source
        env["all_models"] = all_models
        # update cache
        _last_env = env.copy()
    except Exception:
        # return last cached environment if available
        if _last_env:
            return _last_env
        env["models"] = []
        env["all_models"] = []

    return env


def _logs_via_socket(tail: int):
    """Use Docker HTTP API over unix socket to fetch container logs."""
    try:
        conn = http.client.HTTPConnection("localhost")
        conn.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        conn.sock.connect("/var/run/docker.sock")
        path = f"/containers/local-ai-ollama/logs?stdout=1&stderr=1&tail={tail}"
        conn.request("GET", path)
        resp = conn.getresponse()
        data = _decode_docker_logs_payload(resp.read())
        return data.splitlines()
    except Exception:
        return []


@router.get("/ollama_runtime_settings")
def ollama_runtime_settings():
    """Return effective Ollama timeout and keep-alive settings."""
    return _runtime_settings()


@router.get("/ollama_logs")
def ollama_logs(tail: int = 200, important_only: bool = True):
    """Attempt to return the last `tail` lines of the Ollama container log.

    The preferred method is running the `docker` CLI, but within a
    container that binary may not exist or the daemon may be inaccessible.
    In that case we fall back to speaking to the Docker unix socket directly
    (the backend service must have `/var/run/docker.sock` mounted for this
    to work).  If neither option succeeds we return an empty list.
    """
    global _log_history
    try:
        out = subprocess.check_output([
            "docker",
            "logs",
            "--tail",
            str(tail),
            "local-ai-ollama",
        ])
        lines = out.decode("utf-8", errors="replace").splitlines()
    except Exception:
        # fallback to socket-based HTTP API
        lines = _logs_via_socket(tail)
    if important_only:
        lines = [line for line in lines if _is_model_relevant_log_line(line)]

    # merge with existing history, avoiding duplicates
    if not _log_history:
        _log_history = lines.copy()
    else:
        existing = set(_log_history)
        for l in lines:
            if l not in existing:
                _log_history.append(l)

    if important_only:
        _log_history = [line for line in _log_history if _is_model_relevant_log_line(line)]

    return {"logs": _log_history}


@router.get("/runtime_status")
def runtime_status():
    """Return ephemeral runtime flags and queue state for frontend polling."""
    return runtime_snapshot()


@router.get("/interaction_insights")
def interaction_insights():
    # insights do not need caching - derived from interactions table
    """Return simple analytics derived from stored interactions.

    The response includes total count, top prompt terms, and average response
    length.  This is a lightweight way to see what users are asking for most
    often without exporting the entire history.
    """
    try:
        from models.interaction import InteractionModel

        db = SessionLocal()
        rows = db.query(InteractionModel).all()
    except Exception:
        rows = []

    total = len(rows)
    total_resp_len = 0
    from collections import Counter
    import re
    words = Counter()

    for r in rows:
        # tokenize prompt
        for w in re.findall(r"\w+", r.prompt.lower()):
            if len(w) > 2:
                words[w] += 1
        total_resp_len += len(r.response or "")

    top_terms = words.most_common(10)
    avg_response_len = total_resp_len / total if total > 0 else 0

    return {
        "total_interactions": total,
        "top_prompt_terms": top_terms,
        "avg_response_length": avg_response_len,
    }
