import type { FullPayment } from '@/types/Payment'

function normalizeSpkiBase64(publicKey: string): string {
  return publicKey
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '')
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

async function importRsaOaepPublicKey(publicKey: string): Promise<CryptoKey> {
  const spki = base64ToArrayBuffer(normalizeSpkiBase64(publicKey))
  return crypto.subtle.importKey(
    'spki',
    spki,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  )
}

/**
 * Encrypts the payment payload with RSA-OAEP SHA-256 via Web Crypto.
 * Wire format matches the previous node-forge implementation expected by
 * AWS KMS EncryptionAlgorithmSpec::RsaesOaepSha256.
 */
export async function encryptPaymentPayload(
  publicKey: string,
  payload: FullPayment,
): Promise<string> {
  const encoded = new TextEncoder().encode(JSON.stringify(payload))
  const key = await importRsaOaepPublicKey(publicKey)

  try {
    const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, encoded)
    return arrayBufferToBase64(encrypted)
  } catch {
    throw new Error(
      'Could not encrypt payment details. The payload may be too large for the server key.',
    )
  }
}
