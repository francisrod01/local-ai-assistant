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
    # enter TestClient context to trigger startup lifecycle
    with TestClient(app):
        pass
    assert called["url"] and "/api/generate" in called["url"]
    # guard against None so pylance stops complaining about attribute access
    assert called["json"] is not None and called["json"].get("model") == "phi3:mini"
