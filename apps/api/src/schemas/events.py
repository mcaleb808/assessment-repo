from typing import Literal

from pydantic import BaseModel, Field


class ToolCallEvent(BaseModel):
    type: Literal["tool_call"] = "tool_call"
    name: str
    arguments: dict = Field(default_factory=dict)


class ToolResultEvent(BaseModel):
    type: Literal["tool_result"] = "tool_result"
    name: str
    result: str | None = None
    error: str | None = None


class FinalEvent(BaseModel):
    type: Literal["final"] = "final"
    result: str
    request_id: str | None = None
    trace_id: str | None = None
