"""Workflow: single agent turn from a Chat SDK-shaped platform event."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from api.chat_sdk import ChatAuthor, ChatMessagePart, ChatThreadEvent, ChatThreadRef
from api.runtime_control import ControlPlaneError
from api.workflow_engine import Delivery, WorkflowContext

WORKFLOW_NAME = "chat_thread_turn"


@dataclass
class Input:
    platform: str = "dev"
    thread_key: str = ""
    parts: list[dict[str, Any]] = field(default_factory=list)
    text: str | None = None
    message_id: str | None = None
    user_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    history_messages: list[dict[str, Any]] = field(default_factory=list)
    delivery: Delivery = field(default_factory=Delivery)
    harness: str | None = None
    persona: str | None = None
    agents_md_override: str | None = None

    @property
    def effective_parts(self) -> list[dict[str, Any]]:
        if self.parts:
            return [p for p in self.parts if isinstance(p, dict)]
        if self.text and self.text.strip():
            return [{"type": "text", "text": self.text.strip()}]
        raise ControlPlaneError(
            "INVALID_WORKFLOW_INPUT",
            "chat_thread_turn input must include non-empty parts or text",
            422,
        )


async def handler(inp: Input, ctx: WorkflowContext) -> dict[str, Any]:
    """Spawn -> message -> execute -> wait for terminal agent result."""

    platform = (inp.platform or "dev").strip().lower()
    thread_key = inp.thread_key.strip()
    if not thread_key:
        raise ControlPlaneError(
            "INVALID_WORKFLOW_INPUT",
            "chat_thread_turn requires thread_key",
            422,
        )

    if platform == "slack":
        from api.workflows.slack_thread_turn import Input as SlackInput
        from api.workflows.slack_thread_turn import handler as slack_handler

        return await slack_handler(
            SlackInput(
                thread_key=thread_key,
                parts=inp.effective_parts,
                text=inp.text,
                message_id=inp.message_id,
                user_id=inp.user_id,
                metadata=inp.metadata,
                history_messages=inp.history_messages,
                delivery=inp.delivery,
                harness=inp.harness,
                persona=inp.persona,
                agents_md_override=inp.agents_md_override,
            ),
            ctx,
        )

    from api.workflow_engine import do_agent_turn

    event = ChatThreadEvent(
        platform=platform,
        thread=ChatThreadRef(platform=platform, id=thread_key),
        message_id=inp.message_id or f"chat:{ctx.run_id}:message",
        author=ChatAuthor(id=inp.user_id or "unknown"),
        parts=[ChatMessagePart.model_validate(part) for part in inp.effective_parts],
        metadata=inp.metadata,
        delivery=inp.delivery.to_dict() if isinstance(inp.delivery, Delivery) else dict(inp.delivery),
    )
    metadata = dict(inp.metadata)
    metadata.setdefault("platform", platform)
    metadata.setdefault("source", "chat_sdk")

    return await do_agent_turn(
        ctx,
        thread_key=event.thread_key,
        parts=event.content_parts(),
        history_messages=inp.history_messages,
        message_id=event.message_id,
        user_id=event.author.id,
        metadata=metadata,
        delivery=event.delivery,
        harness=inp.harness,
        persona=inp.persona,
        agents_md_override=inp.agents_md_override,
    )
