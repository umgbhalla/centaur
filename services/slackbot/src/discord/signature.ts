type DiscordSignatureInput = {
  rawBody: string
  publicKey?: string
  signature?: string | null
  timestamp?: string | null
}

export type DiscordSignatureResult =
  | { ok: true }
  | { ok: false; status: 400 | 401 | 503; reason: string }

export async function verifyDiscordSignature(
  input: DiscordSignatureInput
): Promise<DiscordSignatureResult> {
  const publicKey = cleanHex(input.publicKey)
  if (!publicKey) return { ok: false, status: 503, reason: 'discord_public_key_not_configured' }
  const signature = cleanHex(input.signature)
  const timestamp = input.timestamp?.trim()
  if (!signature || !timestamp) {
    return { ok: false, status: 401, reason: 'missing_discord_signature' }
  }

  let keyBytes: Uint8Array
  let signatureBytes: Uint8Array
  try {
    keyBytes = hexToBytes(publicKey)
    signatureBytes = hexToBytes(signature)
  } catch {
    return { ok: false, status: 400, reason: 'invalid_discord_signature_hex' }
  }
  if (keyBytes.byteLength !== 32 || signatureBytes.byteLength !== 64) {
    return { ok: false, status: 400, reason: 'invalid_discord_signature_length' }
  }

  try {
    const key = await crypto.subtle.importKey('raw', toArrayBuffer(keyBytes), { name: 'Ed25519' }, false, [
      'verify'
    ])
    const data = new TextEncoder().encode(timestamp + input.rawBody)
    const ok = await crypto.subtle.verify(
      'Ed25519',
      key,
      toArrayBuffer(signatureBytes),
      toArrayBuffer(data)
    )
    return ok ? { ok: true } : { ok: false, status: 401, reason: 'invalid_discord_signature' }
  } catch {
    return { ok: false, status: 400, reason: 'discord_signature_verification_unavailable' }
  }
}

function cleanHex(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) {
    throw new Error('invalid hex')
  }
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}
