from fastapi.testclient import TestClient

from main import app


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
