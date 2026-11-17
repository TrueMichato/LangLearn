import assert from 'node:assert/strict';
import { createHash, randomUUID, webcrypto } from 'node:crypto';
import { access, mkdir, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const help = `
Optional LangLearn browser disaster gate (synthetic data only)

Usage:
  DURABILITY_ENROLLMENT_CODE='<local synthetic code, at least 32 characters>' \\
    npm run test:durability -- \\
      --app-url http://127.0.0.1:5197/LangLearn/ \\
      --worker-url http://127.0.0.1:8797 \\
      --chrome '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

Options (or corresponding environment variables):
  --app-url       DURABILITY_APP_URL       Required app base URL, ending in /.
  --worker-url    DURABILITY_WORKER_URL    Required backup Worker origin.
  --chrome       DURABILITY_CHROME        Required installed Chrome executable.
  --help                                  Show this runbook; launch nothing.
  DURABILITY_ENROLLMENT_CODE               Required synthetic enrollment code.
                                          Environment only; never use VITE_* secrets.

Manual setup, from the repository root, using a supported Node (22.12+):
  # Local development needs valid CFS authentication. CI/hosted workloads need
  # approved workload identity, never personal Azure authentication. If CFS
  # authentication is unavailable, STOP; do not use a public-registry fallback
  # or bypass security. This gate provides no CI installer or authentication setup.
  gh cfs -- npm ci --legacy-peer-deps
  gh cfs -- npm ci --prefix tools/durability
  (cd infra/backup-worker && gh cfs -- npm ci)
  # Browser tooling is installed separately, never in the root app manifest.

  # Choose a SYNTHETIC code for this disposable local Worker, never production:
  export DURABILITY_ENROLLMENT_CODE="synthetic-local-only-$(node -p 'crypto.randomUUID()')"

  # Terminal 1; caller owns this local server and its disposable SQLite storage:
  (cd infra/backup-worker && npm run dev -- \\
    --ip 127.0.0.1 --port 8797 \\
    --var 'ALLOWED_ORIGINS:["http://127.0.0.1:5197"]' \\
    --var "ENROLLMENT_SECRET:$DURABILITY_ENROLLMENT_CODE")

  # Terminal 2; serve a fresh PRODUCTION build, not the Vite development server:
  npm run build
  npm run preview -- --host 127.0.0.1 --port 5197 --strictPort

  # Terminal 3, with the same synthetic code exported: run Usage above.
  # Use an existing system Chrome; playwright-core downloads no browser binary.

Safety and coverage:
  Only exact loopback hosts localhost, 127.0.0.1, [::1] are accepted.
  Credential/query/fragment URLs are refused before dependency load or launch.
  Browser requests are restricted to the two supplied origins; service workers
  are blocked. No persistent/user browser profile is opened or cleared.
  Four isolated desktop Chrome contexts use a 390x844 mobile viewport.
  Covers consent/kit gates, real encrypted uploads, held read-back confirmation,
  a lost response AFTER a real Worker commit and exact idempotent retry,
  wrong-key/no-write recovery, existing-data refusal, all 13 table families,
  references, manual sets, XP attempt tokens, guided-column-only progress,
  frozen drafts, and network-disabled kit + encrypted-file recovery.
  A native IndexedDB journal fault injects a durable late XP award: restoration
  and retry must preserve it, remain unverified, and export current encrypted
  conflicting progress containing that award with the original recovery kit.
  Valid optional undefined object fields are ALWAYS tested; no skip flag.
  Output omits recovery keys, capabilities, enrollment, page bodies and traces.
  A unique repository-local .test-state/verify-data-durability-* scratch directory
  holds this run's Chrome artifacts and downloads and is removed in finally.
  Existing servers remain caller-owned; the gate does not stop or reset them.
  Each run retains one synthetic vault in the caller's LOCAL Worker storage;
  dispose of that dedicated local storage yourself after stopping the server.
  This is a manual gate, not CI, a production-cloud deployment, real iOS/Safari,
  service-worker/offline app boot, or protection if all copies and kits are lost.
`;

class VerificationInputError extends Error {}

function loopbackURL(value, worker = false) {
  let url;
  try { url = new URL(value); } catch {
    throw new VerificationInputError('Supply complete loopback app and Worker URLs; see --help.');
  }
  if (!['http:', 'https:'].includes(url.protocol) ||
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
      url.username || url.password || url.search || url.hash ||
      /[?#@\\]/.test(value) ||
      (worker ? url.pathname !== '/' : !url.pathname.endsWith('/'))) {
    throw new VerificationInputError('Refused unsafe URL: use loopback only, no credentials/query/fragment, an app base ending in /, and a Worker origin.');
  }
  return worker ? url.origin : url.href;
}

function configuration() {
  let values;
  try {
    ({ values } = parseArgs({
      options: {
        'app-url': { type: 'string' },
        'worker-url': { type: 'string' },
        chrome: { type: 'string' },
        help: { type: 'boolean', short: 'h' },
      },
    }));
  } catch {
    throw new VerificationInputError('Unrecognized or missing option; see --help.');
  }
  if (values.help) return null;
  const app = loopbackURL(values['app-url'] ?? process.env.DURABILITY_APP_URL ?? '');
  const endpoint = loopbackURL(values['worker-url'] ?? process.env.DURABILITY_WORKER_URL ?? '', true);
  const enrollment = process.env.DURABILITY_ENROLLMENT_CODE;
  if (!enrollment || enrollment.trim().length < 32 || enrollment.length > 4096 ||
      /[\r\n]/.test(enrollment)) {
    throw new VerificationInputError('Set DURABILITY_ENROLLMENT_CODE to an explicit synthetic local enrollment code (32–4096 characters).');
  }
  const chrome = values.chrome ?? process.env.DURABILITY_CHROME;
  if (!chrome) throw new VerificationInputError('Supply an existing system Chrome executable with --chrome or DURABILITY_CHROME.');
  return { app, endpoint, enrollment, chrome: resolve(chrome) };
}

async function verify({ app, endpoint, enrollment, chrome }) {
  await access(chrome).catch(() => {
    throw new VerificationInputError('The supplied Chrome executable is unavailable; no browser will be installed.');
  });
  await access(new URL('./node_modules/playwright-core/package.json', import.meta.url)).catch(() => {
    throw new VerificationInputError('Missing optional browser tooling: run `gh cfs -- npm ci --prefix tools/durability` with valid local CFS authentication (CI/hosted workloads require approved workload identity, never personal Azure authentication); no public-registry fallback. See --help.');
  });
  const scratch = resolve('.test-state', `verify-data-durability-${randomUUID()}`);
  const savedEnvironment = Object.fromEntries(['TMPDIR', 'TMP', 'TEMP'].map((key) => [key, process.env[key]]));
  const checks = [];
  const errors = [];
  const allowedOrigins = new Set([new URL(app).origin, endpoint]);
  let browser;
  let timer;
  let readbackTimer;
  let releaseReadback = () => {};
  let stage = 'starting isolated Chrome';
  let failure;
  let interrupted = false;
  const interrupt = () => {
    interrupted = true;
    releaseReadback();
    void browser?.close().catch(() => {});
  };
  await mkdir(scratch, { recursive: true });

  async function contextFor() {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, acceptDownloads: true, serviceWorkers: 'block',
    });
    await context.route('**/*', (route) => {
      const requestURL = new URL(route.request().url());
      if (allowedOrigins.has(requestURL.origin) &&
          !requestURL.username && !requestURL.password &&
          ['http:', 'https:'].includes(requestURL.protocol)) return route.continue();
      errors.push('blocked non-test-origin request');
      return route.abort('blockedbyclient');
    });
    await context.routeWebSocket('**/*', (socket) => socket.close());
    return context;
  }

  async function pageFor(context) {
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);
    page.on('pageerror', () => errors.push('browser page error'));
    const response = await page.goto(app, { waitUntil: 'networkidle' });
    assert.ok(response?.ok(), 'App server must return success.');
    assert.equal((await response.text()).includes('/@vite/client'), false, 'Use a production preview, not the Vite development server.');
    await page.getByText('Opening backup safety storage…', { exact: true })
      .waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Returning learner? Recover with a saved backup kit' })
      .waitFor({ state: 'visible' });
    return page;
  }

  async function download(page, name) {
    const [file] = await Promise.all([
      page.waitForEvent('download', { timeout: 15_000 }),
      page.getByRole('button', { name, exact: true }).click({ timeout: 15_000 }),
    ]);
    try { return await readFile(await file.path()); }
    finally { await file.delete(); }
  }

  async function openRecovery(page) {
    await page.getByRole('button', { name: 'Returning learner? Recover with a saved backup kit' }).click();
    await page.getByRole('heading', { name: 'Recover an encrypted backup', exact: true }).waitFor();
  }

  async function loadKit(page, buffer) {
    await page.getByLabel('Recovery kit file', { exact: true }).setInputFiles({
      name: 'synthetic-recovery-kit.json', mimeType: 'application/json', buffer,
    });
    await page.getByRole('button', { name: 'List recovery versions', exact: true }).waitFor();
  }

  try {
    for (const key of Object.keys(savedEnvironment)) process.env[key] = scratch;
    const { chromium } = await import('playwright-core');
    process.once('SIGINT', interrupt);
    process.once('SIGTERM', interrupt);
    timer = setTimeout(() => { stage = 'overall verification deadline'; interrupt(); }, 180_000);
    timer.unref();
    browser = await chromium.launch({ executablePath: chrome, headless: true, downloadsPath: scratch });
    if (interrupted) throw new Error('Interrupted');
    const original = await contextFor();
    const network = [];
    original.on('request', (request) => {
      if (new URL(request.url()).origin === endpoint) network.push({
        method: request.method(), pathname: new URL(request.url()).pathname,
        body: request.postData(),
      });
    });
    const page = await pageFor(original);

    stage = 'seeding all 13 tables and browser progress, including valid optional undefined fields';
    await seed(page);
    await page.goto(`${app}#/settings`, { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Independent encrypted backups', exact: true }).waitFor();
    await page.getByText('Unconfigured', { exact: true }).waitFor();
    assert.equal(network.length, 0);
    await page.getByLabel('Backup service address').fill(endpoint);
    await page.getByLabel('One-time enrollment code').fill(enrollment);
    const create = page.getByRole('button', { name: 'Create my backup vault', exact: true });
    assert.equal(await create.isDisabled(), true);
    assert.equal(network.length, 0);
    checks.push('No enrollment/upload before explicit opt-in; consent is required.');

    stage = 'enrolling and checking the independent kit download gate';
    await page.getByRole('checkbox', { name: /I agree to store encrypted copies/ }).check();
    await create.click();
    await page.getByText('Needs recovery kit confirmation', { exact: true }).waitFor();
    const enable = page.getByRole('button', { name: 'Enable automatic encrypted backups', exact: true });
    const savedKit = page.getByRole('checkbox', { name: /I saved the kit somewhere independent/ });
    assert.equal(await enable.isDisabled(), true);
    assert.equal(await savedKit.isDisabled(), true);
    assert.equal(network.filter((request) => request.method === 'POST' && request.pathname.endsWith('/checkpoints')).length, 0);
    const kitBytes = await download(page, 'Download private recovery kit');
    const kit = JSON.parse(kitBytes);
    assert.equal(kit.endpoint, endpoint);
    assert.equal(await enable.isDisabled(), true);
    assert.equal(network.filter((request) => request.method === 'POST' && request.pathname.endsWith('/checkpoints')).length, 0);
    checks.push('Enrollment alone and downloading the kit do not upload learning data; independent kit confirmation is required.');

    stage = 'holding real remote read-back to verify confirmation timing';
    let readbackStarted;
    const started = new Promise((resolve) => { readbackStarted = resolve; });
    const held = new Promise((resolve) => { releaseReadback = resolve; });
    let readbackVerified = false;
    await page.route(`${endpoint}/v1/vaults/*/checkpoints/*`, async (route) => {
      try {
        const response = await route.fetch({ timeout: 30_000, maxRedirects: 0 });
        if (!response.ok()) throw new Error('Remote read-back failed');
        readbackStarted();
        await held;
        await route.fulfill({ response });
        readbackVerified = true;
      } catch {
        errors.push('remote read-back interception failed');
        readbackStarted();
        await route.abort().catch(() => {});
      }
    });
    await savedKit.check();
    await enable.click();
    try {
      await Promise.race([
        started,
        new Promise((_, reject) => {
          readbackTimer = setTimeout(() => reject(new Error('Remote read-back did not start')), 45_000);
        }),
      ]);
    } finally { clearTimeout(readbackTimer); }
    assert.equal(await page.getByText('Remote confirmed', { exact: true }).count(), 0);
    await page.getByText('Uploading — confirmation pending', { exact: true }).waitFor();
    releaseReadback();
    await page.getByText('Remote confirmed', { exact: true }).waitFor({ timeout: 45_000 });
    assert.equal(readbackVerified, true);
    await page.unroute(`${endpoint}/v1/vaults/*/checkpoints/*`);
    checks.push('Confirmation waits for successful real Worker remote read-back.');

    stage = 'losing a response after a real Worker commit and retrying the exact checkpoint';
    const remoteStatus = () => page.evaluate(async ({ endpoint, vaultId, readToken }) => {
      const response = await fetch(`${endpoint}/v1/vaults/${vaultId}/status`, {
        headers: { Authorization: `Bearer ${readToken}` },
        credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer',
      });
      if (response.status !== 200) throw new Error('Remote status failed');
      return response.json();
    }, { endpoint, vaultId: kit.vaultId, readToken: kit.readToken });
    const beforeLostAck = await remoteStatus();
    let droppedStatus;
    const retriedBodies = [];
    await page.route(`${endpoint}/v1/vaults/*/checkpoints`, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      retriedBodies.push(route.request().postData());
      if (retriedBodies.length > 1) return route.fallback();
      try {
        const response = await route.fetch({ timeout: 30_000, maxRedirects: 0 });
        droppedStatus = response.status();
        await route.abort('failed');
      } catch {
        errors.push('post-commit lost-response interception failed');
        await route.abort().catch(() => {});
      }
    });
    await page.evaluate(async () => {
      const database = await new Promise((resolve, reject) => {
        const request = indexedDB.open('LangLearnDB');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = () => { request.transaction.abort(); reject(new Error('Fixture database is not ready')); };
      });
      try {
        await new Promise((resolve, reject) => {
          const transaction = database.transaction('words', 'readwrite');
          const words = transaction.objectStore('words');
          const request = words.get(41);
          request.onsuccess = () => words.put({ ...request.result, meaning: 'synthetic-private-cat-updated' });
          transaction.oncomplete = resolve;
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error);
        });
      } finally { database.close(); }
    });
    const retry = page.getByRole('button', { name: 'Back up now / retry', exact: true });
    await retry.click();
    await page.getByText('Backup needs attention', { exact: true }).waitFor();
    assert.equal(droppedStatus, 201);
    assert.equal(await page.getByText('Remote confirmed', { exact: true }).count(), 0);
    const committed = await remoteStatus();
    assert.equal(committed.sequence, beforeLostAck.sequence + 1);
    assert.equal(committed.checkpointCount, beforeLostAck.checkpointCount + 1);
    await retry.click();
    await page.getByText('Remote confirmed', { exact: true }).waitFor({ timeout: 45_000 });
    const afterLostAck = await remoteStatus();
    assert.equal(afterLostAck.sequence, committed.sequence);
    assert.equal(afterLostAck.checkpointCount, committed.checkpointCount);
    assert.ok(retriedBodies.length >= 2);
    assert.ok(retriedBodies.every((body) => body === retriedBodies[0]));
    await page.unroute(`${endpoint}/v1/vaults/*/checkpoints`);
    checks.push('A response lost AFTER real Worker 201 commit retries identical checkpoint bytes; sequence and retained count increase exactly once.');

    const uploads = network.filter((request) => request.method === 'POST' && request.pathname.endsWith('/checkpoints'));
    assert.ok(uploads.length > 0);
    for (const request of uploads) {
      const envelope = JSON.parse(request.body);
      assert.equal(envelope.version, 1);
      assert.ok(typeof envelope.ciphertext === 'string' && envelope.ciphertext.length > 100);
      assert.ok(typeof envelope.iv === 'string' && typeof envelope.sha256 === 'string');
    }
    for (const request of network) {
      for (const plaintext of ['synthetic-private-cat', 'Synthetic reading content.', 'Synthetic frozen question', kit.encryptionKey, kit.readToken, kit.writeToken]) {
        assert.equal(request.body?.includes(plaintext) ?? false, false);
      }
    }
    checks.push('Real Worker uploads contain ciphertext, not learner plaintext or kit capabilities.');
    const checkpointBytes = await download(page, 'Export current data as an encrypted checkpoint');
    for (const plaintext of ['synthetic-private-cat', kit.encryptionKey, kit.readToken, kit.writeToken]) {
      assert.equal(checkpointBytes.includes(Buffer.from(plaintext)), false);
    }
    const source = await readRestored(page);
    assert.equal(Object.hasOwn(source.tables.words[0], 'learnerEdited'), true);
    assert.equal(source.tables.words[0].learnerEdited, undefined);
    assert.equal(Object.hasOwn(source.tables.reviews[0], 'stability'), true);
    assert.equal(source.tables.reviews[0].stability, undefined);
    assert.equal(Object.hasOwn(source.tables.reviews[0], 'difficulty'), true);
    assert.equal(source.tables.reviews[0].difficulty, undefined);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await original.close();

    stage = 'wrong-key recovery without writes in a second isolated profile';
    const fresh = await contextFor();
    const recovery = await pageFor(fresh);
    const empty = await readRestored(recovery);
    assert.equal(empty.tables.words.length, 0);
    assert.equal(empty.xp?.state.bonusXP ?? 0, 0);
    await openRecovery(recovery);
    const wrongKit = { ...kit, encryptionKey: Buffer.alloc(32, 9).toString('base64') };
    await loadKit(recovery, Buffer.from(JSON.stringify(wrongKit)));
    await recovery.getByRole('button', { name: 'List recovery versions', exact: true }).click();
    await recovery.getByRole('button', { name: 'Decrypt and preview', exact: true }).first().click();
    await recovery.getByText(/cannot authenticate the checkpoint/).waitFor();
    assert.deepEqual(await readRestored(recovery), empty);
    checks.push('Wrong recovery key fails without writing any learning tables or browser progress.');

    stage = 'refusing restoration over newer existing learner data';
    await loadKit(recovery, kitBytes);
    await recovery.getByRole('button', { name: 'List recovery versions', exact: true }).click();
    await recovery.getByRole('button', { name: 'Decrypt and preview', exact: true }).first().click();
    await recovery.getByRole('heading', { name: 'Verified recovery point', exact: true }).waitFor();
    await existingRecord(recovery, true);
    const newer = await readRestored(recovery);
    await recovery.getByRole('checkbox', { name: /I am restoring into a fresh profile/ }).check();
    await recovery.getByRole('button', { name: 'Restore this recovery point', exact: true }).click();
    await recovery.getByText(/already has saved learning data/).waitFor();
    assert.deepEqual(await readRestored(recovery), newer);
    await existingRecord(recovery, false);
    checks.push('Restore refuses existing learner data and preserves the newer record.');

    stage = 'restoring and reloading all table families, relationships and browser progress';
    await recovery.getByRole('button', { name: 'Restore this recovery point', exact: true }).click();
    await recovery.getByRole('button', { name: 'Reload restored progress', exact: true }).waitFor({ timeout: 30_000 });
    assertRestored(await readRestored(recovery));
    await Promise.all([
      recovery.waitForEvent('load'),
      recovery.getByRole('button', { name: 'Reload restored progress', exact: true }).click(),
    ]);
    await recovery.locator('nav').waitFor({ state: 'visible', timeout: 30_000 });
    assertRestored(await readRestored(recovery));
    await recovery.goto(`${app}#/review`, { waitUntil: 'networkidle' });
    await recovery.getByText('Synthetic manual set', { exact: true }).waitFor();
    checks.push('Fresh remote recovery survives reload: 13 tables, original references, manual sets, XP attempt token, guided-column-only progress and frozen draft; optional undefined fields capture safely.');
    await fresh.close();

    stage = 'network-disabled kit and encrypted-file recovery in a third isolated profile';
    const offline = await contextFor();
    const offlinePage = await pageFor(offline);
    await openRecovery(offlinePage);
    await loadKit(offlinePage, kitBytes);
    await offline.setOffline(true);
    await offlinePage.getByLabel('Or open an encrypted checkpoint file offline').setInputFiles({
      name: 'synthetic-offline-checkpoint.json', mimeType: 'application/json', buffer: checkpointBytes,
    });
    await offlinePage.getByRole('heading', { name: 'Verified recovery point', exact: true }).waitFor();
    await offlinePage.getByRole('checkbox', { name: /I am restoring into a fresh profile/ }).check();
    await offlinePage.getByRole('button', { name: 'Restore this recovery point', exact: true }).click();
    await offlinePage.getByRole('button', { name: 'Reload restored progress', exact: true }).waitFor({ timeout: 30_000 });
    assertRestored(await readRestored(offlinePage));
    checks.push('Third fresh profile restores kit + encrypted file with networking disabled.');
    await offline.close();

    stage = 'preserving a durable late XP award injected after the database-written journal put';
    const concurrent = await contextFor();
    const concurrentPage = await pageFor(concurrent);
    await openRecovery(concurrentPage);
    await loadKit(concurrentPage, kitBytes);
    await concurrentPage.getByRole('button', { name: 'List recovery versions', exact: true }).click();
    await concurrentPage.getByRole('button', { name: 'Decrypt and preview', exact: true }).first().click();
    await concurrentPage.getByRole('heading', { name: 'Verified recovery point', exact: true }).waitFor();
    await concurrentPage.evaluate(() => {
      const originalPut = IDBObjectStore.prototype.put;
      const fault = { reached: false, durableAtInjection: false, phases: [] };
      window.__durabilityRestoreRace = fault;
      IDBObjectStore.prototype.put = function (value, ...keys) {
        const request = originalPut.call(this, value, ...keys);
        if (this.transaction.db.name === 'LangLearnIndependentBackupV1' &&
            this.name === 'journal' && value?.id === 'restore') {
          const phase = value.phase;
          request.addEventListener('success', () => {
            fault.phases.push(phase);
            if (phase === 'database-written' && !fault.reached) {
              fault.reached = true;
              localStorage.setItem('langlearn-xp', JSON.stringify({
                version: 2, state: { bonusXP: 25, creditedVocabAttempts: {} },
              }));
              fault.durableAtInjection = JSON.parse(localStorage.getItem('langlearn-xp')).state.bonusXP === 25;
            }
          });
        }
        return request;
      };
    });
    await concurrentPage.getByRole('checkbox', { name: /I am restoring into a fresh profile/ }).check();
    await concurrentPage.getByRole('button', { name: 'Restore this recovery point', exact: true }).click();
    await concurrentPage.waitForFunction(() => window.__durabilityRestoreRace?.reached === true);
    const retryOriginal = concurrentPage.getByRole('button', { name: 'Retry original recovery', exact: true });
    await retryOriginal.waitFor();
    assertRacePreserved(await readRestoreRace(concurrentPage));
    assert.equal(await concurrentPage.getByRole('button', { name: 'Reload restored progress', exact: true }).count(), 0);
    await retryOriginal.click();
    await concurrentPage.getByRole('alert').waitFor();
    assertRacePreserved(await readRestoreRace(concurrentPage));
    assert.equal(await concurrentPage.getByRole('button', { name: 'Reload restored progress', exact: true }).count(), 0);
    const conflictingBytes = await download(concurrentPage, 'Export current encrypted progress');
    const conflictingPayload = await decryptExport(conflictingBytes, kit);
    assert.equal(JSON.parse(conflictingPayload.localStorage['langlearn-xp']).state.bonusXP, 25);
    assert.equal(conflictingPayload.tables.words.find((word) => word.id === 41)?.sourceTextId, 91);
    assert.equal(conflictingBytes.includes(Buffer.from('synthetic-private-cat')), false);
    assertRacePreserved(await readRestoreRace(concurrentPage));
    checks.push('Fourth profile reaches the native database-written fault: durable late XP stays 25, restore/retry never verifies or overwrites it, and current encrypted conflict export preserves 25 with the original kit.');
    await concurrent.close();
    assert.deepEqual(errors, []);
  } catch (error) {
    failure = {
      result: 'failed', stage,
      category: error instanceof assert.AssertionError ? 'assertion' :
        error?.name === 'TimeoutError' ? 'browser timeout' : 'browser or API failure',
      checksPassed: checks.length,
      message: 'No page bodies, keys, capabilities, enrollment or raw exception details are logged. Check local server readiness, CORS, current UI/API and this stage; see --help.',
    };
  } finally {
    clearTimeout(timer);
    clearTimeout(readbackTimer);
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
    releaseReadback();
    try {
      await browser?.close();
      await rm(scratch, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    } catch {
      failure ??= { result: 'failed', stage: 'cleaning this run’s browser artifacts', category: 'cleanup failure' };
    } finally {
      for (const [key, value] of Object.entries(savedEnvironment)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  }
  if (failure) {
    console.error(JSON.stringify(failure, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify({
    result: 'passed',
    environment: 'Desktop system Chrome, four isolated contexts, mobile 390x844 viewport; caller-owned loopback production preview and real Worker; synthetic data only.',
    limitations: 'Not real iOS/Safari, production cloud, service-worker/offline app boot, or protection against loss of every copy and kit. Synthetic local Worker vault remains caller-owned.',
    checks,
  }, null, 2));
}

async function readRestoreRace(page) {
  return page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('LangLearnIndependentBackupV1');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = () => {
        request.transaction.abort();
        reject(new Error('Verifier refused to create missing restore safety storage'));
      };
    });
    try {
      const phase = await new Promise((resolve, reject) => {
        const transaction = database.transaction('journal');
        const request = transaction.objectStore('journal').get('restore');
        let value;
        request.onsuccess = () => { value = request.result?.phase; };
        transaction.oncomplete = () => resolve(value);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
      return {
        phase,
        bonusXP: JSON.parse(localStorage.getItem('langlearn-xp'))?.state.bonusXP,
        ...window.__durabilityRestoreRace,
      };
    } finally { database.close(); }
  });
}

function assertRacePreserved(value) {
  assert.equal(value.reached, true);
  assert.equal(value.durableAtInjection, true);
  assert.equal(value.bonusXP, 25);
  assert.ok(['prepared', 'database-written'].includes(value.phase));
  assert.ok(value.phases.includes('database-written'));
  assert.equal(value.phases.includes('verified'), false);
}

async function decryptExport(bytes, kit) {
  const file = JSON.parse(bytes);
  assert.deepEqual(Object.keys(file).sort(), ['checkpoint', 'vaultId', 'version']);
  assert.equal(file.version, 1);
  assert.equal(file.vaultId, kit.vaultId);
  const envelope = file.checkpoint;
  assert.equal(envelope.version, 1);
  const header = [
    envelope.version, envelope.id, envelope.parentId, envelope.createdAt,
    envelope.schemaVersion, envelope.progressRows,
  ];
  assert.equal(envelope.sha256, createHash('sha256').update(
    JSON.stringify([...header, envelope.iv, envelope.ciphertext]),
  ).digest('hex'));
  const key = await webcrypto.subtle.importKey('raw', Buffer.from(kit.encryptionKey, 'base64'), 'AES-GCM', false, ['decrypt']);
  const plaintext = await webcrypto.subtle.decrypt({
    name: 'AES-GCM', iv: Buffer.from(envelope.iv, 'base64'),
    additionalData: Buffer.from(JSON.stringify(header)), tagLength: 128,
  }, key, Buffer.from(envelope.ciphertext, 'base64'));
  return JSON.parse(Buffer.from(plaintext).toString('utf8'));
}

async function databaseFor(page, action, argument) {
  return page.evaluate(async ({ action, argument }) => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('LangLearnDB');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = () => {
        request.transaction.abort();
        reject(new Error('Verifier refused to create a database before the app was ready'));
      };
    });
    try {
      if (action === 'existing') {
        await new Promise((resolve, reject) => {
          const transaction = database.transaction('words', 'readwrite');
          const words = transaction.objectStore('words');
          if (argument) words.put({
            id: 70, language: 'es', word: 'new work', reading: '', meaning: 'must survive',
            contextSentence: '', sourceTextId: null, tags: [], type: 'word', createdAt: '2026-11-17T01:00:00.000Z',
          });
          else words.delete(70);
          transaction.oncomplete = resolve;
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error);
        });
        return;
      }
      const tableNames = [
        'words', 'reviews', 'texts', 'studySessions', 'settings', 'dailyActivity',
        'lessonProgress', 'characterProgress', 'testHistory', 'badges', 'reviewLog',
        'guidedActivityProgress', 'skillProgress',
      ];
      const tables = await new Promise((resolve, reject) => {
        const transaction = database.transaction(tableNames);
        const result = {};
        for (const name of tableNames) {
          const request = transaction.objectStore(name).getAll();
          request.onsuccess = () => { result[name] = request.result; };
        }
        transaction.oncomplete = () => resolve(result);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
      return {
        tables,
        xp: JSON.parse(localStorage.getItem('langlearn-xp')),
        sets: JSON.parse(localStorage.getItem('langlearn-study-sets')),
        groups: JSON.parse(localStorage.getItem('langlearn-guided-ja-Hiragana')),
        drafts: JSON.parse(localStorage.getItem('langlearn-assessment-drafts')),
      };
    } finally { database.close(); }
  }, { action, argument });
}

function readRestored(page) { return databaseFor(page, 'read', null); }
function existingRecord(page, present) { return databaseFor(page, 'existing', present); }

function assertRestored(value) {
  assert.equal(Object.keys(value.tables).length, 13);
  assert.equal(value.tables.words.find((word) => word.id === 41)?.sourceTextId, 91);
  assert.equal(value.tables.words.find((word) => word.id === 41)?.meaning, 'synthetic-private-cat-updated');
  assert.equal(value.tables.reviews.find((review) => review.id === 17)?.wordId, 41);
  assert.equal(value.tables.texts.find((text) => text.id === 91)?.title, 'Synthetic reading');
  assert.equal(value.tables.studySessions.find((session) => session.id === 71)?.durationSeconds, 600);
  assert.equal(value.tables.dailyActivity.find((day) => day.date === '2026-11-17')?.studySeconds, 600);
  assert.equal(value.tables.lessonProgress.find((lesson) => lesson.id === 'ja/particles')?.completed, true);
  assert.equal(value.tables.characterProgress.find((row) => row.id === 'ja/Hiragana/a')?.correctCount, 4);
  assert.equal(value.tables.testHistory.find((row) => row.id === 81)?.score, 90);
  assert.ok(value.tables.badges.some((badge) => badge.id === 'xp-100'));
  assert.equal(value.tables.reviewLog.find((row) => row.id === 301)?.reviewId, 17);
  assert.equal(value.tables.reviewLog.find((row) => row.id === 301)?.wordId, 41);
  assert.equal(value.tables.guidedActivityProgress.find((row) => row.id === 'ja/foundation')?.itemsCompleted, 10);
  assert.equal(value.tables.skillProgress.find((row) => row.id === 'ja/numbers/basic')?.correct, 2);
  assert.ok(value.tables.settings.some((setting) => setting.key === 'synthetic-pref' && setting.value === 'retained'));
  assert.equal(value.tables.settings.some((setting) => setting.key === 'push-endpoint'), false);
  assert.equal(value.xp.state.bonusXP, 175);
  assert.equal(value.xp.state.creditedVocabAttempts['11111111-1111-4111-8111-111111111111'], 25);
  assert.deepEqual(value.sets.state.sets.find((set) => set.id === 'synthetic-manual').wordIds, [41]);
  assert.deepEqual(value.groups, ['Vowels']);
  assert.equal(value.drafts.drafts[0].questions[0].question, 'Synthetic frozen question');
}

async function seed(page) {
  await page.evaluate(async () => {
    const time = '2026-11-17T01:00:00.000Z';
    const records = {
      words: [{ id: 41, language: 'ja', word: 'cat', reading: 'cat', meaning: 'synthetic-private-cat',
        contextSentence: 'A synthetic cat.', sourceTextId: 91, tags: ['synthetic'], type: 'word', createdAt: time,
        learnerEdited: undefined }],
      reviews: [{ id: 17, wordId: 41, ease: 2.5, interval: 7, repetitions: 3,
        nextReviewDate: '2026-11-24', lastReviewDate: '2026-11-17', stability: undefined, difficulty: undefined }],
      texts: [{ id: 91, language: 'ja', title: 'Synthetic reading', content: 'Synthetic reading content.', createdAt: time }],
      studySessions: [{ id: 71, startTime: time, endTime: '2026-11-17T01:10:00.000Z',
        durationSeconds: 600, activity: 'srs', xpEarned: 20, language: 'ja' }],
      settings: [{ key: 'synthetic-pref', value: 'retained' },
        { key: 'push-endpoint', value: 'https://push.invalid/synthetic-device-only-capability' }],
      dailyActivity: [{ date: '2026-11-17', studySeconds: 600, cardsReviewed: 3, wordsAdded: 1, goalMet: true }],
      lessonProgress: [{ id: 'ja/particles', language: 'ja', lessonId: 'particles', completed: true,
        quizScore: 90, completedAt: time, attempts: 2 }],
      characterProgress: [{ id: 'ja/Hiragana/a', language: 'ja', character: 'a', romanji: 'a',
        correctCount: 4, totalAttempts: 5, lastPracticed: time, mastery: 'mastered' }],
      testHistory: [{ id: 81, language: 'ja', type: 'vocabulary', score: 90, level: 'elementary',
        totalQuestions: 10, correctAnswers: 9, durationSeconds: 90, date: time }],
      badges: [{ id: 'xp-100', unlockedAt: time }],
      reviewLog: [{ id: 301, reviewId: 17, wordId: 41, language: 'ja', grade: 4, isLapse: false, date: time }],
      guidedActivityProgress: [{ id: 'ja/foundation', language: 'ja', milestoneId: 'foundation',
        activity: 'grammar', completedAt: time, attempts: 1, itemsCompleted: 10, bestScore: 90 }],
      skillProgress: [{ id: 'ja/numbers/basic', language: 'ja', activity: 'numbers',
        skill: 'basic', attempts: 3, correct: 2 }],
    };
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('LangLearnDB');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = () => { request.transaction.abort(); reject(new Error('Fixture database is not ready')); };
    });
    try {
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(Object.keys(records), 'readwrite');
        for (const [table, rows] of Object.entries(records)) {
          for (const row of rows) transaction.objectStore(table).put(row);
        }
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
      const transaction = database.transaction(['words', 'reviews']);
      const rows = await Promise.all(['words', 'reviews'].map((name) => new Promise((resolve, reject) => {
        const request = transaction.objectStore(name).get(name === 'words' ? 41 : 17);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })));
      if (!Object.hasOwn(rows[0], 'learnerEdited') || rows[0].learnerEdited !== undefined ||
          !Object.hasOwn(rows[1], 'stability') || rows[1].stability !== undefined ||
          !Object.hasOwn(rows[1], 'difficulty') || rows[1].difficulty !== undefined) {
        throw new Error('Native IndexedDB must retain valid optional undefined fields in the fixture');
      }
    } finally { database.close(); }
    localStorage.setItem('langlearn-settings', JSON.stringify({
      version: 1, state: { onboardingComplete: true, activeLanguages: ['ja'], currentLanguage: 'ja' },
    }));
    localStorage.setItem('langlearn-xp', JSON.stringify({ version: 2, state: {
      bonusXP: 175, creditedVocabAttempts: { '11111111-1111-4111-8111-111111111111': 25 },
    } }));
    localStorage.setItem('langlearn-badges', JSON.stringify({ version: 1, state: {
      unlockedBadges: { 'xp-100': time }, lastToast: null,
    } }));
    localStorage.setItem('langlearn-study-sets', JSON.stringify({ version: 2, state: { _initialized: true, sets: [{
      id: 'synthetic-manual', name: 'Synthetic manual set', description: 'Verification only',
      type: 'custom', tags: [], selectionMode: 'manual', wordIds: [41], language: 'ja', createdAt: time,
    }] } }));
    localStorage.setItem('langlearn-guided-ja-Hiragana', JSON.stringify(['Vowels']));
    localStorage.setItem('langlearn-assessment-drafts', JSON.stringify({ version: 1, drafts: [{
      id: 'ja/grammar/particles', language: 'ja', kind: 'grammar', lessonIds: ['particles'], savedAt: Date.now(),
      questions: [{ id: 1, category: 'grammar', question: 'Synthetic frozen question',
        options: ['A', 'B'], correctIndex: 0 }],
      index: 0, correctCount: 0, selectedIndex: null,
    }] }));
  });
}

try {
  const config = configuration();
  if (config) await verify(config);
  else console.log(help);
} catch (error) {
  console.error(error instanceof VerificationInputError ? error.message :
    'Durability gate could not initialize safely. Check the installed Node, Chrome and local filesystem permissions; see --help.');
  process.exitCode = 1;
}
