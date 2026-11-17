export const MAX_BODY_BYTES = 8 * 1024 * 1024;
export const MAX_VAULT_BYTES = 128 * 1024 * 1024;
export const MAX_CHECKPOINTS = 200;
export const CHUNK_BYTES = 64 * 1024;
export const RETENTION_DAYS = 30;

export interface CheckpointEnvelope {
  version: 1;
  id: string;
  parentId: string | null;
  createdAt: string;
  schemaVersion: number;
  progressRows: number;
  iv: string;
  ciphertext: string;
  sha256: string;
}

export interface CheckpointSummary {
  id: string;
  parentId: string | null;
  createdAt: string;
  storedAt: string;
  schemaVersion: number;
  progressRows: number;
  sha256: string;
  bytes: number;
  sequence: number;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly headId?: string | null,
  ) {
    super(message);
  }
}

export function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    },
  });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return json({
      error: { code: error.code, message: error.message },
      ...(error.headId !== undefined ? { headId: error.headId } : {}),
    }, error.status);
  }
  // Never emit exception details, request headers, capabilities, or encrypted bodies.
  return json({ error: { code: 'storage-unavailable', message: 'Backup storage is unavailable. Retry the same checkpoint later.' } }, 503);
}

export const isUUID = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export const isHash = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);

function isCounter(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function exactObject(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype
    || Object.keys(value).length !== keys.length
    || !keys.every((key) => Object.hasOwn(value, key))) {
    throw new HttpError(400, 'invalid-body', 'Expected the documented JSON object fields.');
  }
  return value as Record<string, unknown>;
}

export function checkBodyLength(request: Request, maximum = MAX_BODY_BYTES): void {
  const declared = request.headers.get('Content-Length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > maximum)) {
    throw new HttpError(413, 'body-too-large', 'The request exceeds the body limit.');
  }
}

export async function readBody(request: Request, maximum = MAX_BODY_BYTES): Promise<Uint8Array> {
  checkBodyLength(request, maximum);
  if (!request.body) throw new HttpError(400, 'invalid-body', 'A JSON body is required.');
  const reader = request.body.getReader();
  let body = new Uint8Array(Math.min(16 * 1024, maximum));
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maximum) {
        throw new HttpError(413, 'body-too-large', 'The request exceeds the body limit.');
      }
      if (bytes > body.byteLength) {
        const expanded = new Uint8Array(Math.min(maximum, Math.max(bytes, body.byteLength * 2)));
        expanded.set(body);
        body = expanded;
      }
      body.set(value, bytes - value.byteLength);
    }
    return body.subarray(0, bytes);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'invalid-body', 'The request body could not be read.');
  } finally {
    reader.releaseLock();
  }
}

export async function readJSON(request: Request, maximum = MAX_BODY_BYTES): Promise<unknown> {
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new HttpError(415, 'content-type', 'Use application/json.');
  }
  const body = await readBody(request, maximum);
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(body)) as unknown;
  } catch {
    throw new HttpError(400, 'invalid-body', 'The body must be valid UTF-8 JSON.');
  }
}

export async function sha256(value: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function sameSecret(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

export function bearer(request: Request): string {
  const match = /^Bearer ([A-Za-z0-9_+/=-]{32,256})$/.exec(request.headers.get('Authorization') ?? '');
  if (!match) throw new HttpError(401, 'unauthorized', 'A valid bearer capability is required.');
  return match[1];
}

function canonicalBase64(value: unknown, minimumBytes: number, exactBytes?: number): value is string {
  if (typeof value !== 'string' || value.length % 4 !== 0
    || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) return false;
  // Check padding bits without decoding a potentially multi-megabyte ciphertext.
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
  const length = value.length / 4 * 3 - padding;
  if (length < minimumBytes || (exactBytes !== undefined && length !== exactBytes)) return false;
  const last = alphabet.indexOf(value[value.length - padding - 1]);
  return padding === 0 || (last & (padding === 2 ? 15 : 3)) === 0;
}

export function hashInput(envelope: CheckpointEnvelope): string {
  return JSON.stringify([
    envelope.version, envelope.id, envelope.parentId, envelope.createdAt,
    envelope.schemaVersion, envelope.progressRows, envelope.iv, envelope.ciphertext,
  ]);
}

function validISO(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!parts || !Number.isFinite(Date.parse(value))) return false;
  const [, year, month, day, hour, minute, second, offsetHour, offsetMinute] = parts;
  const days = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  return Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= days
    && Number(hour) <= 23 && Number(minute) <= 59 && Number(second) <= 59
    && (offsetHour === undefined || (Number(offsetHour) <= 23 && Number(offsetMinute) <= 59));
}

export async function validateEnvelope(value: unknown): Promise<CheckpointEnvelope> {
  const item = exactObject(value, ['version', 'id', 'parentId', 'createdAt', 'schemaVersion', 'progressRows', 'iv', 'ciphertext', 'sha256']);
  if (item.version !== 1 || !isUUID(item.id)
    || !(item.parentId === null || isUUID(item.parentId)) || item.id === item.parentId
    || !validISO(item.createdAt)
    || !isCounter(item.schemaVersion) || !isCounter(item.progressRows)
    || !canonicalBase64(item.iv, 12, 12) || !canonicalBase64(item.ciphertext, 16)
    || !isHash(item.sha256)) {
    throw new HttpError(400, 'invalid-checkpoint', 'The checkpoint structure, version, or encoding is invalid.');
  }
  const envelope: CheckpointEnvelope = {
    version: 1, id: item.id, parentId: item.parentId, createdAt: item.createdAt,
    schemaVersion: item.schemaVersion, progressRows: item.progressRows,
    iv: item.iv, ciphertext: item.ciphertext, sha256: item.sha256,
  };
  if (!sameSecret(await sha256(hashInput(envelope)), envelope.sha256)) {
    throw new HttpError(400, 'checksum-mismatch', 'The checkpoint checksum does not match.');
  }
  return envelope;
}
