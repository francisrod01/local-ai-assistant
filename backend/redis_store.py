import hashlib
import json
import os
import time
import uuid
from threading import Lock
from typing import Any

try:
    import redis
except Exception:  # pragma: no cover - optional dependency in some local setups
    redis = None


REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
CACHE_TTL_SECONDS = int(os.getenv("REDIS_CACHE_TTL_SECONDS", "3600"))
SESSION_TTL_SECONDS = int(os.getenv("REDIS_SESSION_TTL_SECONDS", "86400"))
STREAM_TTL_SECONDS = int(os.getenv("REDIS_STREAM_TTL_SECONDS", "300"))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
RATE_LIMIT_MAX_REQUESTS = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "30"))


_client: Any = None
_last_connect_attempt = 0.0
_lock = Lock()


_fallback_values: dict[str, tuple[str, float | None]] = {}
_fallback_lists: dict[str, list[str]] = {}


def _now() -> float:
    return time.time()


def _fallback_cleanup(key: str):
    item = _fallback_values.get(key)
    if item is None:
        return
    _, expires_at = item
    if expires_at is not None and expires_at <= _now():
        _fallback_values.pop(key, None)


def _fallback_get(key: str) -> str | None:
    _fallback_cleanup(key)
    item = _fallback_values.get(key)
    if item is None:
        return None
    return item[0]


def _fallback_set(key: str, value: str, ttl_seconds: int | None = None):
    expires_at = _now() + ttl_seconds if ttl_seconds else None
    _fallback_values[key] = (value, expires_at)


def _fallback_incr(key: str) -> int:
    current = _fallback_get(key)
    value = int(current) if current is not None else 0
    value += 1
    _, exp = _fallback_values.get(key, ("", None))
    _fallback_values[key] = (str(value), exp)
    return value


def _fallback_ttl(key: str) -> int:
    _fallback_cleanup(key)
    item = _fallback_values.get(key)
    if item is None:
        return -2
    _, expires_at = item
    if expires_at is None:
        return -1
    return max(0, int(expires_at - _now()))


def _fallback_expire(key: str, ttl_seconds: int):
    value = _fallback_get(key)
    if value is None:
        return
    _fallback_values[key] = (value, _now() + ttl_seconds)


def _fallback_rpush(key: str, value: str):
    _fallback_lists.setdefault(key, []).append(value)


def _fallback_lrem(key: str, count: int, value: str):
    items = _fallback_lists.get(key, [])
    if count == 0:
        _fallback_lists[key] = [v for v in items if v != value]
        return
    removed = 0
    kept: list[str] = []
    for item in items:
        if item == value and removed < abs(count):
            removed += 1
            continue
        kept.append(item)
    _fallback_lists[key] = kept


def _fallback_ltrim_tail(key: str, max_items: int):
    items = _fallback_lists.get(key, [])
    if len(items) > max_items:
        _fallback_lists[key] = items[-max_items:]


def _fallback_lrange_tail(key: str, limit: int) -> list[str]:
    items = _fallback_lists.get(key, [])
    return items[-limit:] if limit > 0 else items


def _fallback_llen(key: str) -> int:
    return len(_fallback_lists.get(key, []))


def _get_client():
    global _client, _last_connect_attempt
    if redis is None:
        return None

    if _client is not None:
        return _client

    now = _now()
    if now - _last_connect_attempt < 5:
        return None

    with _lock:
        if _client is not None:
            return _client
        _last_connect_attempt = now
        try:
            candidate = redis.Redis.from_url(REDIS_URL, decode_responses=True)
            candidate.ping()
            _client = candidate
            return _client
        except Exception:
            _client = None
            return None


def is_redis_available() -> bool:
    return _get_client() is not None


def _prompt_hash(prompt: str) -> str:
    return hashlib.sha256(prompt.encode("utf-8")).hexdigest()


def get_cached_response(prompt: str, model: str) -> str | None:
    key = f"cache:chat:{model}:{_prompt_hash(prompt)}"
    client = _get_client()
    if client is None:
        return _fallback_get(key)
    try:
        return client.get(key)
    except Exception:
        return _fallback_get(key)


def set_cached_response(prompt: str, model: str, response_text: str, ttl_seconds: int = CACHE_TTL_SECONDS):
    key = f"cache:chat:{model}:{_prompt_hash(prompt)}"
    client = _get_client()
    if client is None:
        _fallback_set(key, response_text, ttl_seconds)
        return
    try:
        client.setex(key, ttl_seconds, response_text)
    except Exception:
        _fallback_set(key, response_text, ttl_seconds)


def enforce_rate_limit(
    user_id: str,
    max_requests: int = RATE_LIMIT_MAX_REQUESTS,
    window_seconds: int = RATE_LIMIT_WINDOW_SECONDS,
) -> dict[str, int | bool]:
    key = f"ratelimit:{user_id}"
    client = _get_client()

    if client is None:
        current = _fallback_incr(key)
        if current == 1:
            _fallback_expire(key, window_seconds)
        ttl = _fallback_ttl(key)
    else:
        try:
            current = client.incr(key)
            if current == 1:
                client.expire(key, window_seconds)
            ttl = client.ttl(key)
        except Exception:
            current = _fallback_incr(key)
            if current == 1:
                _fallback_expire(key, window_seconds)
            ttl = _fallback_ttl(key)

    allowed = current <= max_requests
    remaining = max(0, max_requests - current)
    retry_after = max(0, ttl if ttl >= 0 else window_seconds)

    return {
        "allowed": allowed,
        "remaining": remaining,
        "retry_after": retry_after,
    }


def enqueue_generation_request(user_id: str, prompt: str, model: str) -> str:
    job_id = str(uuid.uuid4())
    payload = json.dumps(
        {
            "job_id": job_id,
            "user": user_id,
            "model": model,
            "prompt": prompt,
            "ts": int(_now()),
        }
    )
    log_key = "chat:request_log"
    pending_key = "chat:pending"

    client = _get_client()
    if client is None:
        _fallback_rpush(log_key, payload)
        _fallback_ltrim_tail(log_key, 200)
        _fallback_rpush(pending_key, job_id)
        return job_id

    try:
        client.rpush(log_key, payload)
        client.ltrim(log_key, -200, -1)
        client.rpush(pending_key, job_id)
    except Exception:
        _fallback_rpush(log_key, payload)
        _fallback_ltrim_tail(log_key, 200)
        _fallback_rpush(pending_key, job_id)
    return job_id


def mark_generation_complete(job_id: str):
    pending_key = "chat:pending"
    client = _get_client()
    if client is None:
        _fallback_lrem(pending_key, 1, job_id)
        return
    try:
        client.lrem(pending_key, 1, job_id)
    except Exception:
        _fallback_lrem(pending_key, 1, job_id)


def get_queue_depth() -> int:
    pending_key = "chat:pending"
    client = _get_client()
    if client is None:
        return _fallback_llen(pending_key)
    try:
        return int(client.llen(pending_key))
    except Exception:
        return _fallback_llen(pending_key)


def set_generation_status(user_id: str, status: str, ttl_seconds: int = 30):
    key = f"status:gen:{user_id}"
    client = _get_client()
    if client is None:
        _fallback_set(key, status, ttl_seconds)
        return
    try:
        client.setex(key, ttl_seconds, status)
    except Exception:
        _fallback_set(key, status, ttl_seconds)


def append_stream_chunk(stream_id: str, chunk: str, ttl_seconds: int = STREAM_TTL_SECONDS):
    key = f"stream:{stream_id}"
    client = _get_client()
    if client is None:
        current = _fallback_get(key) or ""
        _fallback_set(key, current + chunk, ttl_seconds)
        return
    try:
        current = client.get(key) or ""
        client.setex(key, ttl_seconds, current + chunk)
    except Exception:
        current = _fallback_get(key) or ""
        _fallback_set(key, current + chunk, ttl_seconds)


def get_stream_buffer(stream_id: str) -> str:
    key = f"stream:{stream_id}"
    client = _get_client()
    if client is None:
        return _fallback_get(key) or ""
    try:
        return client.get(key) or ""
    except Exception:
        return _fallback_get(key) or ""


def push_session_turn(user_id: str, prompt: str, response_text: str, max_items: int = 50):
    key = f"session:{user_id}"
    payload = json.dumps(
        {
            "prompt": prompt,
            "response": response_text,
            "ts": int(_now()),
        }
    )
    client = _get_client()
    if client is None:
        _fallback_rpush(key, payload)
        _fallback_ltrim_tail(key, max_items)
        _fallback_set(f"{key}:ttl", "1", SESSION_TTL_SECONDS)
        return
    try:
        client.rpush(key, payload)
        client.ltrim(key, -max_items, -1)
        client.expire(key, SESSION_TTL_SECONDS)
    except Exception:
        _fallback_rpush(key, payload)
        _fallback_ltrim_tail(key, max_items)


def get_session_turns(user_id: str, limit: int = 20) -> list[dict[str, Any]]:
    key = f"session:{user_id}"
    client = _get_client()
    if client is None:
        values = _fallback_lrange_tail(key, limit)
    else:
        try:
            values = client.lrange(key, -limit, -1)
        except Exception:
            values = _fallback_lrange_tail(key, limit)

    out: list[dict[str, Any]] = []
    for raw in values:
        try:
            out.append(json.loads(raw))
        except Exception:
            continue
    return out


def set_system_flag(name: str, value: str, ttl_seconds: int = 120):
    key = f"flag:{name}"
    client = _get_client()
    if client is None:
        _fallback_set(key, value, ttl_seconds)
        return
    try:
        client.setex(key, ttl_seconds, value)
    except Exception:
        _fallback_set(key, value, ttl_seconds)


def get_system_flag(name: str) -> str | None:
    key = f"flag:{name}"
    client = _get_client()
    if client is None:
        return _fallback_get(key)
    try:
        return client.get(key)
    except Exception:
        return _fallback_get(key)


def runtime_snapshot() -> dict[str, Any]:
    return {
        "redis_available": is_redis_available(),
        "queue_depth": get_queue_depth(),
        "model_warming_up": (get_system_flag("model_warming_up") == "1"),
    }
