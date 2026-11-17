/** Wire format shared with the independent backup service. No learner data leaves this module unencrypted. */
export interface RecoveryKit {
  version: 1;
  endpoint: string;
  vaultId: string;
  readToken: string;
  writeToken: string;
  encryptionKey: string;
}

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

export class BackupError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'BackupError';
  }
}

export const MAX_CHECKPOINT_BYTES = 8 * 1024 * 1024;
const encoder = new TextEncoder();
function backupCrypto(): Crypto {
  if (typeof crypto === 'undefined' || !crypto.subtle || typeof crypto.randomUUID !== 'function') {
    throw new BackupError('crypto-unavailable', 'Encrypted backup requires Web Crypto in a secure browser context. Open LangLearn over HTTPS (or localhost for development) in a supported browser.');
  }
  return crypto;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isBackupUUID = (value: unknown): value is string => typeof value === 'string' && uuid.test(value);
export const isSafeCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
export const isISO = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 8192) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
  }
  return btoa(binary);
}

export function base64ToBytes(value: unknown, length?: number): Uint8Array<ArrayBuffer> {
  if (typeof value !== 'string' || value.length > MAX_CHECKPOINT_BYTES ||
    value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new BackupError('malformed', 'The backup contains invalid base64 data. Keep the original file and try another copy.');
  }
  const bytes = Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
  if (bytesToBase64(bytes) !== value || (length !== undefined && bytes.length !== length)) {
    throw new BackupError('malformed', 'The backup key or encrypted data has an invalid length.');
  }
  return bytes;
}

export function validateBackupEndpoint(value: string): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new BackupError('endpoint', 'Enter a complete HTTPS backup service address.'); }
  if ((url.protocol !== 'https:' &&
    !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) ||
    url.username || url.password || url.search || url.hash || url.pathname !== '/' ||
    value.length > 2048) {
    throw new BackupError('endpoint', 'Use an HTTPS service origin, without a path, password, query, or fragment. HTTP is allowed only on localhost.');
  }
  return url.origin;
}

export function parseRecoveryKit(value: unknown): RecoveryKit {
  if (!isRecord(value) || value.version !== 1) {
    throw new BackupError('unsupported-kit', 'This recovery kit needs a different version of LangLearn. Keep the file unchanged.');
  }
  if (!exactKeys(value, ['version', 'endpoint', 'vaultId', 'readToken', 'writeToken', 'encryptionKey']) ||
    typeof value.endpoint !== 'string' || !isBackupUUID(value.vaultId)) {
    throw new BackupError('malformed-kit', 'This recovery kit is incomplete or malformed.');
  }
  const endpoint = validateBackupEndpoint(value.endpoint);
  for (const key of ['readToken', 'writeToken', 'encryptionKey']) base64ToBytes(value[key], 32);
  if (value.readToken === value.writeToken || value.readToken === value.encryptionKey || value.writeToken === value.encryptionKey) {
    throw new BackupError('malformed-kit', 'This recovery kit does not contain independent keys.');
  }
  return { ...value, endpoint } as unknown as RecoveryKit;
}

export function createRecoveryKit(endpoint: string): RecoveryKit {
  const secure = backupCrypto();
  return {
    version: 1, endpoint: validateBackupEndpoint(endpoint), vaultId: secure.randomUUID(),
    readToken: bytesToBase64(secure.getRandomValues(new Uint8Array(32))),
    writeToken: bytesToBase64(secure.getRandomValues(new Uint8Array(32))),
    encryptionKey: bytesToBase64(secure.getRandomValues(new Uint8Array(32))),
  };
}

export async function sha256(value: string): Promise<string> {
  return Array.from(new Uint8Array(await backupCrypto().subtle.digest('SHA-256', encoder.encode(value))),
    (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function aad(envelope: Omit<CheckpointEnvelope, 'iv' | 'ciphertext' | 'sha256'>): Uint8Array<ArrayBuffer> {
  return encoder.encode(JSON.stringify([
    1, envelope.id, envelope.parentId, envelope.createdAt, envelope.schemaVersion, envelope.progressRows,
  ]));
}

function checksumInput(envelope: Omit<CheckpointEnvelope, 'sha256'>): string {
  return JSON.stringify([
    envelope.version, envelope.id, envelope.parentId, envelope.createdAt,
    envelope.schemaVersion, envelope.progressRows, envelope.iv, envelope.ciphertext,
  ]);
}

export function parseCheckpointEnvelope(value: unknown): CheckpointEnvelope {
  if (!isRecord(value) || value.version !== 1) {
    throw new BackupError('unsupported-envelope', 'This encrypted checkpoint needs a different version of LangLearn. Keep it unchanged.');
  }
  if (!exactKeys(value, ['version', 'id', 'parentId', 'createdAt', 'schemaVersion', 'progressRows', 'iv', 'ciphertext', 'sha256']) ||
    !isBackupUUID(value.id) || !(value.parentId === null || isBackupUUID(value.parentId)) ||
    !isISO(value.createdAt) || !isSafeCount(value.schemaVersion) || !isSafeCount(value.progressRows) ||
    typeof value.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(value.sha256) ||
    JSON.stringify(value).length > MAX_CHECKPOINT_BYTES) {
    throw new BackupError('malformed-envelope', 'The encrypted checkpoint header is malformed or too large.');
  }
  base64ToBytes(value.iv, 12);
  if (base64ToBytes(value.ciphertext).length < 16) throw new BackupError('malformed-envelope', 'The encrypted checkpoint is truncated.');
  return {
    version: 1, id: value.id, parentId: value.parentId, createdAt: value.createdAt,
    schemaVersion: value.schemaVersion, progressRows: value.progressRows,
    iv: value.iv as string, ciphertext: value.ciphertext as string, sha256: value.sha256,
  };
}

export async function encryptCheckpoint(
  serializedPayload: string, key: string, parentId: string | null, schemaVersion: number, progressRows: number,
): Promise<CheckpointEnvelope> {
  const secure = backupCrypto();
  const plaintext = encoder.encode(serializedPayload);
  const header = { version: 1 as const, id: secure.randomUUID(), parentId, createdAt: new Date().toISOString(), schemaVersion, progressRows };
  const overhead = JSON.stringify({ ...header, iv: 'A'.repeat(16), ciphertext: '', sha256: '0'.repeat(64) }).length;
  if (Math.ceil((plaintext.byteLength + 16) / 3) * 4 + overhead > MAX_CHECKPOINT_BYTES) {
    throw new BackupError('checkpoint-too-large', 'This full encrypted checkpoint exceeds the service’s 8 MiB limit. No upload was sent. Keep an ordinary local export and ask the operator about larger-checkpoint support.');
  }
  const iv = secure.getRandomValues(new Uint8Array(12));
  const imported = await secure.subtle.importKey('raw', base64ToBytes(key, 32), 'AES-GCM', false, ['encrypt']);
  const encrypted = await secure.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(header), tagLength: 128 },
    imported, plaintext);
  const envelope = { ...header, iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(encrypted)) };
  return parseCheckpointEnvelope({ ...envelope, sha256: await sha256(checksumInput(envelope)) });
}

/** Callers must validate the decrypted application payload before any restore or acknowledgement. */
export async function decryptCheckpoint(value: unknown, key: string): Promise<{ envelope: CheckpointEnvelope; plaintext: unknown }> {
  const secure = backupCrypto();
  const envelope = parseCheckpointEnvelope(value);
  if (await sha256(checksumInput(envelope)) !== envelope.sha256) {
    throw new BackupError('checksum', 'The encrypted checkpoint checksum does not match. Download it again or choose another copy.');
  }
  const imported = await secure.subtle.importKey('raw', base64ToBytes(key, 32), 'AES-GCM', false, ['decrypt']);
  let decrypted: ArrayBuffer;
  try {
    decrypted = await secure.subtle.decrypt({
      name: 'AES-GCM', iv: base64ToBytes(envelope.iv, 12), additionalData: aad(envelope), tagLength: 128,
    }, imported, base64ToBytes(envelope.ciphertext));
  } catch {
    throw new BackupError('authentication', 'This recovery key cannot authenticate the checkpoint. Check that the kit belongs to this vault; the file may also be damaged.');
  }
  try { return { envelope, plaintext: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(decrypted)) }; }
  catch { throw new BackupError('malformed-payload', 'The decrypted backup is not valid UTF-8 JSON. Nothing was restored.'); }
}

export function parseCheckpointSummary(value: unknown): CheckpointSummary {
  if (!isRecord(value) || !isBackupUUID(value.id) || !(value.parentId === null || isBackupUUID(value.parentId)) ||
    !isISO(value.createdAt) || !isISO(value.storedAt) || !isSafeCount(value.schemaVersion) ||
    !isSafeCount(value.progressRows) || !isSafeCount(value.bytes) || !isSafeCount(value.sequence) ||
    typeof value.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(value.sha256)) {
    throw new BackupError('server-response', 'The backup service returned an invalid checkpoint receipt.');
  }
  return value as unknown as CheckpointSummary;
}
