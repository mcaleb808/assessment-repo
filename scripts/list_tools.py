"""Connect to an MCP server and dump its tool schemas to tools.json.

Usage:
    URL=https://example.com/sse python scripts/list_tools.py
    CMD="uv run mcp-server-fetch" python scripts/list_tools.py
"""

from __future__ import annotations

import asyncio
import json
import os
import shlex
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "tools.json"


async def via_sse(url: str) -> list[dict]:
    from mcp import ClientSession
    from mcp.client.sse import sse_client

    async with sse_client(url) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            response = await session.list_tools()
            return [
                {
                    "name": tool.name,
                    "description": tool.description,
                    "inputSchema": tool.inputSchema,
                }
                for tool in response.tools
            ]


async def via_stdio(command: str) -> list[dict]:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    parts = shlex.split(command)
    if not parts:
        raise SystemExit("CMD is empty")
    params = StdioServerParameters(command=parts[0], args=parts[1:])
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            response = await session.list_tools()
            return [
                {
                    "name": tool.name,
                    "description": tool.description,
                    "inputSchema": tool.inputSchema,
                }
                for tool in response.tools
            ]


async def main() -> None:
    url = os.environ.get("URL") or os.environ.get("MCP_SERVER_URL")
    cmd = os.environ.get("CMD") or os.environ.get("MCP_STDIO_COMMAND")
    if url:
        tools = await via_sse(url)
        transport = f"sse {url}"
    elif cmd:
        tools = await via_stdio(cmd)
        transport = f"stdio {cmd}"
    else:
        sys.stderr.write("set URL=... for SSE or CMD=... for stdio\n")
        sys.exit(1)

    OUT.write_text(json.dumps({"transport": transport, "tools": tools}, indent=2))
    print(f"wrote {len(tools)} tools to {OUT}")
    for tool in tools:
        print(f"  - {tool['name']}: {tool['description'] or '(no description)'}")


if __name__ == "__main__":
    asyncio.run(main())
