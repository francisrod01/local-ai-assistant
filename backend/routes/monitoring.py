from fastapi import APIRouter
import os
import subprocess
import socket
import http.client
from typing import Any, List
import requests

from db import SessionLocal
from redis_store import runtime_snapshot

router = APIRouter()

# simple in-memory cache to avoid wiping when the LLM reloads
_last_status: dict[str, Any] = {"models": [], "timestamp": None}
_last_env: dict[str, Any] = {}
_log_history: list[str] = []


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
        resp = requests.get(os.getenv("OLLAMA_URL", "http://ollama:11434") + "/api/ps")
        models = resp.json().get("models", [])
        env["models"] = models
        # update cache
        _last_env = env.copy()
    except Exception:
        # return last cached environment if available
        if _last_env:
            return _last_env
        env["models"] = []

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
        data = resp.read().decode("utf-8")
        return data.splitlines()
    except Exception:
        return []


@router.get("/ollama_logs")
def ollama_logs(tail: int = 200):
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
        lines = out.decode("utf-8").splitlines()
    except Exception:
        # fallback to socket-based HTTP API
        lines = _logs_via_socket(tail)
    # merge with existing history, avoiding duplicates
    if not _log_history:
        _log_history = lines.copy()
    else:
        existing = set(_log_history)
        for l in lines:
            if l not in existing:
                _log_history.append(l)
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
