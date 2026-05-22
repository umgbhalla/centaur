"""Phase-1 Chat SDK-shaped event helpers for Centaur.

The upstream Chat SDK is TypeScript-first.  Centaur's control plane is Python,
so this module captures the small cross-platform contract the API needs before
any full SDK port: platform, thread, author, message parts, metadata, and
delivery target.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

ChatPlatform = Literal["slack", "discord", "web", "dev"]


class ChatAuthor(BaseModel):
    id: str
    name: str | None = None
    team_id: str | None = None


class ChatThreadRef(BaseModel):
    platform: ChatPlatform
    id: str
    channel_id: str | None = None
    team_id: str | None = None
    message_id: str | None = None


class ChatMessagePart(BaseModel):
    type: str
    text: str | None = None
    name: str | None = None
    mime_type: str | None = None
    size: int | None = None
    source: dict[str, Any] | None = None


class ChatThreadEvent(BaseModel):
    platform: ChatPlatform
    thread: ChatThreadRef
    message_id: str
    author: ChatAuthor
    parts: list[ChatMessagePart] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    delivery: dict[str, Any] = Field(default_factory=dict)

    @property
    def thread_key(self) -> str:
        return self.thread.id

    def content_parts(self) -> list[dict[str, Any]]:
        return [part.model_dump(exclude_none=True) for part in self.parts]


def build_thread_key(
    platform: str,
    *,
    team_id: str | None = None,
    channel_id: str,
    thread_id: str,
) -> str:
    """Build the durable Centaur thread key from Chat SDK-style pieces."""

    clean_platform = _clean_component(platform)
    if clean_platform == "slack" and team_id:
        return f"slack:{_clean_component(team_id)}:{_clean_component(channel_id)}:{thread_id}"
    scope = _clean_component(team_id) if team_id else "dm"
    return f"{clean_platform}:{scope}:{_clean_component(channel_id)}:{thread_id}"


def workflow_input_from_event(event: ChatThreadEvent) -> dict[str, Any]:
    """Return the generic workflow input used by platform adapters."""

    metadata = dict(event.metadata)
    metadata.setdefault("platform", event.platform)
    metadata.setdefault("source", "chat_sdk")
    metadata.setdefault(
        "chat_sdk",
        {
            "platform": event.platform,
            "thread_id": event.thread.id,
            "message_id": event.message_id,
            "author_id": event.author.id,
        },
    )
    return {
        "platform": event.platform,
        "thread_key": event.thread_key,
        "parts": event.content_parts(),
        "message_id": event.message_id,
        "user_id": event.author.id,
        "metadata": metadata,
        "delivery": normalize_delivery(event.platform, event.delivery),
    }


def normalize_delivery(platform: str, delivery: dict[str, Any] | None) -> dict[str, Any]:
    data = dict(delivery or {})
    data["platform"] = _clean_component(platform)
    if "channel_id" in data and "channel" not in data:
        data["channel"] = data["channel_id"]
    return {key: value for key, value in data.items() if value is not None}


def _clean_component(value: str) -> str:
    text = str(value or "").strip()
    if not text:
        raise ValueError("chat thread key components cannot be empty")
    if ":" in text:
        return text.replace(":", "_")
    return text
