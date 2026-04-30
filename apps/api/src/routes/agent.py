from fastapi import APIRouter, HTTPException, Request
from sse_starlette.sse import EventSourceResponse

from src.schemas.requests import RunRequest
from src.schemas.responses import RunResponse
from src.services.runner import run_agent, stream_agent

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/run", response_model=RunResponse)
async def run(payload: RunRequest, request: Request) -> RunResponse:
    try:
        return await run_agent(prompt=payload.prompt, request_id=request.state.request_id)
    except NotImplementedError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/stream")
async def stream(prompt: str, request: Request) -> EventSourceResponse:
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt is required")
    generator = stream_agent(prompt=prompt, request_id=request.state.request_id)
    return EventSourceResponse(generator)
