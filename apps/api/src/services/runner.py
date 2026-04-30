import json
from collections.abc import AsyncIterator
from typing import Any

import structlog

from src.config import get_settings
from src.schemas.events import FinalEvent, ToolCallEvent, ToolResultEvent
from src.schemas.requests import Message
from src.schemas.responses import ChatResponse, ToolCall

_log = structlog.get_logger(__name__)


def _to_input_items(messages: list[Message]) -> list[dict[str, str]]:
    return [{"role": m.role, "content": m.content} for m in messages]


def _extract_tool_call(item: Any) -> tuple[str, dict]:
    raw = getattr(item, "raw_item", None)
    name = getattr(raw, "name", None) or getattr(item, "name", "unknown")
    arguments_raw = getattr(raw, "arguments", None) or getattr(item, "arguments", "{}")
    try:
        arguments = (
            json.loads(arguments_raw) if isinstance(arguments_raw, str) else dict(arguments_raw)
        )
    except (ValueError, TypeError):
        arguments = {"_raw": str(arguments_raw)}
    return name, arguments


def _extract_tool_output(item: Any) -> tuple[str, str]:
    raw = getattr(item, "raw_item", None)
    name = (raw.get("name") if isinstance(raw, dict) else getattr(raw, "name", None)) or "unknown"
    output = getattr(item, "output", None)
    if output is None and isinstance(raw, dict):
        output = raw.get("output")
    return name, "" if output is None else str(output)


def _collect_tool_calls(items: list[Any]) -> list[ToolCall]:
    calls: dict[str, ToolCall] = {}
    order: list[str] = []
    for item in items:
        if getattr(item, "type", None) == "tool_call_item":
            raw = getattr(item, "raw_item", None)
            call_id = getattr(raw, "call_id", None) or str(id(item))
            name, arguments = _extract_tool_call(item)
            calls[call_id] = ToolCall(name=name, arguments=arguments)
            order.append(call_id)
        elif getattr(item, "type", None) == "tool_call_output_item":
            raw = getattr(item, "raw_item", None)
            call_id = raw.get("call_id") if isinstance(raw, dict) else getattr(raw, "call_id", None)
            if call_id and call_id in calls:
                _, output = _extract_tool_output(item)
                calls[call_id] = calls[call_id].model_copy(update={"result": output})
    return [calls[cid] for cid in order]


async def run_chat(*, messages: list[Message], request_id: str) -> ChatResponse:
    settings = get_settings()
    if not settings.mcp_configured or not settings.openai_api_key:
        raise NotImplementedError(
            "Server not configured. OPENAI_API_KEY and MCP_SERVER_URL must be set."
        )

    from agents import Runner
    from src.agents.builder import build_agent

    _log.info("chat.run.start", request_id=request_id, turns=len(messages))

    async with build_agent() as agent:
        result = await Runner.run(agent, _to_input_items(messages))

    tool_calls = _collect_tool_calls(getattr(result, "new_items", []) or [])
    return ChatResponse(
        reply=str(result.final_output),
        tool_calls=tool_calls,
        request_id=request_id,
    )


async def stream_chat(*, messages: list[Message], request_id: str) -> AsyncIterator[dict]:
    settings = get_settings()
    if not settings.mcp_configured or not settings.openai_api_key:
        yield _sse(
            "final",
            FinalEvent(
                result="Server not configured. Set OPENAI_API_KEY and MCP_SERVER_URL.",
                request_id=request_id,
            ),
        )
        return

    from agents import Runner
    from src.agents.builder import build_agent

    _log.info("chat.stream.start", request_id=request_id, turns=len(messages))

    async with build_agent() as agent:
        run = Runner.run_streamed(agent, _to_input_items(messages))
        async for event in run.stream_events():
            if getattr(event, "type", None) != "run_item_stream_event":
                continue
            item = event.item
            item_type = getattr(item, "type", None)
            if item_type == "tool_call_item":
                name, arguments = _extract_tool_call(item)
                yield _sse("tool_call", ToolCallEvent(name=name, arguments=arguments))
            elif item_type == "tool_call_output_item":
                name, output = _extract_tool_output(item)
                yield _sse("tool_result", ToolResultEvent(name=name, result=output))

        yield _sse(
            "final",
            FinalEvent(result=str(run.final_output), request_id=request_id),
        )


def _sse(event: str, payload: Any) -> dict:
    return {"event": event, "data": json.dumps(payload.model_dump())}
