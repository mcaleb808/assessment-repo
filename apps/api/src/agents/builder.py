from contextlib import asynccontextmanager
from typing import AsyncIterator

from src.agents.prompts import SYSTEM_PROMPT
from src.config import get_settings
from src.mcp.client import connect_mcp


@asynccontextmanager
async def build_agent() -> AsyncIterator[object]:
    """Yield an `agents.Agent` wired to the configured MCP server.

    The MCP connection is opened on enter and torn down on exit.
    """
    settings = get_settings()
    async with connect_mcp(settings) as mcp_server:
        from agents import Agent

        agent = Agent(
            name="mcp-agent",
            instructions=SYSTEM_PROMPT,
            model=settings.strong_model,
            mcp_servers=[mcp_server],
        )
        yield agent
