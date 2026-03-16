from fastapi.testclient import TestClient

from main import app


def test_counters_increment_on_chat(monkeypatch):
    # simulate a chat response with usage
    class DummyResp:
        def raise_for_status(self):
            return None

        def json(self):
            return {"response": "hi", "usage": {"total_tokens": 5}}

    def fake_post(url, json, **kwargs):
        return DummyResp()

    monkeypatch.setattr("routes.chat.requests.post", fake_post)

    client = TestClient(app)
    # make /api/ps return two models so gauge is updated
    def fake_ps(url, **kwargs):
        class R:
            def json(self):
                return {"models": ["phi3:mini", "gemma:2b"]}
        return R()
    monkeypatch.setattr("routes.chat.requests.get", fake_ps)

    client.post("/chat", json={"prompt": "hello", "user": "test_metrics_user"})

    # after request, metrics should show tokens counter >0 and ollama counters
    resp = client.get("/metrics")
    body = resp.text
    assert "backend_tokens_total" in body
    assert "ollama_requests_total" in body
    # gauge may appear as ollama_models_loaded with valve 2
    assert "ollama_models_loaded" in body


def test_chat_rate_limited(monkeypatch):
    monkeypatch.setattr(
        "routes.chat.enforce_rate_limit",
        lambda user: {"allowed": False, "remaining": 0, "retry_after": 7},
    )

    client = TestClient(app)
    resp = client.post("/chat", json={"prompt": "hello", "user": "u1"})
    assert resp.status_code == 429
    assert "Rate limit exceeded" in resp.json()["detail"]


def test_chat_uses_cached_response(monkeypatch):
    monkeypatch.setattr(
        "routes.chat.enforce_rate_limit",
        lambda user: {"allowed": True, "remaining": 10, "retry_after": 0},
    )
    monkeypatch.setattr("routes.chat.get_cached_response", lambda prompt, model: "cached-answer")

    called = {"post": 0}

    def fake_post(url, json, **kwargs):
        called["post"] += 1

        class DummyResp:
            def raise_for_status(self):
                return None

            def json(self):
                return {"response": "should-not-be-used", "usage": {"total_tokens": 2}}

        return DummyResp()

    monkeypatch.setattr("routes.chat.requests.post", fake_post)

    client = TestClient(app)
    resp = client.post("/chat", json={"prompt": "hello", "user": "u1"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["response"] == "cached-answer"
    assert data["cached"] is True
    assert called["post"] == 0
