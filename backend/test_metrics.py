from fastapi.testclient import TestClient
from main import app

def test_metrics_endpoint_present():
    client = TestClient(app)
    resp = client.get("/metrics")
    assert resp.status_code == 200
    body = resp.text
    assert "python_gc_objects_collected_total" in body


def test_startup_warms_model(monkeypatch):
    # the lifespan context in main.py sends a small generate request; ensure
    # it is issued without blowing up.  monkeypatch the global requests.post so
    # we catch the call.
    called = {"url": None, "json": None}

    def fake_post(url, json, **kwargs):
        called["url"] = url
        called["json"] = json
        class Dummy:
            def json(self):
                return {}
        return Dummy()

    monkeypatch.setattr("requests.post", fake_post)
    # constructing a new TestClient will trigger the startup event
    client = TestClient(app)
    assert called["url"] and "/api/generate" in called["url"]
    # guard against None so pylance stops complaining about attribute access
    assert called["json"] is not None and called["json"].get("model") == "phi3:mini"


def test_counters_increment_on_chat(monkeypatch):
    # simulate a chat response with usage
    class DummyResp:
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

    client.post("/chat", json={"prompt": "hello"})

    # after request, metrics should show tokens counter >0 and ollama counters
    resp = client.get("/metrics")
    body = resp.text
    assert "backend_tokens_total" in body
    assert "ollama_requests_total" in body
    # gauge may appear as ollama_models_loaded with valve 2
    assert "ollama_models_loaded" in body


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

    monkeypatch.setattr("routes.chat.requests.get", fake_get)
    client = TestClient(app)
    resp = client.get("/ollama_status")
    assert resp.status_code == 200
    assert resp.json().get("models") == ["phi3:mini"]


def test_chromadb_endpoints_and_metrics():
    client = TestClient(app)
    # insert 3 vectors
    resp = client.post("/chroma/insert", json={"num_vectors": 3})
    assert resp.status_code == 200
    assert resp.json()["vectors"] == 3
    # record a query latency
    resp = client.post("/chroma/query", json={"latency": 0.42})
    assert resp.status_code == 200
    # metrics endpoint should now contain chromadb metrics
    resp = client.get("/metrics")
    body = resp.text
    assert "chromadb_vector_insertions_total" in body
    assert "chromadb_query_duration_seconds" in body
    assert "chromadb_index_size_bytes" in body
