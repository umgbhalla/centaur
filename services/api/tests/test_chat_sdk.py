from api.chat_sdk import (
    ChatAuthor,
    ChatMessagePart,
    ChatThreadEvent,
    ChatThreadRef,
    build_thread_key,
    normalize_delivery,
    workflow_input_from_event,
)
from api.api_keys import APIKeyInfo, check_scope


def test_build_thread_key_matches_slack_shape() -> None:
    assert (
        build_thread_key(
            "slack",
            team_id="T123",
            channel_id="C123",
            thread_id="1778883099.579529",
        )
        == "slack:T123:C123:1778883099.579529"
    )


def test_build_thread_key_supports_discord_scope() -> None:
    assert (
        build_thread_key(
            "discord",
            team_id="G123",
            channel_id="C456",
            thread_id="I789",
        )
        == "discord:G123:C456:I789"
    )


def test_workflow_input_from_event_sets_chat_sdk_metadata_and_delivery() -> None:
    event = ChatThreadEvent(
        platform="discord",
        thread=ChatThreadRef(
            platform="discord",
            id="discord:G123:C456:I789",
            channel_id="C456",
            team_id="G123",
        ),
        message_id="discord:I789",
        author=ChatAuthor(id="U123", name="alice", team_id="G123"),
        parts=[ChatMessagePart(type="text", text="/ask hello")],
        metadata={"discord": {"interaction_id": "I789"}},
        delivery={
            "application_id": "A123",
            "interaction_token": "token",
            "channel_id": "C456",
        },
    )

    body = workflow_input_from_event(event)

    assert body["platform"] == "discord"
    assert body["thread_key"] == "discord:G123:C456:I789"
    assert body["parts"] == [{"type": "text", "text": "/ask hello"}]
    assert body["metadata"]["source"] == "chat_sdk"
    assert body["metadata"]["chat_sdk"]["platform"] == "discord"
    assert body["delivery"] == {
        "platform": "discord",
        "application_id": "A123",
        "interaction_token": "token",
        "channel_id": "C456",
        "channel": "C456",
    }


def test_normalize_delivery_drops_none_values() -> None:
    assert normalize_delivery("discord", {"channel_id": "C1", "thread_ts": None}) == {
        "platform": "discord",
        "channel_id": "C1",
        "channel": "C1",
    }


def test_slackbot_service_key_can_create_chat_workflows() -> None:
    key_info = APIKeyInfo(
        id="test",
        name="service:slackbot",
        key_prefix="aiv2_tes",
        scopes=["agent", "workflows:*"],
        created_by="test",
    )

    assert check_scope(key_info, "workflows", "chat_thread_turn")
