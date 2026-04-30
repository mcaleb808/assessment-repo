from pydantic import BaseModel, Field


class ToolCall(BaseModel):
    name: str
    arguments: dict = Field(default_factory=dict)
    result: str | None = None
    error: str | None = None


class ChatResponse(BaseModel):
    reply: str
    tool_calls: list[ToolCall] = Field(default_factory=list)
    request_id: str | None = None
    trace_id: str | None = None
