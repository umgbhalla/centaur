import { describe, expect, it } from 'bun:test'
import { normalizeDiscordInteraction } from './normalize'

describe('normalizeDiscordInteraction', () => {
  it('maps a slash command interaction into a Centaur chat event', () => {
    const event = normalizeDiscordInteraction({
      id: '123',
      application_id: 'app-1',
      type: 2,
      token: 'tok',
      guild_id: 'guild-1',
      channel_id: 'channel-1',
      data: {
        name: 'ask',
        options: [{ name: 'prompt', type: 3, value: 'hello' }]
      },
      member: { user: { id: 'user-1', username: 'alice' } }
    })

    expect(event).toMatchObject({
      thread_key: 'discord:guild-1:channel-1:123',
      message_id: 'discord:123',
      application_id: 'app-1',
      interaction_token: 'tok',
      channel_id: 'channel-1',
      user_id: 'user-1',
      parts: [{ type: 'text', text: '/ask prompt:hello' }]
    })
  })

  it('returns null for unsupported interaction types', () => {
    expect(normalizeDiscordInteraction({ type: 1 })).toBeNull()
  })
})
