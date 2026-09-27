import bcrypt from 'bcryptjs';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Encodes Uint8Array into URL-safe base64 string
 */
function base64urlEncode(arr: Uint8Array): string {
  const bin = Array.from(arr, byte => String.fromCharCode(byte)).join('');
  return btoa(bin)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decodes URL-safe base64 string into Uint8Array
 */
function base64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const bin = atob(padded);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    arr[i] = bin.charCodeAt(i);
  }
  return arr;
}

/**
 * Signs a message using Web Crypto HMAC SHA-256
 */
async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return base64urlEncode(new Uint8Array(sig));
}

/**
 * Verifies a Web Crypto HMAC SHA-256 signature
 */
async function hmacVerify(message: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const sigBytes = base64urlDecode(signature);
  return crypto.subtle.verify('HMAC', key, sigBytes as any, encoder.encode(message));
}

/**
 * Generates an Edge-compatible signed JWT
 */
export async function signJWT(payload: object, secret: string, expiresInSeconds: number): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };

  const headerEncoded = base64urlEncode(encoder.encode(JSON.stringify(header)));
  const payloadEncoded = base64urlEncode(encoder.encode(JSON.stringify(fullPayload)));

  const message = `${headerEncoded}.${payloadEncoded}`;
  const signature = await hmacSign(message, secret);

  return `${message}.${signature}`;
}

/**
 * Verifies an Edge-compatible signed JWT and returns the parsed payload
 */
export async function verifyJWT(token: string, secret: string): Promise<any | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerStr, payloadStr, signature] = parts;
  const message = `${headerStr}.${payloadStr}`;

  try {
    const isValid = await hmacVerify(message, signature, secret);
    if (!isValid) return null;

    const payload = JSON.parse(decoder.decode(base64urlDecode(payloadStr)));

    // Check JWT expiration
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Hashes passwords using bcryptjs (Standard Node execution environments)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares plain text password against database hashed password
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
