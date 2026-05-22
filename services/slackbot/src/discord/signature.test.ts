import { describe, expect, it } from 'bun:test'
import { verifyDiscordSignature } from './signature'

describe('verifyDiscordSignature', () => {
  it('fails closed when Discord public key is missing', async () => {
    await expect(verifyDiscordSignature({ rawBody: '{}', signature: '00', timestamp: '1' })).resolves.toEqual({
      ok: false,
      status: 503,
      reason: 'discord_public_key_not_configured'
    })
  })

  it('rejects malformed hex before verification', async () => {
    await expect(
      verifyDiscordSignature({
        rawBody: '{}',
        publicKey: 'not-hex',
        signature: '00',
        timestamp: '1'
      })
    ).resolves.toEqual({
      ok: false,
      status: 400,
      reason: 'invalid_discord_signature_hex'
    })
  })
})
