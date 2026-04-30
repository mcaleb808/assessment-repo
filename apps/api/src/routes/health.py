from fastapi import APIRouter

from src.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, str | bool]:
    settings = get_settings()
    return {
        "status": "ok",
        "mcp_configured": settings.mcp_configured,
        "mcp_transport": settings.mcp_transport,
        "langfuse_enabled": settings.langfuse_enabled,
    }
