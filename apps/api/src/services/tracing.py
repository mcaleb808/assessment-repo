import structlog

from src.config import Settings

_log = structlog.get_logger(__name__)
_langfuse_client = None


def init_tracing(settings: Settings) -> None:
    global _langfuse_client
    if not settings.langfuse_enabled:
        _log.info("tracing.langfuse_disabled", reason="missing keys")
        return
    try:
        from langfuse import Langfuse

        _langfuse_client = Langfuse(
            public_key=settings.langfuse_public_key,
            secret_key=settings.langfuse_secret_key,
            host=settings.langfuse_host,
        )
        _log.info("tracing.langfuse_initialized", host=settings.langfuse_host)
    except Exception as exc:
        _log.warning("tracing.langfuse_init_failed", error=str(exc))
        _langfuse_client = None


async def shutdown_tracing() -> None:
    global _langfuse_client
    if _langfuse_client is None:
        return
    try:
        _langfuse_client.flush()
    except Exception as exc:
        _log.warning("tracing.flush_failed", error=str(exc))
    _langfuse_client = None


def get_langfuse():
    return _langfuse_client
