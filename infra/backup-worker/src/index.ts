import { DurableObject } from 'cloudflare:workers';
import {
  CHUNK_BYTES, MAX_BODY_BYTES, MAX_CHECKPOINTS, MAX_VAULT_BYTES, RETENTION_DAYS,
  HttpError, bearer, errorResponse, exactObject, isHash, isUUID, json, readBody, readJSON, sameSecret,
  sha256, validateEnvelope,
  type CheckpointEnvelope, type CheckpointSummary,
} from './protocol';
import { retainedCheckpointIds } from './retention';

export interface Env {
  VAULTS: DurableObjectNamespace;
  ALLOWED_ORIGINS: string;
  ENROLLMENT_SECRET?: string;
}

interface VaultRow extends Record<string, SqlStorageValue> {
  read_hash: string;
  write_hash: string;
  head_id: string | null;
  sequence: number;
  stored_bytes: number;
  checkpoint_count: number;
  first_nonempty_id: string | null;
}

interface CheckpointRow extends Record<string, SqlStorageValue> {
  id: string;
  parent_id: string | null;
  created_at: string;
  stored_at: string;
  stored_ms: number;
  schema_version: number;
  progress_rows: number;
  sha256: string;
  bytes: number;
  sequence: number;
}

function summary(row: CheckpointRow): CheckpointSummary {
  return {
    id: row.id, parentId: row.parent_id, createdAt: row.created_at, storedAt: row.stored_at,
    schemaVersion: row.schema_version, progressRows: row.progress_rows,
    sha256: row.sha256, bytes: row.bytes, sequence: row.sequence,
  };
}

async function checkEnrollment(request: Request, env: Env): Promise<void> {
  if (!env.ENROLLMENT_SECRET || env.ENROLLMENT_SECRET.length < 32) {
    throw new HttpError(503, 'not-configured', 'Vault enrollment is not configured.');
  }
  if (!sameSecret(await sha256(bearer(request)), await sha256(env.ENROLLMENT_SECRET))) {
    throw new HttpError(401, 'unauthorized', 'Enrollment authorization is invalid.');
  }
}

function allowedOrigins(env: Env): Set<string> {
  try {
    const origins: unknown = JSON.parse(env.ALLOWED_ORIGINS);
    if (!Array.isArray(origins) || origins.length === 0 || !origins.every((origin) =>
      typeof origin === 'string' && new URL(origin).origin === origin
      && (origin.startsWith('https://') || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)))) {
      throw new Error();
    }
    return new Set(origins as string[]);
  } catch {
    throw new HttpError(503, 'not-configured', 'Exact allowed origins must be configured.');
  }
}

function route(path: string): RegExpExecArray | null {
  return /^\/v1\/vaults\/([^/]+)\/(status|checkpoints)(?:\/([^/]+))?$/.exec(path);
}

export async function handleWorker(request: Request, env: Env): Promise<Response> {
  let origin: string | null = null;
  let cors = false;
  let response: Response;
  try {
    const url = new URL(request.url);
    origin = request.headers.get('Origin');
    if (url.pathname === '/health' && request.method === 'GET') {
      response = json({ ok: true, service: 'langlearn-backup', version: 1 });
    } else {
      const origins = allowedOrigins(env);
      if (origin && !origins.has(origin)) throw new HttpError(403, 'origin-forbidden', 'This origin is not allowed.');
      cors = origin !== null;
      const match = route(url.pathname);
      const creation = url.pathname === '/v1/vaults';
      if (!creation && (!match || !isUUID(match[1]) || (match[3] && (match[2] !== 'checkpoints' || !isUUID(match[3]))))) {
        throw new HttpError(404, 'not-found', 'The requested backup route does not exist.');
      }
      const method = creation || (match?.[2] === 'checkpoints' && !match[3]) ? ['GET', 'POST'] : ['GET'];
      if (creation) method.splice(0, 1);
      if (request.method === 'OPTIONS') {
        if (!origin || !method.includes(request.headers.get('Access-Control-Request-Method') ?? '')
          || (request.headers.get('Access-Control-Request-Headers') ?? '').split(',').some((header) =>
            header.trim() && !['authorization', 'content-type', 'x-confirm-history-decrease'].includes(header.trim().toLowerCase()))) {
          throw new HttpError(403, 'preflight-forbidden', 'The requested cross-origin operation is not allowed.');
        }
        response = new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
      } else {
        if (!method.includes(request.method)) throw new HttpError(405, 'method-not-allowed', 'This operation is not supported.');
        // Bound and authenticate enrollment before allocating a persistent vault.
        if (creation) {
          await checkEnrollment(request, env);
          const item = exactObject(await readJSON(request, 1024), ['vaultId', 'readTokenHash', 'writeTokenHash']);
          if (!isUUID(item.vaultId) || !isHash(item.readTokenHash) || !isHash(item.writeTokenHash)
            || item.readTokenHash === item.writeTokenHash) {
            throw new HttpError(400, 'invalid-vault', 'Supply a UUID and distinct SHA-256 capability hashes.');
          }
          const vaultId = item.vaultId.toLowerCase();
          const stub = env.VAULTS.get(env.VAULTS.idFromName(vaultId));
          const headers = new Headers(request.headers);
          headers.delete('Content-Length');
          response = await stub.fetch(new Request(request.url, {
            method: 'POST', headers, body: JSON.stringify({ ...item, vaultId }),
          }));
        } else {
          bearer(request);
          const stub = env.VAULTS.get(env.VAULTS.idFromName(match![1].toLowerCase()));
          if (request.method === 'POST') {
            // Bound and finish the external stream before crossing the DO
            // boundary, including chunked requests without Content-Length.
            const body = await readBody(request);
            const headers = new Headers(request.headers);
            headers.delete('Content-Length');
            response = await stub.fetch(new Request(request.url, { method: 'POST', headers, body }));
          } else {
            response = await stub.fetch(request);
          }
        }
      }
    }
  } catch (error) {
    response = errorResponse(error);
  }
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('Vary', 'Origin');
  if (cors && origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Confirm-History-Decrease');
  }
  return new Response(response.body, { status: response.status, headers });
}

export class BackupVault extends DurableObject<Env> {
  protected get sql(): SqlStorage {
    return this.ctx.storage.sql;
  }

  protected now(): number {
    return Date.now();
  }

  private vault(): VaultRow | undefined {
    if (!this.sql.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'vault'").toArray().length) return undefined;
    return this.sql.exec<VaultRow>('SELECT * FROM vault WHERE singleton = 1').toArray()[0];
  }

  private checkpoint(id: string): CheckpointRow | undefined {
    return this.sql.exec<CheckpointRow>('SELECT * FROM checkpoints WHERE id = ?', id).toArray()[0];
  }

  private authorize(tokenHash: string, write = false): VaultRow {
    const vault = this.vault();
    if (!vault || !sameSecret(write ? vault.write_hash : vault.read_hash, tokenHash)) {
      throw new HttpError(401, 'unauthorized', 'The vault capability is invalid.');
    }
    return vault;
  }

  private initialize(item: Record<string, unknown>): Response {
    return this.ctx.storage.transactionSync(() => {
      if (this.vault()) throw new HttpError(409, 'vault-exists', 'This vault already exists and cannot be reset.');
      this.sql.exec(`CREATE TABLE vault (
        singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
        read_hash TEXT NOT NULL, write_hash TEXT NOT NULL,
        head_id TEXT, sequence INTEGER NOT NULL DEFAULT 0,
        stored_bytes INTEGER NOT NULL DEFAULT 0, checkpoint_count INTEGER NOT NULL DEFAULT 0,
        first_nonempty_id TEXT
      )`);
      this.sql.exec(`CREATE TABLE checkpoints (
        id TEXT PRIMARY KEY, parent_id TEXT, created_at TEXT NOT NULL,
        stored_at TEXT NOT NULL, stored_ms INTEGER NOT NULL, schema_version INTEGER NOT NULL,
        progress_rows INTEGER NOT NULL, sha256 TEXT NOT NULL, bytes INTEGER NOT NULL,
        sequence INTEGER NOT NULL UNIQUE
      )`);
      this.sql.exec(`CREATE TABLE chunks (
        checkpoint_id TEXT NOT NULL, chunk_index INTEGER NOT NULL, chunk_text TEXT NOT NULL,
        PRIMARY KEY (checkpoint_id, chunk_index)
      ) WITHOUT ROWID`);
      this.sql.exec('INSERT INTO vault (singleton, read_hash, write_hash) VALUES (1, ?, ?)', item.readTokenHash as string, item.writeTokenHash as string);
      return json({ vaultId: item.vaultId }, 201);
    });
  }

  private serialized(id: string): string {
    const chunks = this.sql.exec<{ chunk_index: number; chunk_text: string }>(
      'SELECT chunk_index, chunk_text FROM chunks WHERE checkpoint_id = ? ORDER BY chunk_index', id,
    ).toArray();
    if (!chunks.length || chunks.length > Math.ceil(MAX_BODY_BYTES / CHUNK_BYTES)
      || chunks.some((chunk, index) => chunk.chunk_index !== index || !chunk.chunk_text.length || chunk.chunk_text.length > CHUNK_BYTES)) {
      throw new HttpError(500, 'storage-corrupt', 'The stored checkpoint is incomplete. Try another retained copy.');
    }
    return chunks.map((chunk) => chunk.chunk_text).join('');
  }

  private append(envelope: CheckpointEnvelope, serialized: string, tokenHash: string, confirmed: boolean): Response {
    return this.ctx.storage.transactionSync(() => {
      const vault = this.authorize(tokenHash, true);
      const existing = this.checkpoint(envelope.id);
      if (existing) {
        if (existing.sha256 !== envelope.sha256 || this.serialized(existing.id) !== serialized) {
          throw new HttpError(409, 'idempotency-conflict', 'This checkpoint ID already identifies different content.', vault.head_id);
        }
        return json({ checkpoint: summary(existing), headId: vault.head_id }, 200);
      }
      if (envelope.parentId !== vault.head_id) {
        throw new HttpError(409, 'head-conflict', 'The vault head changed. Read it before creating another checkpoint.', vault.head_id);
      }
      if (envelope.progressRows === 0 && vault.first_nonempty_id !== null) {
        throw new HttpError(409, 'suspected-wipe', 'An empty checkpoint cannot replace established learning history.', vault.head_id);
      }
      const head = vault.head_id ? this.checkpoint(vault.head_id) : undefined;
      if (vault.head_id && !head) throw new HttpError(500, 'storage-corrupt', 'The vault head is missing.');
      if (head && envelope.progressRows < head.progress_rows && !confirmed) {
        throw new HttpError(409, 'history-decreased', 'Explicit confirmation is required for reduced learning history.', vault.head_id);
      }
      const bytes = new TextEncoder().encode(serialized).byteLength;
      const now = this.now();
      let projectedBytes = vault.stored_bytes + bytes;
      let projectedCount = vault.checkpoint_count + 1;
      const current = this.sql.exec<{ id: string; bytes: number; stored_ms: number; sequence: number }>(
        'SELECT id, bytes, stored_ms, sequence FROM checkpoints',
      ).toArray();
      const firstNonemptyId = vault.first_nonempty_id ?? (envelope.progressRows > 0 ? envelope.id : null);
      const selected = retainedCheckpointIds([
        ...current.map((item) => ({ id: item.id, sequence: item.sequence, storedMs: item.stored_ms })),
        { id: envelope.id, sequence: vault.sequence + 1, storedMs: now },
      ], now, firstNonemptyId, envelope.id);
      const remove = current.filter((item) => !selected.has(item.id));
      for (const candidate of remove) {
        projectedBytes -= candidate.bytes;
        projectedCount--;
      }
      if (projectedBytes > MAX_VAULT_BYTES || projectedCount > MAX_CHECKPOINTS || vault.sequence >= Number.MAX_SAFE_INTEGER) {
        throw new HttpError(507, 'capacity-exceeded', 'Protected checkpoints fill this vault. Existing copies have not been changed.', vault.head_id);
      }
      // Plan first: a rejected write must not prune even an otherwise eligible copy.
      for (const { id } of remove) {
        this.sql.exec('DELETE FROM chunks WHERE checkpoint_id = ?', id);
        this.sql.exec('DELETE FROM checkpoints WHERE id = ?', id);
      }
      const receipt: CheckpointSummary = {
        id: envelope.id, parentId: envelope.parentId, createdAt: envelope.createdAt,
        storedAt: new Date(now).toISOString(), schemaVersion: envelope.schemaVersion,
        progressRows: envelope.progressRows, sha256: envelope.sha256, bytes, sequence: vault.sequence + 1,
      };
      this.sql.exec(
        'INSERT INTO checkpoints VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        receipt.id, receipt.parentId, receipt.createdAt, receipt.storedAt, now,
        receipt.schemaVersion, receipt.progressRows, receipt.sha256, receipt.bytes, receipt.sequence,
      );
      // All envelope characters are ASCII after structural validation.
      for (let offset = 0; offset < serialized.length; offset += CHUNK_BYTES) {
        this.sql.exec('INSERT INTO chunks VALUES (?, ?, ?)', envelope.id, offset / CHUNK_BYTES, serialized.slice(offset, offset + CHUNK_BYTES));
      }
      this.sql.exec(
        `UPDATE vault SET head_id = ?, sequence = ?, stored_bytes = ?, checkpoint_count = ?,
         first_nonempty_id = COALESCE(first_nonempty_id, ?) WHERE singleton = 1`,
        receipt.id, receipt.sequence, projectedBytes, projectedCount, envelope.progressRows > 0 ? envelope.id : null,
      );
      return json({ checkpoint: receipt, headId: receipt.id }, 201);
    });
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (url.pathname === '/v1/vaults' && request.method === 'POST') {
        await checkEnrollment(request, this.env);
        const item = exactObject(await readJSON(request, 1024), ['vaultId', 'readTokenHash', 'writeTokenHash']);
        if (!isUUID(item.vaultId) || !isHash(item.readTokenHash) || !isHash(item.writeTokenHash) || item.readTokenHash === item.writeTokenHash) {
          throw new HttpError(400, 'invalid-vault', 'Supply a UUID and distinct SHA-256 capability hashes.');
        }
        return this.initialize(item);
      }
      const tokenHash = await sha256(bearer(request));
      const match = route(url.pathname);
      if (!match) throw new HttpError(404, 'not-found', 'The backup route does not exist.');
      if (request.method === 'POST' && match[2] === 'checkpoints' && !match[3]) {
        const value = await readJSON(request);
        this.authorize(tokenHash, true);
        const envelope = await validateEnvelope(value);
        const serialized = JSON.stringify(envelope);
        if (new TextEncoder().encode(serialized).byteLength > MAX_BODY_BYTES) {
          throw new HttpError(413, 'body-too-large', 'The checkpoint exceeds the body limit.');
        }
        return this.append(envelope, serialized, tokenHash, request.headers.get('X-Confirm-History-Decrease') === 'true');
      }
      const vault = this.authorize(tokenHash);
      if (request.method !== 'GET') throw new HttpError(405, 'method-not-allowed', 'This operation is not supported.');
      if (match[2] === 'status' && !match[3]) {
        return json({
          headId: vault.head_id, sequence: vault.sequence, storedBytes: vault.stored_bytes,
          checkpointCount: vault.checkpoint_count, maxBytes: MAX_VAULT_BYTES, retentionDays: RETENTION_DAYS,
        });
      }
      if (!match[3]) {
        const cursor = url.searchParams.get('cursor');
        const limit = url.searchParams.get('limit') ?? '20';
        if ((cursor !== null && (!/^[1-9]\d{0,15}$/.test(cursor) || !Number.isSafeInteger(Number(cursor))))
          || !/^[1-9]\d?$/.test(limit) || Number(limit) > 50
          || [...url.searchParams.keys()].some((key) => !['cursor', 'limit'].includes(key))) {
          throw new HttpError(400, 'invalid-pagination', 'Use a positive safe-integer cursor and a limit from 1 to 50.');
        }
        const rows = this.sql.exec<CheckpointRow>(
          'SELECT * FROM checkpoints WHERE (? IS NULL OR sequence < ?) ORDER BY sequence DESC LIMIT ?',
          cursor === null ? null : Number(cursor), cursor === null ? null : Number(cursor), Number(limit) + 1,
        ).toArray();
        const page = rows.slice(0, Number(limit));
        return json({
          checkpoints: page.map(summary),
          nextCursor: rows.length > Number(limit) ? String(page[page.length - 1].sequence) : null,
          headId: vault.head_id,
        });
      }
      const row = this.checkpoint(match[3]);
      if (!row) throw new HttpError(404, 'checkpoint-not-found', 'This checkpoint is not retained in the vault.');
      const serialized = this.serialized(row.id);
      let envelope: CheckpointEnvelope;
      try {
        envelope = await validateEnvelope(JSON.parse(serialized));
        if (JSON.stringify(envelope) !== serialized || new TextEncoder().encode(serialized).byteLength !== row.bytes
          || envelope.id !== row.id || envelope.parentId !== row.parent_id || envelope.createdAt !== row.created_at
          || envelope.schemaVersion !== row.schema_version || envelope.progressRows !== row.progress_rows
          || envelope.sha256 !== row.sha256) throw new Error();
      } catch {
        throw new HttpError(500, 'storage-corrupt', 'The stored checkpoint failed integrity checks. Try another retained copy.');
      }
      return json({ checkpoint: envelope, receipt: summary(row) });
    } catch (error) {
      return errorResponse(error);
    }
  }
}

export default { fetch: handleWorker } satisfies ExportedHandler<Env>;
