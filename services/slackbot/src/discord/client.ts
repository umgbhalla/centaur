import type { AppConfig } from '../config'

type DiscordMessageInput = {
  applicationId?: string
  interactionToken?: string
  channelId?: string
  content: string
}

export class DiscordClient {
  constructor(private readonly config: AppConfig) {}

  async sendMessage(input: DiscordMessageInput): Promise<void> {
    if (input.applicationId && input.interactionToken) {
      await this.postInteractionFollowup(input.applicationId, input.interactionToken, input.content)
      return
    }
    if (input.channelId && this.config.DISCORD_BOT_TOKEN) {
      await this.postChannelMessage(input.channelId, input.content)
      return
    }
    throw new Error('missing_discord_delivery_target')
  }

  private async postInteractionFollowup(
    applicationId: string,
    token: string,
    content: string
  ): Promise<void> {
    const response = await fetch(
      new URL('/api/v10/webhooks/' + applicationId + '/' + token, discordApiUrl(this.config)),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordMessageBody(content))
      }
    )
    if (!response.ok) throw new Error(await discordError(response, 'discord_followup_failed'))
  }

  private async postChannelMessage(channelId: string, content: string): Promise<void> {
    const token = this.config.DISCORD_BOT_TOKEN
    if (!token) throw new Error('discord_bot_token_not_configured')
    const response = await fetch(
      new URL('/api/v10/channels/' + channelId + '/messages', discordApiUrl(this.config)),
      {
        method: 'POST',
        headers: {
          Authorization: 'Bot ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(discordMessageBody(content))
      }
    )
    if (!response.ok) throw new Error(await discordError(response, 'discord_channel_post_failed'))
  }
}

function discordMessageBody(content: string): object {
  return {
    content,
    allowed_mentions: { parse: [] }
  }
}

function discordApiUrl(config: AppConfig): string {
  return (config.DISCORD_API_URL || 'https://discord.com').replace(/\/$/, '')
}

async function discordError(response: Response, fallback: string): Promise<string> {
  const text = await response.text().catch(() => '')
  if (!text) return fallback + ':' + response.status
  try {
    const body = JSON.parse(text) as { message?: string; code?: number | string }
    return body.message || String(body.code || fallback)
  } catch {
    return text
  }
}
