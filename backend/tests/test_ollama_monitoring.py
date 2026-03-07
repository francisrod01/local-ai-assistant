from fastapi.testclient import TestClient

from main import app


def test_ollama_status_endpoint(monkeypatch):
    # simulate /api/ps returning one model
    class DummyPS:
        def json(self):
            return {"models": ["phi3:mini"]}

    def fake_get(url, **kwargs):
        class R:
            def json(self):
                return {"models": ["phi3:mini"]}
            headers = {"Date": "now"}
        return R()

    monkeypatch.setattr("routes.ollama.requests.get", fake_get)
    client = TestClient(app)
    resp = client.get("/ollama_status")
    assert resp.status_code == 200
    assert resp.json().get("models") == ["phi3:mini"]
    assert resp.json().get("model_source") == "loaded"


def test_ollama_status_returns_empty_when_ps_empty(monkeypatch):
    class R:
        def __init__(self, payload):
            self._payload = payload
            self.headers = {"Date": "now"}

        def json(self):
            return self._payload

    called = {"tags": 0}

    def fake_get(url, **kwargs):
        if url.endswith("/api/ps"):
            return R({"models": []})
        if url.endswith("/api/tags"):
            called["tags"] += 1
            return R({"models": [{"name": "phi3:mini", "size": 123}]})
        return R({})

    monkeypatch.setattr("routes.ollama.requests.get", fake_get)

    client = TestClient(app)
    resp = client.get("/ollama_status")
    assert resp.status_code == 200
    body = resp.json()
    assert body.get("models") == []
    assert body.get("model_source") == "none"
    assert called["tags"] == 0


def test_environment_endpoint(monkeypatch):
    # stub requests.get used in environment() helper
    class DummyE:
        def json(self):
            return {"models": ["phi3:mini"]}
    def fake_get(url, **kwargs):
        return DummyE()
    monkeypatch.setattr("routes.monitoring.requests.get", fake_get)

    client = TestClient(app)
    resp = client.get("/environment")
    assert resp.status_code == 200
    data = resp.json()
    assert "models" in data and data["models"] == ["phi3:mini"]
    assert "all_models" in data and data["all_models"] == ["phi3:mini"]
    # environment dict should contain at least one key starting with OLLAMA_
    assert any(k.startswith("OLLAMA_") for k in data.keys())


def test_environment_output_structure(monkeypatch):
    # create a realistic models list object in response
    model_obj = {
        "name": "phi3:mini",
        "model": "phi3:mini",
        "size": 2220695040,
        "digest": "deadbeef",
        "details": {"format": "gguf"},
        "expires_at": "2026-03-05T03:01:18.483249987Z",
        "size_vram": 0,
        "context_length": 256,
    }

    class DummyE:
        def json(self):
            return {"models": [model_obj]}

    monkeypatch.setattr("routes.monitoring.requests.get", lambda url, **kwargs: DummyE())

    client = TestClient(app)
    resp = client.get("/environment")
    assert resp.status_code == 200
    data = resp.json()
    assert "PATH" in data and isinstance(data["PATH"], str)
    assert "OLLAMA_URL" in data
    assert "HOME" in data
    assert isinstance(data.get("models"), list)
    assert isinstance(data["models"][0], dict)
    assert isinstance(data.get("all_models"), list)
    assert isinstance(data["all_models"][0], dict)
    # ensure object has expected keys
    for key in ("name", "model", "size", "context_length"):
        assert key in data["models"][0]


def test_environment_falls_back_to_tags_when_ps_empty(monkeypatch):
    class R:
        def __init__(self, payload):
            self._payload = payload

        def json(self):
            return self._payload

    def fake_get(url, **kwargs):
        if url.endswith("/api/ps"):
            return R({"models": []})
        if url.endswith("/api/tags"):
            return R({"models": [{"name": "phi3:mini", "size": 123}]})
        return R({})

    monkeypatch.setattr("routes.monitoring.requests.get", fake_get)

    client = TestClient(app)
    resp = client.get("/environment")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("models_source") == "none"
    assert data.get("models") == []
    assert data.get("all_models") and data["all_models"][0]["name"] == "phi3:mini"


def test_ollama_runtime_settings_endpoint(monkeypatch):
    monkeypatch.setenv("OLLAMA_REQUEST_TIMEOUT_SECONDS", "321")
    monkeypatch.setenv("OLLAMA_STREAM_CONNECT_TIMEOUT_SECONDS", "12")
    monkeypatch.setenv("OLLAMA_STREAM_READ_TIMEOUT_SECONDS", "0")
    monkeypatch.setenv("OLLAMA_WARMUP_TIMEOUT_SECONDS", "77")
    monkeypatch.setenv("OLLAMA_KEEP_ALIVE", "20m")

    client = TestClient(app)
    resp = client.get("/ollama_runtime_settings")
    assert resp.status_code == 200
    data = resp.json()

    assert data["request_timeout_seconds"] == 321.0
    assert data["stream_connect_timeout_seconds"] == 12.0
    assert data["stream_read_timeout_seconds"] is None
    assert data["stream_read_timeout_disabled"] is True
    assert data["warmup_timeout_seconds"] == 77.0
    assert data["keep_alive"] == "20m"


def test_decode_docker_logs_payload_handles_multiplexing():
    from routes import monitoring

    frame_1 = b"\x01\x00\x00\x00" + (6).to_bytes(4, "big") + b"line1\n"
    frame_2 = b"\x02\x00\x00\x00" + (6).to_bytes(4, "big") + b"line2\n"
    raw = frame_1 + frame_2

    decoded = monitoring._decode_docker_logs_payload(raw)
    assert "line1" in decoded
    assert "line2" in decoded


def test_ollama_logs_socket_fallback(monkeypatch):
    # make subprocess.check_output raise and simulate socket call returning lines
    def fake_check(*args, **kwargs):
        raise FileNotFoundError()
    monkeypatch.setattr("subprocess.check_output", fake_check)

    # intercept the helper _logs_via_socket directly
    from routes import monitoring
    monkeypatch.setattr(
        monitoring,
        "_logs_via_socket",
        lambda tail: [
            '[GIN] 2026/03/07 - 01:00:00 | 200 | 100µs | 172.18.0.9 | GET "/api/ps"',
            'time=2026-03-07T01:00:01Z level=WARN source=sched.go:518 msg="Load failed" model=phi3:mini',
        ],
    )

    client = TestClient(app)
    # request without specifying tail should succeed (default used)
    resp = client.get("/ollama_logs")
    assert resp.status_code == 200
    assert resp.json().get("logs") == [
        'time=2026-03-07T01:00:01Z level=WARN source=sched.go:518 msg="Load failed" model=phi3:mini'
    ]

    # specifying non-integer tail should trigger validation error
    resp = client.get("/ollama_logs?tail=foo")
    assert resp.status_code == 422


def test_interactions_endpoint(monkeypatch):
    # ensure the endpoint returns an empty list when DB is unavailable
    client = TestClient(app)
    resp = client.get("/interactions")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_interaction_insights_empty(monkeypatch):
    # when no interactions are present we still return numeric fields
    from routes import monitoring
    # monkeypatch query to empty
    class DummySession:
        def query(self, model):
            class Q:
                def all(self):
                    return []
            return Q()
    monkeypatch.setattr("routes.monitoring.SessionLocal", lambda: DummySession())

    client = TestClient(app)
    resp = client.get("/interaction_insights")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_interactions"] == 0
    assert data["top_prompt_terms"] == []
    assert data["avg_response_length"] == 0


def test_status_and_env_cache(monkeypatch):
    # simulate failure in requests.get and ensure graceful fallbacks/cached env
    from routes import monitoring
    # set initial cached environment
    monitoring._last_env = {"OLLAMA_URL": "http://x"}

    def bad_get(url, **kwargs):
        raise Exception("nope")
    monkeypatch.setattr("routes.monitoring.requests.get", bad_get)
    monkeypatch.setattr("routes.ollama.requests.get", bad_get)

    client = TestClient(app)
    sresp = client.get("/ollama_status")
    assert sresp.status_code == 200
    assert sresp.json()["models"] == []
    assert "error" in sresp.json()

    eres = client.get("/environment")
    assert eres.status_code == 200
    assert eres.json()["OLLAMA_URL"] == "http://x"


def test_logs_cache(monkeypatch):
    # ensure logs history persists between calls
    from routes import monitoring
    monitoring._log_history = [
        'time=2026-03-07T00:59:00Z level=WARN source=sched.go:518 msg="Load failed" model=phi3:mini'
    ]

    # first call returns additional b
    client = TestClient(app)
    monkeypatch.setattr(
        "subprocess.check_output",
        lambda *args, **kwargs: (
            b'[GIN] 2026/03/07 - 01:00:00 | 200 | 100us | 172.18.0.9 | GET "\\/api\\/ps"\n'
            b'time=2026-03-07T01:00:02Z level=ERROR source=server.go:1357 msg="runner startup failed"\n'
        ),
    )
    resp1 = client.get("/ollama_logs")
    assert resp1.json()["logs"] == [
        'time=2026-03-07T00:59:00Z level=WARN source=sched.go:518 msg="Load failed" model=phi3:mini',
        'time=2026-03-07T01:00:02Z level=ERROR source=server.go:1357 msg="runner startup failed"',
    ]
    # second call with same output should keep history unchanged
    resp2 = client.get("/ollama_logs")
    assert resp2.json()["logs"] == [
        'time=2026-03-07T00:59:00Z level=WARN source=sched.go:518 msg="Load failed" model=phi3:mini',
        'time=2026-03-07T01:00:02Z level=ERROR source=server.go:1357 msg="runner startup failed"',
    ]


def test_ollama_logs_can_include_all(monkeypatch):
    monkeypatch.setattr(
        "subprocess.check_output",
        lambda *args, **kwargs: (
            b'[GIN] 2026/03/07 - 01:00:00 | 200 | 100us | 172.18.0.9 | GET "\\/api\\/ps"\n'
            b'time=2026-03-07T01:00:03Z level=WARN source=sched.go:518 msg="Load failed" model=phi3:mini\n'
        ),
    )

    from routes import monitoring
    monitoring._log_history = []

    client = TestClient(app)
    resp = client.get("/ollama_logs?important_only=false")
    assert resp.status_code == 200
    logs = resp.json().get("logs", [])
    assert any(("/api/ps" in line) or ("/api\\/ps" in line) for line in logs)
    assert any("Load failed" in line for line in logs)


def test_ollama_logs_filters_existing_cached_noise(monkeypatch):
    from routes import monitoring
    monitoring._log_history = [
        '[GIN] 2026/03/07 - 01:00:00 | 200 | 100us | 172.18.0.9 | GET "/api/ps"',
        'time=2026-03-07T01:00:03Z level=WARN source=sched.go:518 msg="Load failed" model=phi3:mini',
    ]

    monkeypatch.setattr("subprocess.check_output", lambda *args, **kwargs: b"")

    client = TestClient(app)
    resp = client.get("/ollama_logs")
    assert resp.status_code == 200
    logs = resp.json().get("logs", [])
    assert not any("/api/ps" in line for line in logs)
    assert any("Load failed" in line for line in logs)
