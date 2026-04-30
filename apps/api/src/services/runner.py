import asyncio
import json
from collections.abc import AsyncIterator

import structlog

from src.config import get_settings
from src.schemas.events import FinalEvent, ToolCallEvent, ToolResultEvent
from src.schemas.responses import RunResponse

_log = structlog.get_logger(__name__)


async def run_agent(*, prompt: str, request_id: str) -> RunResponse:
    settings = get_settings()
    if not settings.mcp_configured:
        raise NotImplementedError(
            "MCP server not configured. Set MCP_SERVER_URL (sse) "
            "or MCP_STDIO_COMMAND (stdio) in the environment."
        )
    _log.info("agent.run.start", request_id=request_id, prompt_chars=len(prompt))

    # Wire the agent loop here:
    #   from src.agents.builder import build_agent
    #   from agents import Runner
    #   async with build_agent() as agent:
    #       result = await Runner.run(agent, prompt)
    #   return RunResponse(result=str(result.final_output), tool_calls=[])

    raise NotImplementedError("Agent loop is not yet wired.")


async def stream_agent(*, prompt: str, request_id: str) -> AsyncIterator[dict]:
    settings = get_settings()
    if not settings.mcp_configured:
        yield {
            "event": "final",
            "data": json.dumps(
                FinalEvent(
                    result="MCP server not configured yet. Set MCP_SERVER_URL or MCP_STDIO_COMMAND.",
                    request_id=request_id,
                ).model_dump()
            ),
        }
        return

    _log.info("agent.stream.start", request_id=request_id, prompt_chars=len(prompt))

    # Placeholder stream - replace with Runner.run_streamed() once the agent is wired.
    yield {
        "event": "tool_call",
        "data": json.dumps(
            ToolCallEvent(name="placeholder", arguments={"prompt": prompt}).model_dump()
        ),
    }
    await asyncio.sleep(0.2)
    yield {
        "event": "tool_result",
        "data": json.dumps(ToolResultEvent(name="placeholder", result="ok").model_dump()),
    }
    await asyncio.sleep(0.2)
    yield {
        "event": "final",
        "data": json.dumps(
            FinalEvent(
                result="Streaming OK. Agent loop not yet wired.",
                request_id=request_id,
            ).model_dump()
        ),
    }
