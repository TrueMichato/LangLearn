// Web Push sender for Cloudflare Workers — hand-rolled VAPID + AES128GCM
// implementation using the standard `crypto.subtle` API. No npm push-libs
// (the popular `web-push` package depends on Node `crypto`).
//
// References:
//   RFC 8030 — Generic Event Delivery Using HTTP Push
//   RFC 8291 — Message Encryption for Web Push
//   RFC 8292 — VAPID for Web Push
//
// The flow:
//   1. Sign a VAPID JWT (ES256) so the push service trusts the request.
//   2. Derive an ephemeral ECDH key + AES key using the recipient's p256dh
//      and auth secret.
//   3. Encrypt the payload (aes128gcm content encoding).
//   4. POST encrypted body to subscription.endpoint with the right headers.

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string; // base64url-encoded P-256 public key
    auth: string;   // base64url-encoded 16-byte auth secret
  };
}

export interface VapidConfig {
  publicKey: string;   // base64url uncompressed P-256 point (65 bytes)
  privateKey: string;  // base64url 32-byte d
  subject: string;     // mailto: or https: URL
}

export interface SendPushResult {
  status: number;
  ok: boolean;
  /** True if the subscription is permanently gone (404/410) — caller should delete it. */
  gone: boolean;
  bodyText?: string;
}

// ────────────────────────── base64url helpers ──────────────────────────

export function b64uToBytes(b64u: string): Uint8Array {
  const pad = '='.repeat((4 - (b64u.length % 4)) % 4);
  const b64 = (b64u + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToB64u(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const a of arrays) total += a.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

// ────────────────────────── VAPID JWT (ES256) ──────────────────────────

async function importVapidSigningKey(privateKeyB64u: string, publicKeyB64u: string): Promise<CryptoKey> {
  // The Web Push VAPID public key is the uncompressed SEC1 point (0x04 || x || y).
  const pub = b64uToBytes(publicKeyB64u);
  if (pub.length !== 65 || pub[0] !== 0x04) {
    throw new Error('VAPID public key must be a 65-byte uncompressed P-256 point');
  }
  const x = pub.slice(1, 33);
  const y = pub.slice(33, 65);
  const d = b64uToBytes(privateKeyB64u);
  const jwk: JsonWebKey = {
    kty: 'EC',
    crv: 'P-256',
    x: bytesToB64u(x),
    y: bytesToB64u(y),
    d: bytesToB64u(d),
    ext: true,
  };
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
}

async function signVapidJWT(
  endpoint: string,
  vapid: VapidConfig,
  ttlSeconds = 12 * 60 * 60,
): Promise<string> {
  const url = new URL(endpoint);
  const aud = `${url.protocol}//${url.host}`;
  const header = { alg: 'ES256', typ: 'JWT' };
  const payload = {
    aud,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    sub: vapid.subject,
  };
  const enc = new TextEncoder();
  const headerB64 = bytesToB64u(enc.encode(JSON.stringify(header)));
  const payloadB64 = bytesToB64u(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await importVapidSigningKey(vapid.privateKey, vapid.publicKey);
  const sigBuf = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    enc.encode(signingInput),
  );
  // crypto.subtle returns raw r||s (64 bytes for P-256) — what JWS ES256 expects.
  const sig = bytesToB64u(new Uint8Array(sigBuf));
  return `${signingInput}.${sig}`;
}

// ────────────────────────── HKDF + AES128GCM (RFC 8291) ──────────────────────────

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

async function importP256PublicKey(rawUncompressed: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    rawUncompressed,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    [],
  );
}

async function exportRawPublicKey(key: CryptoKey): Promise<Uint8Array> {
  const raw = (await crypto.subtle.exportKey('raw', key)) as ArrayBuffer;
  return new Uint8Array(raw);
}

/**
 * Encrypt `payload` for the recipient identified by their p256dh public key
 * and 16-byte auth secret, using the aes128gcm content encoding (RFC 8291).
 *
 * Returns the ready-to-POST body bytes.
 */
async function encryptAes128Gcm(
  payload: Uint8Array,
  recipientPub: Uint8Array,
  authSecret: Uint8Array,
): Promise<Uint8Array> {
  // 1. Generate ephemeral ECDH keypair.
  const ephemeral = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  ) as CryptoKeyPair;
  const ephemeralPubRaw = await exportRawPublicKey(ephemeral.publicKey);

  // 2. ECDH shared secret with recipient's p256dh.
  const recipientKey = await importP256PublicKey(recipientPub);
  const sharedBits = await crypto.subtle.deriveBits(
    // CF workers-types declares this property as `$public`; the actual runtime
    // and Web Crypto spec use `public`. Cast to satisfy the type-checker.
    { name: 'ECDH', public: recipientKey } as unknown as Parameters<typeof crypto.subtle.deriveBits>[0],
    ephemeral.privateKey,
    256,
  );
  const sharedSecret = new Uint8Array(sharedBits);

  // 3. Per RFC 8291: PRK_key = HKDF(auth, ECDH-secret, "WebPush: info\0" || ua_pub || as_pub, 32)
  const enc = new TextEncoder();
  const keyInfo = concat(
    enc.encode('WebPush: info\0'),
    recipientPub,
    ephemeralPubRaw,
  );
  const ikm = await hkdf(authSecret, sharedSecret, keyInfo, 32);

  // 4. Random 16-byte salt.
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 5. Derive content encryption key (16 bytes) and nonce (12 bytes).
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);

  // 6. Append 0x02 padding delimiter (single record, no extra padding).
  const padded = concat(payload, new Uint8Array([0x02]));

  // 7. AES-128-GCM encrypt.
  const cekKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce, tagLength: 128 },
    cekKey,
    padded,
  );
  const cipher = new Uint8Array(cipherBuf);

  // 8. aes128gcm header: salt(16) || rs(4, big-endian) || idlen(1) || keyid(idlen)
  //    keyid for Web Push = ephemeral public key (65 bytes).
  const recordSize = cipher.length + 16 + 1; // ciphertext (incl. tag) + key + delimiter
  const rsBytes = new Uint8Array(4);
  new DataView(rsBytes.buffer).setUint32(0, Math.max(recordSize, 18), false);
  const header = concat(
    salt,
    rsBytes,
    new Uint8Array([ephemeralPubRaw.length]),
    ephemeralPubRaw,
  );

  return concat(header, cipher);
}

// ────────────────────────── Public sender API ──────────────────────────

/**
 * Send an encrypted Web Push message. Returns metadata; never throws on
 * non-2xx — the caller decides what to do (delete on `gone === true`).
 */
export async function sendWebPush(
  subscription: PushSubscriptionJSON,
  payload: object,
  vapid: VapidConfig,
  options: { ttl?: number } = {},
): Promise<SendPushResult> {
  const ttl = options.ttl ?? 12 * 60 * 60;
  const enc = new TextEncoder();
  const body = await encryptAes128Gcm(
    enc.encode(JSON.stringify(payload)),
    b64uToBytes(subscription.keys.p256dh),
    b64uToBytes(subscription.keys.auth),
  );

  const jwt = await signVapidJWT(subscription.endpoint, vapid);
  const headers: Record<string, string> = {
    Authorization: `vapid t=${jwt}, k=${vapid.publicKey}`,
    'Content-Encoding': 'aes128gcm',
    'Content-Type': 'application/octet-stream',
    TTL: String(ttl),
    Urgency: 'normal',
  };

  let res: Response;
  try {
    res = await fetch(subscription.endpoint, {
      method: 'POST',
      headers,
      body: body as BodyInit,
    });
  } catch (err) {
    return { status: 0, ok: false, gone: false, bodyText: String(err) };
  }

  const gone = res.status === 404 || res.status === 410;
  let bodyText: string | undefined;
  if (!res.ok) {
    try { bodyText = await res.text(); } catch { /* ignore */ }
  }
  return { status: res.status, ok: res.ok, gone, bodyText };
}
