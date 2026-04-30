from fastapi import APIRouter, HTTPException, Request
from sse_starlette.sse import EventSourceResponse

from src.schemas.requests import ChatRequest
from src.schemas.responses import ChatResponse
from src.services.runner import run_chat, stream_chat

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, request: Request) -> ChatResponse:
    try:
        return await run_chat(
            messages=payload.messages,
            request_id=request.state.request_id,
        )
    except NotImplementedError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/stream")
async def stream(payload: ChatRequest, request: Request) -> EventSourceResponse:
    generator = stream_chat(
        messages=payload.messages,
        request_id=request.state.request_id,
    )
    return EventSourceResponse(generator)
