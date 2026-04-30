from fastapi.testclient import TestClient


def test_chat_returns_503_when_unconfigured(client: TestClient) -> None:
    response = client.post(
        "/agent/chat",
        json={"messages": [{"role": "user", "content": "hi"}]},
    )
    assert response.status_code == 503


def test_chat_rejects_empty_messages(client: TestClient) -> None:
    response = client.post("/agent/chat", json={"messages": []})
    assert response.status_code == 422


def test_chat_rejects_invalid_role(client: TestClient) -> None:
    response = client.post(
        "/agent/chat",
        json={"messages": [{"role": "system", "content": "hi"}]},
    )
    assert response.status_code == 422


def test_stream_rejects_missing_body(client: TestClient) -> None:
    response = client.post("/agent/stream")
    assert response.status_code == 422
