import { centaurApiKey, type AppConfig } from '../config'
import type { NormalizedDiscordEvent } from '../discord/types'
import type { NormalizedSlackEvent } from '../slack/types'

export type CentaurHandoffResult =
  | { ok: true; status: number; body: unknown }
  | { ok: false; status: number; body: unknown }

export class CentaurHandoff {
  readonly config: AppConfig

  constructor(config: AppConfig) {
    this.config = config
  }

  async emit(event: NormalizedSlackEvent): Promise<CentaurHandoffResult> {
    return this.emitWorkflow({
      workflow_name: 'slack_thread_turn',
      trigger_key: event.message_id,
      input: {
        thread_key: event.thread_key,
        parts: event.parts,
        history_messages: event.history_messages ?? [],
        message_id: event.message_id,
        user_id: event.user_id,
        metadata: {
          source: 'slackbot',
          platform: 'slack',
          slack: {
            message_ts: event.slack.message_ts,
            enterprise_id: event.slack.enterprise_id,
            user_team: event.slack.user_team,
            source_team: event.slack.source_team
          },
          is_mention: event.is_mention
        },
        delivery: {
          platform: 'slack',
          channel: event.channel_id,
          thread_ts: event.thread_ts,
          recipient_user_id: event.user_id,
          recipient_team_id: event.recipient_team_id ?? event.team_id
        }
      }
    })
  }

  async emitDiscord(event: NormalizedDiscordEvent): Promise<CentaurHandoffResult> {
    return this.emitWorkflow({
      workflow_name: 'chat_thread_turn',
      trigger_key: event.message_id,
      input: {
        platform: 'discord',
        thread_key: event.thread_key,
        parts: event.parts,
        message_id: event.message_id,
        user_id: event.user_id,
        metadata: {
          source: 'discord',
          platform: 'discord',
          discord: {
            application_id: event.application_id,
            interaction_id: event.interaction_id,
            command_name: event.discord.command_name,
            guild_id: event.guild_id,
            channel_id: event.channel_id
          }
        },
        delivery: {
          platform: 'discord',
          application_id: event.application_id,
          interaction_token: event.interaction_token,
          channel: event.channel_id,
          channel_id: event.channel_id,
          recipient_user_id: event.user_id,
          recipient_team_id: event.guild_id
        }
      }
    })
  }

  private async emitWorkflow(body: {
    workflow_name: string
    trigger_key: string
    input: Record<string, unknown>
  }): Promise<CentaurHandoffResult> {
    const url = new URL('/workflows/runs', this.config.CENTAUR_API_URL)
    const apiKey = centaurApiKey(this.config)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify({
        workflow_name: body.workflow_name,
        trigger_key: body.trigger_key,
        eager_start: true,
        input: body.input
      })
    })

    const responseBody = await readResponseBody(response)
    return { ok: response.ok, status: response.status, body: responseBody }
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
