import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { cp, mkdir, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';

const enrollment = 'synthetic-local-enrollment-secret-not-for-production';
const fixtureSecret = 'synthetic-local-fixture-secret-not-for-production';
const origin = 'http://localhost:5173';
const maxBytes = 128 * 1024 * 1024;
const statePath = `.test-state/${randomUUID()}`;
let child;
let output = '';
let base;

const hash = (value) => createHash('sha256').update(value).digest('hex');
const kit = () => ({ id: randomUUID(), read: randomBytes(32).toString('base64'), write: randomBytes(32).toString('base64') });

async function unusedPort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function start(config = 'test/wrangler.toml') {
  const port = await unusedPort();
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js', 'dev', '--local', '--ip', '127.0.0.1',
    '--port', String(port), '--inspector-port', '0', '--config', `${statePath}/snapshot/${config}`,
    '--persist-to', `${statePath}/storage`,
  ], {
    env: { ...process.env, CI: 'true', WRANGLER_SEND_METRICS: 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (data) => { output = (output + data).slice(-20000); });
  child.stderr.on('data', (data) => { output = (output + data).slice(-20000); });
  for (let attempt = 0; attempt < 160; attempt++) {
    if (child.exitCode !== null) throw new Error(`Wrangler exited before readiness:\n${output}`);
    try {
      const response = await fetch(`${base}/health`, { signal: AbortSignal.timeout(500) });
      if (response.ok) return;
    } catch { /* Wait for the local runtime, not a cloud deployment. */ }
    await sleep(250);
  }
  throw new Error(`Wrangler readiness timed out:\n${output}`);
}

async function stop() {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, 'exit');
  child.kill('SIGTERM');
  await Promise.race([exited, sleep(5000)]);
  if (child.exitCode === null) {
    child.kill('SIGKILL');
    await exited;
  }
}

before(async () => {
  // Isolate Wrangler's file watcher from other agents editing the shared tree.
  await mkdir(`${statePath}/snapshot/test`, { recursive: true });
  await cp('src', `${statePath}/snapshot/src`, { recursive: true });
  await cp('test/worker.ts', `${statePath}/snapshot/test/worker.ts`);
  await cp('test/wrangler.toml', `${statePath}/snapshot/test/wrangler.toml`);
  await cp('wrangler.toml', `${statePath}/snapshot/wrangler.toml`);
  await start();
}, { timeout: 60000 });

after(async () => {
  await stop();
  await rm(statePath, { recursive: true, force: true });
});

async function request(path, { token, method = 'GET', body, headers = {}, raw } = {}) {
  return fetch(`${base}${path}`, {
    method,
    headers: {
      Origin: origin,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined || raw !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    ...(raw instanceof ReadableStream ? { duplex: 'half' } : {}),
    signal: AbortSignal.timeout(15000),
  });
}

async function expect(response, status, code) {
  assert.equal(response.status, status, `Unexpected HTTP ${response.status}: ${await response.clone().text()}\n${response.status === 503 ? output : ''}`);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const value = await response.json();
  if (code) assert.equal(value.error?.code, code, JSON.stringify(value));
  return value;
}

const pathFor = (vault, suffix = '') => `/v1/vaults/${vault.id}${suffix}`;
const status = (vault) => request(pathFor(vault, '/status'), { token: vault.read }).then((response) => expect(response, 200));
const enroll = (vault, token = enrollment) => request('/v1/vaults', {
  method: 'POST', token, body: { vaultId: vault.id, readTokenHash: hash(vault.read), writeTokenHash: hash(vault.write) },
});
const post = (vault, checkpoint, headers) => request(pathFor(vault, '/checkpoints'), { method: 'POST', token: vault.write, body: checkpoint, headers });
const get = (vault, id) => request(pathFor(vault, `/checkpoints/${id}`), { token: vault.read });
const fixture = (vault, action, body = {}) => request(`/__fixture/${vault.id}/${action}`, {
  token: fixtureSecret, method: 'POST', body,
}).then((response) => expect(response, 200));

function envelope(parentId = null, progressRows = 1, bytes = 24, overrides = {}) {
  const item = {
    version: 1, id: randomUUID(), parentId, createdAt: new Date().toISOString(),
    schemaVersion: 12, progressRows, iv: randomBytes(12).toString('base64'),
    // Synthetic opaque bytes, never learner content or an assertion of valid client AEAD.
    ciphertext: randomBytes(bytes).toString('base64'), ...overrides,
  };
  item.sha256 = hash(JSON.stringify([
    item.version, item.id, item.parentId, item.createdAt,
    item.schemaVersion, item.progressRows, item.iv, item.ciphertext,
  ]));
  return item;
}

test('health, exact CORS, enrollment and independent read/write vault isolation', async () => {
  await expect(await request('/health'), 200);
  const vault = kit();
  await expect(await enroll(vault, 'incorrect-synthetic-enrollment-secret'), 401, 'unauthorized');
  await expect(await request('/v1/vaults', { method: 'POST', body: {} }), 401, 'unauthorized');
  await expect(await enroll(vault), 201);
  await expect(await enroll(vault), 409, 'vault-exists');
  assert.equal((await status(vault)).headId, null);
  const other = kit();
  await expect(await enroll(other), 201);
  await expect(await request(pathFor(vault, '/status'), { token: other.read }), 401);
  await expect(await request(pathFor(vault, '/status'), { token: vault.write }), 401);
  await expect(await request(pathFor(vault, '/status')), 401);
  await expect(await request(pathFor(vault, '/status'), {
    token: vault.read, headers: { Origin: 'https://truemichato.github.io.attacker.example' },
  }), 403, 'origin-forbidden');
  const preflight = await request(pathFor(vault, '/checkpoints'), {
    method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type,x-confirm-history-decrease' },
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), origin);
  assert.notEqual(preflight.headers.get('Access-Control-Allow-Origin'), '*');
  const bad = await request(pathFor(vault, '/checkpoints'), {
    method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'DELETE' },
  });
  await expect(bad, 403);
  await expect(await request(pathFor(vault), { method: 'DELETE', token: vault.write }), 404);
  await expect(await request(pathFor(vault, '/checkpoints'), { method: 'POST', token: vault.read, body: envelope() }), 401);
});

test('atomic CAS, ambiguous acknowledgements, retry after head advance, and same-ID conflicts', async () => {
  const vault = kit();
  await expect(await enroll(vault), 201);
  const first = envelope();
  // Deliberately discard the first acknowledgement, then replay identical bytes.
  await (await post(vault, first)).arrayBuffer();
  const retry = await expect(await post(vault, first), 200);
  assert.equal(retry.checkpoint.sequence, 1);
  assert.equal(retry.checkpoint.bytes, Buffer.byteLength(JSON.stringify(first)));
  const candidates = [envelope(first.id, 2), envelope(first.id, 3)];
  const raced = await Promise.all(candidates.map((item) => post(vault, item)));
  assert.deepEqual(raced.map((response) => response.status).sort(), [201, 409]);
  const current = await status(vault);
  assert.equal(current.sequence, 2);
  const oldRetry = await expect(await post(vault, first), 200);
  assert.deepEqual(oldRetry.checkpoint, retry.checkpoint);
  assert.equal(oldRetry.headId, current.headId);
  const changed = envelope(first.parentId, 99, 24, { id: first.id });
  await expect(await post(vault, changed), 409, 'idempotency-conflict');
  const conflict = await expect(await post(vault, envelope(null, 10)), 409, 'head-conflict');
  assert.equal(conflict.headId, current.headId);
  const retrieved = await expect(await get(vault, first.id), 200);
  assert.deepEqual(retrieved.checkpoint, first);
  assert.deepEqual(retrieved.receipt, retry.checkpoint);
  assert.deepEqual(await status(vault), current);
});

test('reject invalid hash, envelope, base64, UTF8, future wire version and unbounded bodies without mutation', async () => {
  const vault = kit();
  await expect(await enroll(vault), 201);
  const first = envelope();
  await expect(await post(vault, { ...first, sha256: '0'.repeat(64) }), 400, 'checksum-mismatch');
  for (const overrides of [
    { version: 2 }, { progressRows: -1 }, { progressRows: Number.MAX_SAFE_INTEGER + 1 },
    { iv: 'AAAAAAAAAAAAAAA=' }, { ciphertext: 'AAAAAAAAAAAAAAAAAAAAAB==' },
    { createdAt: '2026-02-31T12:00:00.000Z' }, { schemaVersion: -1 }, { extra: 'unexpected' },
  ]) await expect(await post(vault, envelope(null, 1, 24, overrides)), 400);
  await expect(await request(pathFor(vault, '/checkpoints'), {
    method: 'POST', token: vault.write, raw: '{"__proto__":{},"constructor":{}}',
  }), 400);
  await expect(await request(pathFor(vault, '/checkpoints'), {
    method: 'POST', token: vault.write, raw: new Uint8Array([0xff, 0xff]),
  }), 400);
  // App schema versions are not coupled to the deployed server.
  const futureSchema = envelope(null, 1, 24, { schemaVersion: 9000, createdAt: '2026-01-01T10:00:00+02:00' });
  await expect(await post(vault, futureSchema), 201);
  await expect(await request(pathFor(vault, '/checkpoints'), {
    method: 'POST', token: vault.write, raw: `"${'x'.repeat(8 * 1024 * 1024)}"`,
  }), 413, 'body-too-large');
  await expect(await request(pathFor(vault, '/checkpoints'), {
    method: 'POST', token: vault.write,
    raw: new ReadableStream({
      start(controller) {
        const chunk = new Uint8Array(8192);
        for (let i = 0; i < 1025; i++) controller.enqueue(chunk);
        controller.close();
      },
    }),
  }), 413, 'body-too-large');
  assert.equal((await status(vault)).sequence, 1);
  const afterOversize = envelope(futureSchema.id, 2);
  await expect(await post(vault, afterOversize), 201);
  assert.equal((await status(vault)).sequence, 2);
});

test('history decrease is explicit, wipes stay blocked, initial empty does not consume nonempty pin', async () => {
  const vault = kit();
  await expect(await enroll(vault), 201);
  const empty = envelope(null, 0);
  await expect(await post(vault, empty), 201);
  const first = envelope(empty.id, 10);
  await expect(await post(vault, first), 201);
  const decreased = envelope(first.id, 3);
  await expect(await post(vault, decreased), 409, 'history-decreased');
  await expect(await post(vault, decreased, { 'X-Confirm-History-Decrease': 'false' }), 409, 'history-decreased');
  await expect(await post(vault, decreased, { 'X-Confirm-History-Decrease': 'true' }), 201);
  await expect(await post(vault, envelope(decreased.id, 0), { 'X-Confirm-History-Decrease': 'true' }), 409, 'suspected-wipe');
  await expect(await get(vault, first.id), 200);
});

test('chunked large envelope roundtrip, receipt byte count, stored corruption fails closed', async () => {
  const vault = kit();
  await expect(await enroll(vault), 201);
  const item = envelope(null, 4, 400000);
  const result = await expect(await post(vault, item), 201);
  assert.equal(result.checkpoint.bytes, Buffer.byteLength(JSON.stringify(item)));
  assert.deepEqual((await expect(await get(vault, item.id), 200)).checkpoint, item);
  const inspect = await fixture(vault, 'inspect');
  assert.ok(inspect.chunks[0].count > 1);
  assert.equal(inspect.chunks[0].max, 65536);
  await fixture(vault, 'corrupt', { id: item.id });
  await expect(await get(vault, item.id), 500, 'storage-corrupt');
});

test('newest-first bounded pagination uses exclusive sequence cursors', async () => {
  const vault = kit();
  await expect(await enroll(vault), 201);
  let head = null;
  for (let i = 0; i < 5; i++) {
    const item = envelope(head, i + 1);
    await expect(await post(vault, item), 201);
    head = item.id;
  }
  const page = (query) => request(pathFor(vault, `/checkpoints?${query}`), { token: vault.read });
  const first = await expect(await page('limit=2'), 200);
  assert.deepEqual(first.checkpoints.map((item) => item.sequence), [5, 4]);
  const second = await expect(await page(`limit=2&cursor=${first.nextCursor}`), 200);
  assert.deepEqual(second.checkpoints.map((item) => item.sequence), [3, 2]);
  const third = await expect(await page(`limit=2&cursor=${second.nextCursor}`), 200);
  assert.deepEqual(third.checkpoints.map((item) => item.sequence), [1]);
  assert.equal(third.nextCursor, null);
  for (const query of ['limit=0', 'limit=51', 'cursor=0', 'cursor=-2', 'cursor=9007199254740992', 'cursor=2.5', 'limit=2&unexpected=x']) {
    await expect(await page(query), 400, 'invalid-pagination');
  }
});

test('real SQLite compacts frequent capture into bounded UTC anchors while preserving useful baseline', { timeout: 60000 }, async () => {
  const vault = kit();
  await expect(await enroll(vault), 201);
  const beginning = Date.UTC(2026, 0, 1);
  await fixture(vault, 'clock', { ms: beginning });
  let head = null;
  const ids = [];
  for (let i = 0; i < 250; i++) {
    await fixture(vault, 'clock', { ms: beginning + i * 30000 });
    const item = envelope(head, i === 0 ? 0 : i, 16, { createdAt: '2000-01-01T00:00:00.000Z' });
    await expect(await post(vault, item), 201);
    head = item.id;
    ids.push(item.id);
  }
  const active = await status(vault);
  assert.equal(active.sequence, 250);
  assert.ok(active.checkpointCount <= 12, JSON.stringify(active));
  await expect(await get(vault, ids[0]), 404, 'checkpoint-not-found');
  await expect(await get(vault, ids[1]), 200);
  const dailyIds = [];
  for (let date = 1; date <= 45; date++) {
    await fixture(vault, 'clock', { ms: beginning + date * 86400000 });
    const item = envelope(head, 250 + date);
    await expect(await post(vault, item), 201);
    head = item.id;
    dailyIds.push(item.id);
  }
  await expect(await get(vault, ids[1]), 200);
  await expect(await get(vault, dailyIds[0]), 404);
  await expect(await get(vault, dailyIds.at(-30)), 200);
  await expect(await get(vault, dailyIds.at(-1)), 200);
  assert.ok((await status(vault)).checkpointCount <= 63);
  assert.equal((await status(vault)).sequence, 295);
  const beforeWipe = await status(vault);
  await expect(await post(vault, envelope(head, 0), { 'X-Confirm-History-Decrease': 'true' }), 409, 'suspected-wipe');
  assert.deepEqual(await status(vault), beforeWipe);
});

test('byte quota failure leaves eligible copies and current head untouched atomically', async () => {
  const vault = kit();
  await expect(await enroll(vault), 201);
  const start = Date.UTC(2026, 0, 1);
  await fixture(vault, 'clock', { ms: start });
  const pin = envelope(null, 1);
  await expect(await post(vault, pin), 201);
  const eligible = envelope(pin.id, 2, 100000);
  await expect(await post(vault, eligible), 201);
  let head = eligible;
  for (let i = 0; i < 7; i++) {
    head = envelope(head.id, i + 3);
    await expect(await post(vault, head), 201);
  }
  await fixture(vault, 'usage', { bytes: maxBytes });
  const before = await status(vault);
  await expect(await post(vault, envelope(head.id, 10, 200000)), 507, 'capacity-exceeded');
  assert.deepEqual(await status(vault), before);
  await expect(await get(vault, eligible.id), 200);
  await expect(await get(vault, pin.id), 200);
  // A small write fits by pruning only the old eligible envelope.
  const compact = envelope(head.id, 10, 16);
  await expect(await post(vault, compact), 201);
  await expect(await get(vault, eligible.id), 404);
  await expect(await get(vault, head.id), 200);
  await expect(await get(vault, pin.id), 200);
});

test('daily/hourly anchors cannot be sacrificed to fit a larger write', async () => {
  const vault = kit();
  await expect(await enroll(vault), 201);
  const beginning = Date.UTC(2026, 0, 1);
  await fixture(vault, 'clock', { ms: beginning });
  const pin = envelope(null, 1);
  await expect(await post(vault, pin), 201);
  const anchor = envelope(pin.id, 2, 100000);
  await expect(await post(vault, anchor), 201);
  let head = anchor;
  for (let i = 1; i <= 8; i++) {
    await fixture(vault, 'clock', { ms: beginning + i * 86400000 });
    head = envelope(head.id, i + 2);
    await expect(await post(vault, head), 201);
  }
  await fixture(vault, 'usage', { bytes: maxBytes });
  const before = await status(vault);
  await expect(await post(vault, envelope(head.id, 20, 16)), 507, 'capacity-exceeded');
  assert.deepEqual(await status(vault), before);
  await expect(await get(vault, anchor.id), 200);
});

test('durable receipts survive runtime restart on the same local SQLite state', { timeout: 60000 }, async () => {
  const vault = kit();
  await expect(await enroll(vault), 201);
  const item = envelope();
  const receipt = await expect(await post(vault, item), 201);
  await stop();
  await start();
  assert.deepEqual((await expect(await get(vault, item.id), 200)).receipt, receipt.checkpoint);
  assert.deepEqual((await expect(await post(vault, item), 200)).checkpoint, receipt.checkpoint);
});

test('production entry has no fixture surface and enrollment fails closed without server secret', { timeout: 60000 }, async () => {
  await stop();
  await start('wrangler.toml');
  await expect(await request('/health'), 200);
  const response = await fetch(`${base}/v1/vaults`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${enrollment}` },
    body: JSON.stringify({ vaultId: randomUUID(), readTokenHash: hash('read'), writeTokenHash: hash('write') }),
  });
  await expect(response, 503, 'not-configured');
  await expect(await fetch(`${base}/__fixture/${randomUUID()}/usage`, {
    method: 'POST', headers: { Authorization: `Bearer ${fixtureSecret}` },
  }), 404, 'not-found');
});
