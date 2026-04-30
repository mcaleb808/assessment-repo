import shlex
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from src.config import Settings


@asynccontextmanager
async def connect_mcp(settings: Settings) -> AsyncIterator[object]:
    transport = settings.mcp_transport

    if transport == "streamable_http":
        if not settings.mcp_server_url:
            raise RuntimeError("MCP_SERVER_URL is required when MCP_TRANSPORT=streamable_http")
        from agents.mcp import MCPServerStreamableHttp

        async with MCPServerStreamableHttp(params={"url": settings.mcp_server_url}) as server:
            yield server
        return

    if transport == "sse":
        if not settings.mcp_server_url:
            raise RuntimeError("MCP_SERVER_URL is required when MCP_TRANSPORT=sse")
        from agents.mcp import MCPServerSse

        async with MCPServerSse(params={"url": settings.mcp_server_url}) as server:
            yield server
        return

    if not settings.mcp_stdio_command:
        raise RuntimeError("MCP_STDIO_COMMAND is required when MCP_TRANSPORT=stdio")
    from agents.mcp import MCPServerStdio

    args = shlex.split(settings.mcp_stdio_args) if settings.mcp_stdio_args else []
    async with MCPServerStdio(
        params={"command": settings.mcp_stdio_command, "args": args}
    ) as server:
        yield server
