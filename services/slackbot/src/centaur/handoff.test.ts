import { describe, expect, it, mock } from 'bun:test'
import { CentaurHandoff } from './handoff'
import type { AppConfig } from '../config'
import type { NormalizedSlackEvent } from '../slack/types'

const config: AppConfig = {
  NODE_ENV: 'test',
  PORT: 3001,
  CENTAUR_API_URL: 'http://centaur-api.test',
  CENTAUR_SLACK_EVENTS_PATH: '/api/webhooks/slack',
  RUNTIME_ERROR_ALERT_CHANNEL: '',
  SLACK_EVENT_DEDUP_TTL_MS: 600000,
  SLACK_SIGNATURE_MAX_AGE_SECONDS: 300,
  CENTAUR_DISCORD_EVENTS_PATH: '/api/webhooks/discord',
  DISCORD_API_URL: 'https://discord.test',
  SLACK_FEEDBACK_COMMANDS: ['/website-feedback'],
  SLACK_FEEDBACK_LINEAR_TEAM_ID: 'team-test',
  SLACK_FEEDBACK_LINEAR_PROJECT_ID: 'project-test',
  SLACK_FEEDBACK_ALLOWED_CHANNELS: [],
  SLACKBOT_EXTERNAL_ORG_ALLOWLIST: []
}

describe('CentaurHandoff', () => {
  it('omits envelope-specific Slack event metadata from idempotent workflow input', async () => {
    const originalFetch = globalThis.fetch
    let capturedInit: RequestInit | undefined
    const fetchMock = mock(async (_input: string | URL | Request, init?: RequestInit) => {
      capturedInit = init
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })
    globalThis.fetch = fetchMock as any
    try {
      const handoff = new CentaurHandoff(config)
      const event: NormalizedSlackEvent = {
        thread_key: 'slack:T123:C123:1778883099.579529',
        message_id: 'slack:T123:C123:1778883099.579529',
        team_id: 'T123',
        user_id: 'U123',
        channel_id: 'C123',
        thread_ts: '1778883099.579529',
        is_mention: true,
        parts: [{ type: 'text', text: 'hello' }],
        slack: {
          event_id: 'Ev-envelope-one',
          event_ts: '1778883100.000000',
          message_ts: '1778883099.579529',
          enterprise_id: 'E123'
        }
      }

      await handoff.emit(event)

      expect(capturedInit).toBeDefined()
      const bodyText = capturedInit?.body
      expect(typeof bodyText).toBe('string')
      if (typeof bodyText !== 'string') throw new Error('expected JSON request body')
      const body = JSON.parse(bodyText) as {
        trigger_key: string
        input: { metadata: { slack: unknown } }
      }
      expect(body.trigger_key).toBe(event.message_id)
      expect(body.input.metadata.slack).toEqual({
        message_ts: '1778883099.579529',
        enterprise_id: 'E123'
      })
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('passes Slack attachment parts through workflow input', async () => {
    const originalFetch = globalThis.fetch
    let capturedInit: RequestInit | undefined
    const fetchMock = mock(async (_input: string | URL | Request, init?: RequestInit) => {
      capturedInit = init
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })
    globalThis.fetch = fetchMock as any
    try {
      const handoff = new CentaurHandoff(config)
      const event: NormalizedSlackEvent = {
        thread_key: 'slack:T123:C123:1778883099.579529',
        message_id: 'slack:T123:C123:1778883099.579529',
        team_id: 'T123',
        user_id: 'U123',
        channel_id: 'C123',
        thread_ts: '1778883099.579529',
        is_mention: true,
        parts: [
          { type: 'text', text: 'review this' },
          {
            type: 'document',
            name: 'report.pdf',
            mime_type: 'application/pdf',
            size: 8,
            slack_file_id: 'F123',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: 'JVBERi0xLjQ='
            }
          }
        ],
        slack: {
          event_ts: '1778883100.000000',
          message_ts: '1778883099.579529'
        }
      }

      await handoff.emit(event)

      const bodyText = capturedInit?.body
      expect(typeof bodyText).toBe('string')
      if (typeof bodyText !== 'string') throw new Error('expected JSON request body')
      const body = JSON.parse(bodyText) as {
        input: { parts: NormalizedSlackEvent['parts'] }
      }
      expect(body.input.parts[1]).toMatchObject({
        type: 'document',
        name: 'report.pdf',
        mime_type: 'application/pdf',
        slack_file_id: 'F123',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: 'JVBERi0xLjQ='
        }
      })
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('uses recipient_team_id for Slack Connect delivery routing', async () => {
    const originalFetch = globalThis.fetch
    let capturedInit: RequestInit | undefined
    const fetchMock = mock(async (_input: string | URL | Request, init?: RequestInit) => {
      capturedInit = init
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })
    globalThis.fetch = fetchMock as any
    try {
      const handoff = new CentaurHandoff(config)
      const event: NormalizedSlackEvent = {
        thread_key: 'slack:THOME:C123:1778883099.579529',
        message_id: 'slack:THOME:C123:1778883099.579529',
        team_id: 'THOME',
        recipient_team_id: 'TEXTERNAL',
        user_id: 'UEXTERNAL',
        channel_id: 'C123',
        thread_ts: '1778883099.579529',
        is_mention: true,
        parts: [{ type: 'text', text: 'hello' }],
        slack: {
          event_ts: '1778883100.000000',
          message_ts: '1778883099.579529',
          user_team: 'TEXTERNAL'
        }
      }

      await handoff.emit(event)

      const bodyText = capturedInit?.body
      expect(typeof bodyText).toBe('string')
      if (typeof bodyText !== 'string') throw new Error('expected JSON request body')
      const body = JSON.parse(bodyText) as {
        input: { delivery: { recipient_team_id: string; recipient_user_id: string } }
      }
      expect(body.input.delivery).toMatchObject({
        recipient_team_id: 'TEXTERNAL',
        recipient_user_id: 'UEXTERNAL'
      })
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('emits Discord interactions through the generic chat workflow', async () => {
    const originalFetch = globalThis.fetch
    let capturedInit: RequestInit | undefined
    const fetchMock = mock(async (_input: string | URL | Request, init?: RequestInit) => {
      capturedInit = init
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })
    globalThis.fetch = fetchMock as any
    try {
      const handoff = new CentaurHandoff(config)

      await handoff.emitDiscord({
        thread_key: 'discord:G123:C123:I123',
        message_id: 'discord:I123',
        application_id: 'A123',
        interaction_id: 'I123',
        interaction_token: 'tok',
        guild_id: 'G123',
        channel_id: 'C123',
        user_id: 'U123',
        parts: [{ type: 'text', text: '/ask prompt:hello' }],
        discord: { command_name: 'ask', interaction_type: 2 }
      })

      const bodyText = capturedInit?.body
      expect(typeof bodyText).toBe('string')
      if (typeof bodyText !== 'string') throw new Error('expected JSON request body')
      const body = JSON.parse(bodyText) as {
        workflow_name: string
        trigger_key: string
        input: {
          platform: string
          metadata: { platform: string; source: string }
          delivery: { platform: string; application_id: string; interaction_token: string }
        }
      }
      expect(body.workflow_name).toBe('chat_thread_turn')
      expect(body.trigger_key).toBe('discord:I123')
      expect(body.input.platform).toBe('discord')
      expect(body.input.metadata).toMatchObject({ platform: 'discord', source: 'discord' })
      expect(body.input.delivery).toMatchObject({
        platform: 'discord',
        application_id: 'A123',
        interaction_token: 'tok'
      })
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
