import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("LOG_LEVEL", "WARNING")
os.environ["OPENAI_API_KEY"] = ""
os.environ["MCP_SERVER_URL"] = ""
os.environ["MCP_STDIO_COMMAND"] = ""


@pytest.fixture(scope="session")
def client() -> Iterator[TestClient]:
    from src.main import app

    with TestClient(app) as test_client:
        yield test_client
