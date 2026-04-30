from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Placeholder value Terraform writes when bootstrapping a Secret Manager entry.
# Treated as "unset" so /health does not falsely report a service as ready.
PLACEHOLDER = "REPLACE_ME"


def _is_set(value: str) -> bool:
    return bool(value) and value != PLACEHOLDER


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    openai_api_key: str = ""

    mcp_transport: Literal["stdio", "sse", "streamable_http"] = "streamable_http"
    mcp_server_url: str = ""
    mcp_stdio_command: str = ""
    mcp_stdio_args: str = ""

    model: str = "gpt-4o-mini"

    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    langfuse_host: str = "https://cloud.langfuse.com"

    log_level: str = "INFO"
    cors_allow_origins: list[str] = Field(default_factory=lambda: ["*"])

    @property
    def langfuse_enabled(self) -> bool:
        return _is_set(self.langfuse_public_key) and _is_set(self.langfuse_secret_key)

    @property
    def mcp_configured(self) -> bool:
        if self.mcp_transport in ("sse", "streamable_http"):
            return _is_set(self.mcp_server_url)
        return _is_set(self.mcp_stdio_command)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
