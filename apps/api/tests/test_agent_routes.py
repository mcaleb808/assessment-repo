from fastapi.testclient import TestClient


def test_run_returns_503_when_mcp_unconfigured(client: TestClient) -> None:
    response = client.post("/agent/run", json={"prompt": "hi"})
    assert response.status_code == 503
    assert "MCP server not configured" in response.json()["detail"]


def test_run_rejects_empty_prompt(client: TestClient) -> None:
    response = client.post("/agent/run", json={"prompt": ""})
    assert response.status_code == 422


def test_stream_rejects_missing_prompt(client: TestClient) -> None:
    response = client.get("/agent/stream")
    assert response.status_code == 422
