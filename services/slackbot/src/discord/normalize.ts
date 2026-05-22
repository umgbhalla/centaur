import type { DiscordCommandOption, DiscordInteraction, NormalizedDiscordEvent } from './types'
import { DISCORD_INTERACTION_APPLICATION_COMMAND } from './types'

export function normalizeDiscordInteraction(
  interaction: DiscordInteraction
): NormalizedDiscordEvent | null {
  if (interaction.type !== DISCORD_INTERACTION_APPLICATION_COMMAND) return null
  const applicationId = clean(interaction.application_id)
  const interactionId = clean(interaction.id)
  const interactionToken = clean(interaction.token)
  const channelId = clean(interaction.channel_id)
  const user = interaction.member?.user ?? interaction.user
  const userId = clean(user?.id)
  if (!applicationId || !interactionId || !interactionToken || !channelId || !userId) return null

  const guildId = clean(interaction.guild_id)
  const commandName = clean(interaction.data?.name) || 'command'
  const text = commandText(commandName, interaction.data?.options)
  const scope = guildId || 'dm'

  return {
    thread_key: 'discord:' + scope + ':' + channelId + ':' + interactionId,
    message_id: 'discord:' + interactionId,
    application_id: applicationId,
    interaction_id: interactionId,
    interaction_token: interactionToken,
    ...(guildId ? { guild_id: guildId } : {}),
    channel_id: channelId,
    user_id: userId,
    parts: [{ type: 'text', text }],
    discord: {
      command_name: commandName,
      interaction_type: interaction.type
    }
  }
}

function commandText(name: string, options: DiscordCommandOption[] | undefined): string {
  const rendered = renderOptions(options)
  return rendered ? '/' + name + ' ' + rendered : '/' + name
}

function renderOptions(options: DiscordCommandOption[] | undefined): string {
  if (!Array.isArray(options)) return ''
  return options
    .map(option => {
      const name = clean(option.name)
      if (!name) return ''
      if (Array.isArray(option.options) && option.options.length) {
        const nested = renderOptions(option.options)
        return nested ? name + ' ' + nested : name
      }
      const value = option.value
      if (value === undefined || value === null || value === '') return name
      return name + ':' + String(value)
    })
    .filter(Boolean)
    .join(' ')
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
