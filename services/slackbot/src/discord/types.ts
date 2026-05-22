export type DiscordInteraction = {
  id?: string
  application_id?: string
  type?: number
  token?: string
  guild_id?: string
  channel_id?: string
  data?: {
    id?: string
    name?: string
    type?: number
    options?: DiscordCommandOption[]
  }
  member?: {
    user?: DiscordUser
  }
  user?: DiscordUser
}

export type DiscordUser = {
  id?: string
  username?: string
  global_name?: string | null
}

export type DiscordCommandOption = {
  name?: string
  type?: number
  value?: unknown
  options?: DiscordCommandOption[]
}

export type NormalizedDiscordEvent = {
  thread_key: string
  message_id: string
  application_id: string
  interaction_id: string
  interaction_token: string
  guild_id?: string
  channel_id: string
  user_id: string
  parts: Array<{ type: 'text'; text: string }>
  discord: {
    command_name?: string
    interaction_type?: number
  }
}

export const DISCORD_INTERACTION_PING = 1
export const DISCORD_INTERACTION_APPLICATION_COMMAND = 2

export const DISCORD_RESPONSE_PONG = 1
export const DISCORD_RESPONSE_DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5
