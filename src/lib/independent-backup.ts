import { BACKUP_TABLE_NAMES } from '../db/backup';
import { db } from '../db/schema';
import {
  assertFreshRestoreTarget, captureIndependentPayload, independentProgressRows,
  isIndependentStorageKey, payloadContent, readIndependentPayload, validateIndependentPayload,
  independentTablesContent, readIndependentStorage,
  stableBackupJSON,
  type IndependentBackupPayload,
} from '../db/independent-backup-payload';
import { independentBackupStore, type BackupClientState, type IndependentBackupStore, type RestoreJournal } from '../db/independent-backup-store';
import {
  BackupError, createRecoveryKit, decryptCheckpoint, encryptCheckpoint, isBackupUUID, isRecord,
  isSafeCount, MAX_CHECKPOINT_BYTES, parseCheckpointSummary, parseRecoveryKit, sha256,
  type CheckpointEnvelope, type CheckpointSummary, type RecoveryKit,
} from './backup-crypto';
import { useSettingsStore } from '../stores/settingsStore';
import { useXPStore } from '../stores/xpStore';
import { useBadgeStore } from '../stores/badgeStore';
import { useStudySetsStore } from '../stores/studySetsStore';
import { BACKUP_SOURCE_EVENT } from './backup-source';

const errorMessages: Record<string, string> = {
  'head-conflict': 'Another device has a newer remote head. Your exact queued checkpoint was kept. Import your kit and inspect recovery versions; do not overwrite or automatically combine these datasets.',
  'idempotency-conflict': 'The service has different bytes for this checkpoint ID. The queued copy was kept. Export it and inspect recovery versions before reconnecting.',
  'history-decreased': 'This copy contains less saved history. Previous remote versions are safe. Inspect them first; confirm the decrease only if you deliberately removed learning data.',
  'suspected-wipe': 'This empty copy was refused because earlier remote history exists. Recover an earlier version; an empty reset must not replace it.',
  unauthorized: 'The service did not accept this capability. Check that the recovery kit belongs to this endpoint and vault.',
  forbidden: 'This origin or capability is not allowed by the backup service. Check the service’s allowed origins and your kit.',
  capacity: 'The vault is full. Existing remote copies were not erased. Export an encrypted file and ask the service operator to increase capacity.',
  'not-found': 'This vault or checkpoint was not found at the kit’s endpoint. Check the service address, try another retained version, or open an encrypted checkpoint file offline.',
  'vault-not-found': 'This vault was not found at the kit’s endpoint. Check the service address and your saved kit; a replacement empty vault was not created.',
  'checkpoint-not-found': 'This checkpoint is no longer available at the service. Choose another retained version or open an encrypted checkpoint file offline.',
};

/** Never surface a response body, bearer, key, learner data, or arbitrary thrown value. */
export function backupProblem(error: unknown): { code: string; message: string } {
  if (error instanceof BackupError) return { code: error.code, message: error.message };
  if (error instanceof Error && error.name === 'QuotaExceededError') return {
    code: 'local-quota', message: 'Browser storage is full. Nothing was marked confirmed. Export your data, free unrelated storage, then retry without clearing LangLearn site data.',
  };
  if (error instanceof TypeError) return {
    code: 'network', message: 'The service could not be reached. Check the address, connection, and allowed origins. Queued bytes are kept for retry; offline study still works.',
  };
  return { code: 'local-storage', message: 'The backup could not be saved or read safely in browser storage. Nothing was marked confirmed. Keep the recovery kit and retry after resolving storage access.' };
}

export async function backupRequest(
  kit: RecoveryKit, path: string, method = 'GET', body?: unknown, confirmDecrease = false,
  fetcher: typeof fetch = fetch,
): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = { Authorization: `Bearer ${method === 'GET' ? kit.readToken : kit.writeToken}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (confirmDecrease) headers['X-Confirm-History-Decrease'] = 'true';
  const response = await fetcher(`${kit.endpoint}/v1/vaults/${kit.vaultId}${path}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer',
  });
  const raw = await response.text();
  if (raw.length > MAX_CHECKPOINT_BYTES + 16_384) throw new BackupError('server-response', 'The backup service response is too large.');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new BackupError('server-response', 'The backup service returned an unreadable response. Queued bytes were kept.'); }
  if (!response.ok) {
    const code = isRecord(value) && isRecord(value.error) && typeof value.error.code === 'string' ? value.error.code : 'service';
    const normalized = response.status === 401 ? 'unauthorized' : response.status === 403 ? 'forbidden' :
      response.status === 507 ? 'capacity' : code;
    throw new BackupError(normalized, errorMessages[normalized] ?? 'The backup service refused this request. Queued bytes and previous copies were kept. Check the service and retry.');
  }
  if (!isRecord(value)) throw new BackupError('server-response', 'The backup service response is malformed.');
  return value;
}

export async function readVaultStatus(kit: RecoveryKit, fetcher: typeof fetch = fetch) {
  const value = await backupRequest(kit, '/status', 'GET', undefined, false, fetcher);
  if (!(value.headId === null || isBackupUUID(value.headId)) || !isSafeCount(value.sequence) ||
    !isSafeCount(value.storedBytes) || !isSafeCount(value.checkpointCount) ||
    !isSafeCount(value.maxBytes) || value.retentionDays !== 30) {
    throw new BackupError('server-response', 'The backup service returned an invalid vault status.');
  }
  return value as unknown as { headId: string | null; sequence: number; storedBytes: number; checkpointCount: number; maxBytes: number; retentionDays: 30 };
}

export async function listRemoteCheckpoints(kit: RecoveryKit, cursor?: string, fetcher: typeof fetch = fetch) {
  if (cursor !== undefined && !/^\d{1,20}$/.test(cursor)) throw new BackupError('cursor', 'The recovery version cursor is invalid.');
  const value = await backupRequest(kit, `/checkpoints?limit=20${cursor === undefined ? '' : `&cursor=${cursor}`}`, 'GET', undefined, false, fetcher);
  if (!Array.isArray(value.checkpoints) || value.checkpoints.length > 20 ||
    !(value.nextCursor === null || (typeof value.nextCursor === 'string' && /^\d{1,20}$/.test(value.nextCursor))) ||
    !(value.headId === null || isBackupUUID(value.headId))) throw new BackupError('server-response', 'The backup version list is malformed.');
  return { checkpoints: value.checkpoints.map(parseCheckpointSummary), nextCursor: value.nextCursor as string | null, headId: value.headId };
}

export async function decodeBackupCheckpoint(envelope: unknown, kit: RecoveryKit) {
  const decrypted = await decryptCheckpoint(envelope, kit.encryptionKey);
  const payload = validateIndependentPayload(decrypted.plaintext);
  if (decrypted.envelope.schemaVersion !== payload.schemaVersion ||
    decrypted.envelope.progressRows !== independentProgressRows(payload)) {
    throw new BackupError('metadata', 'The encrypted header does not match the saved learning data. Nothing was restored.');
  }
  return { envelope: decrypted.envelope, payload };
}

export async function downloadRemoteCheckpoint(kit: RecoveryKit, id: string, fetcher: typeof fetch = fetch) {
  if (!isBackupUUID(id)) throw new BackupError('checkpoint-id', 'The checkpoint identifier is invalid.');
  const value = await backupRequest(kit, `/checkpoints/${id}`, 'GET', undefined, false, fetcher);
  const receipt = parseCheckpointSummary(value.receipt);
  const decoded = await decodeBackupCheckpoint(value.checkpoint, kit);
  if (receipt.id !== id || decoded.envelope.id !== id ||
    (['parentId', 'createdAt', 'schemaVersion', 'progressRows', 'sha256'] as const).some((key) => receipt[key] !== decoded.envelope[key])) {
    throw new BackupError('readback', 'The returned checkpoint does not match its receipt. It was not marked confirmed.');
  }
  return { ...decoded, receipt };
}

export function encryptedCheckpointFile(kit: RecoveryKit, checkpoint: CheckpointEnvelope): string {
  return JSON.stringify({ version: 1, vaultId: kit.vaultId, checkpoint });
}

export async function readEncryptedCheckpointFile(raw: string, kit: RecoveryKit) {
  if (raw.length > MAX_CHECKPOINT_BYTES + 1024) throw new BackupError('file-size', 'This encrypted file is too large.');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new BackupError('file', 'Choose a LangLearn encrypted checkpoint JSON file.'); }
  if (!isRecord(value) || value.version !== 1 || value.vaultId !== kit.vaultId ||
    Object.keys(value).sort().join() !== ['version', 'vaultId', 'checkpoint'].sort().join()) {
    throw new BackupError('file', 'This encrypted file is unsupported or belongs to a different recovery kit.');
  }
  return decodeBackupCheckpoint(value.checkpoint, kit);
}

export class IndependentBackupClient {
  private running: Promise<void> | null = null;
  private active = true;
  private busy = false;
  private listeners = new Set<() => void>();
  private problem: ReturnType<typeof backupProblem> | undefined;
  readonly store: IndependentBackupStore;
  private readonly storage: () => Storage;
  private readonly revision: () => number;
  private readonly fetcher: typeof fetch;

  constructor(
    store: IndependentBackupStore = independentBackupStore,
    storage: () => Storage = () => localStorage,
    revision: () => number = () => 0,
    fetcher: typeof fetch = (...args) => fetch(...args),
  ) { this.store = store; this.storage = storage; this.revision = revision; this.fetcher = fetcher; }

  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  isUploading = () => this.busy;
  getProblem = () => this.problem;
  private publish() { for (const listener of this.listeners) listener(); }
  stop() { this.active = false; }
  start() { this.active = true; }

  async enroll(endpoint: string, enrollmentCode: string, consent: boolean): Promise<RecoveryKit> {
    if (!consent) throw new BackupError('consent', 'Agree to encrypted backup storage before creating a vault.');
    if (!enrollmentCode.trim() || enrollmentCode.length > 4096 || /[\r\n]/.test(enrollmentCode)) {
      throw new BackupError('enrollment', 'Enter the enrollment code supplied by your backup service operator.');
    }
    let state = await this.store.read();
    if (state.enrolled) throw new BackupError('configured', 'A vault is already connected. Keep its kit before disconnecting.');
    const kit = state.kit ? parseRecoveryKit(state.kit) : createRecoveryKit(endpoint);
    if (kit.endpoint !== new URL(endpoint).origin) throw new BackupError('endpoint', 'An enrollment is already pending for another endpoint. Keep its kit before disconnecting.');
    // Lost enrollment responses cannot strand newly generated credentials.
    state = await this.store.change((s) => { s.kit = kit; s.consent = true; });
    const response = await this.fetcher(`${kit.endpoint}/v1/vaults`, {
      method: 'POST', credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer',
      headers: { Authorization: `Bearer ${enrollmentCode}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ vaultId: kit.vaultId, readTokenHash: await sha256(kit.readToken), writeTokenHash: await sha256(kit.writeToken) }),
    });
    if (response.status !== 201 && response.status !== 409) {
      throw new BackupError('enrollment', 'Vault creation was not confirmed. Check the service address, enrollment code, allowed origin, and connection, then retry with the same saved kit.');
    }
    const status = await readVaultStatus(kit, this.fetcher);
    await this.store.change((s) => {
      s.enrolled = true;
      // READ authentication reconciles enrollment, not divergent learning data.
      // An unexpectedly nonempty vault must not become an automatic CAS parent.
      s.error = status.headId === s.headId ? undefined : { code: 'head-conflict', message: errorMessages['head-conflict'] };
    });
    this.publish();
    return state.kit!;
  }

  async enable(consent: boolean, kitSaved: boolean): Promise<void> {
    if (!consent || !kitSaved) throw new BackupError('consent', 'Save the recovery kit away from this site and confirm encrypted storage first.');
    await this.store.change((s) => {
      if (!s.enrolled || !s.kit) throw new BackupError('unconfigured', 'Create or reconnect a vault first.');
      if (s.error && ['head-conflict', 'idempotency-conflict', 'history-decreased', 'suspected-wipe'].includes(s.error.code)) {
        throw new BackupError(s.error.code, errorMessages[s.error.code]);
      }
      s.consent = true; s.kitConfirmed = true; s.enabled = true; s.dirty = true; s.generation++; s.error = undefined;
    });
    this.problem = undefined;
    this.publish();
  }

  async markDirty(): Promise<void> {
    try {
      await this.store.change((s) => {
        if (!s.kit || !s.enabled) return;
        s.generation++; s.dirty = true;
      });
      this.publish();
    } catch (error) { this.problem = backupProblem(error); this.publish(); }
  }

  async disconnect(): Promise<void> {
    await this.store.change((s) => { s.enabled = false; s.consent = false; });
    this.publish();
  }

  async forgetConnection(): Promise<void> {
    const state = await this.store.read();
    if (this.busy || state.pending) throw new BackupError('pending', 'Export the queued encrypted checkpoint first. Disconnect pauses uploads without discarding it.');
    await this.store.state.delete('client');
    this.publish();
  }

  async preparePending(): Promise<BackupClientState> {
    let state = await this.store.read();
    if (!state.kit || !state.enabled || !state.consent || !state.kitConfirmed || !state.enrolled) return state;
    if (state.pending) return state;
    const generation = state.generation;
    const payload = await captureIndependentPayload(this.storage(), this.revision);
    const fingerprint = await sha256(payloadContent(payload));
    if (fingerprint === state.lastAck?.fingerprint) {
      return this.store.change((s) => { if (s.generation === generation) s.dirty = false; });
    }
    const envelope = await encryptCheckpoint(JSON.stringify(payload), state.kit.encryptionKey, state.headId,
      payload.schemaVersion, independentProgressRows(payload));
    state = await this.store.change((s) => {
      if (!s.enabled || !s.consent || !s.kitConfirmed || s.kit?.vaultId !== state.kit?.vaultId) return;
      if (!s.pending) s.pending = { envelope, generation, fingerprint };
    });
    // This committed read is deliberately before *any* upload.
    const persisted = await this.store.read();
    if (state.pending && JSON.stringify(state.pending) !== JSON.stringify(persisted.pending)) {
      throw new BackupError('local-durability', 'The exact encrypted checkpoint could not be read back locally. No upload was sent.');
    }
    return persisted;
  }

  /** Periodic calls also capture changes missed by observers, without uploading unchanged snapshots. */
  flush(confirmDecrease = false): Promise<void> {
    if (this.running) return this.running;
    const run = () => this.performFlush(confirmDecrease);
    this.running = (typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks.request('langlearn-independent-backup', run) : run()).finally(() => { this.running = null; });
    return this.running;
  }

  private async performFlush(confirmDecrease: boolean): Promise<void> {
    try {
      let state = await this.store.read();
      if (!this.active || !state.enabled || !state.kit || !state.consent || !state.kitConfirmed || !state.enrolled) return;
      if (state.error && ['head-conflict', 'idempotency-conflict', 'history-decreased', 'suspected-wipe', 'capacity', 'unauthorized', 'forbidden'].includes(state.error.code) && !confirmDecrease) return;
      if (confirmDecrease && state.error?.code !== 'history-decreased') throw new BackupError('confirmation', 'Only a deliberate history decrease can be confirmed here.');
      state = await this.preparePending();
      if (!this.active || !state.pending || !state.kit || !state.enabled || !state.consent || !state.kitConfirmed) return;
      const { envelope, fingerprint, generation } = state.pending;
      const kit = parseRecoveryKit(state.kit);
      const localReadback = await decodeBackupCheckpoint(envelope, kit);
      if (await sha256(payloadContent(localReadback.payload)) !== fingerprint) {
        throw new BackupError('local-durability', 'The locally queued checkpoint does not match its saved fingerprint. Keep its encrypted export; no upload was sent.');
      }
      this.busy = true; this.publish();
      const uploaded = await backupRequest(kit, '/checkpoints', 'POST', envelope, confirmDecrease, this.fetcher);
      const receipt = parseCheckpointSummary(uploaded.checkpoint);
      if (receipt.id !== envelope.id || receipt.sha256 !== envelope.sha256 || !isBackupUUID(uploaded.headId)) {
        throw new BackupError('readback', 'The upload receipt did not match the queued checkpoint. Its exact bytes were kept.');
      }
      const readback = await downloadRemoteCheckpoint(kit, envelope.id, this.fetcher);
      if (JSON.stringify(readback.envelope) !== JSON.stringify(envelope) ||
        await sha256(payloadContent(readback.payload)) !== fingerprint) {
        throw new BackupError('readback', 'Remote readback differed from the encrypted queued copy. It was not marked confirmed.');
      }
      await this.store.change((s) => {
        if (s.kit?.vaultId !== kit.vaultId || s.pending?.envelope.id !== envelope.id) {
          throw new BackupError('connection-changed', 'The connection changed during verification. The remote version was not adopted.');
        }
        s.lastAck = { id: envelope.id, confirmedAt: new Date().toISOString(), fingerprint };
        s.headId = envelope.id; s.pending = undefined;
        s.error = uploaded.headId === envelope.id ? undefined : { code: 'head-conflict', message: errorMessages['head-conflict'] };
        // A commit arriving while upload/readback ran is a separate pending capture.
        s.dirty = s.generation !== generation;
      });
      this.problem = uploaded.headId === envelope.id ? undefined : { code: 'head-conflict', message: errorMessages['head-conflict'] };
    } catch (error) {
      this.problem = backupProblem(error);
      try { await this.store.change((s) => { s.error = this.problem; }); } catch { /* In-memory error must remain visible if local storage is unavailable. */ }
    } finally { this.busy = false; this.publish(); }
  }

  async retry(): Promise<void> {
    await this.store.change((s) => {
      if (s.error && ['head-conflict', 'idempotency-conflict', 'history-decreased', 'suspected-wipe'].includes(s.error.code)) {
        throw new BackupError(s.error.code, errorMessages[s.error.code]);
      }
      s.error = undefined;
    });
    this.problem = undefined;
    return this.flush();
  }
}

function assertRetryUnchanged(
  current: IndependentBackupPayload, safety: IndependentBackupPayload, incoming: IndependentBackupPayload,
  phase: 'prepared' | 'database-written' | 'verified', safetyStorageKeys: string[], currentStorageKeys: string[],
): void {
  // Main IDB installation is all-or-nothing. A mixture/subset is not an interrupted
  // installation; it is an external edit or deletion, which recovery must preserve.
  const tables = independentTablesContent(current);
  if (tables !== independentTablesContent(incoming) &&
    (phase !== 'prepared' || tables !== independentTablesContent(safety))) {
    throw new BackupError('restore-conflict', 'Local data was changed or deleted during recovery. It was preserved. Export the safety copy and recover in a fresh profile instead of replacing it.');
  }
  if (safetyStorageKeys.some((key) => Object.hasOwn(incoming.localStorage, key) && !currentStorageKeys.includes(key))) {
    throw new BackupError('restore-conflict', 'Saved browser progress was deleted during recovery. It was not recreated over that change. Preserve this profile and recover in a fresh profile.');
  }
  for (const [key, raw] of Object.entries(current.localStorage)) {
    if (raw !== safety.localStorage[key] && raw !== incoming.localStorage[key]) {
      throw new BackupError('restore-conflict', 'Browser progress changed during recovery. It was not replaced. Close other tabs and preserve this profile before retrying.');
    }
  }
}

function assertRestoreSidecarAvailable(state: BackupClientState | null, kit: RecoveryKit): void {
  if (state && state.pending !== undefined) {
    throw new BackupError('restore-pending', 'This browser has a queued encrypted checkpoint. Recovery was not started. Preserve its current private kit and export the exact queued file, or recover in a fresh profile; the queue was not discarded.');
  }
  if (state && state.kit !== undefined && stableBackupJSON(state.kit) !== stableBackupJSON(kit)) {
    throw new BackupError('restore-connection', 'This browser holds a different recovery kit. Recovery was not started. Preserve the current private kit and use a fresh profile for the imported kit; connections are never switched automatically.');
  }
}

function assertRestoreSidecarUnchanged(current: BackupClientState | null, expected: BackupClientState | null): void {
  const identity = (state: BackupClientState | null) => ({ kit: state?.kit ?? null, pending: state?.pending ?? null });
  if (stableBackupJSON(identity(current)) !== stableBackupJSON(identity(expected))) {
    throw new BackupError('restore-sidecar-conflict', 'Backup credentials or queued state changed during recovery and were preserved. Keep this profile, save its current private kit and queued file, and use a fresh profile for the imported kit. An already-started recovery remains paused.');
  }
}

function assertRestoreJournalUnchanged(current: RestoreJournal | undefined, expected: RestoreJournal | undefined): void {
  if (stableBackupJSON(current ?? null) !== stableBackupJSON(expected ?? null)) {
    throw new BackupError('restore-journal-conflict', 'The recovery journal changed in another operation. It was preserved, and this recovery was not marked successful. Keep the original kit and encrypted file; do not clear site data.');
  }
}

function assertRestoreStorageUnchanged(
  storage: Storage, journal: RestoreJournal, incoming: IndependentBackupPayload,
  mode: 'original' | 'allowed' | 'installed',
): void {
  const raw = readIndependentStorage(storage, false);
  const original = Object.fromEntries(journal.safetyStorageKeys.map((key) => [key, journal.safetyCopy.localStorage[key]]));
  if (journal.storageConflict || (mode !== 'allowed' ?
    stableBackupJSON(raw) !== stableBackupJSON(mode === 'original' ? original : incoming.localStorage) :
    journal.safetyStorageKeys.some((key) => Object.hasOwn(incoming.localStorage, key) && !Object.hasOwn(raw, key)) ||
    Object.entries(raw).some(([key, value]) => value !== incoming.localStorage[key] &&
      (!journal.safetyStorageKeys.includes(key) || value !== journal.safetyCopy.localStorage[key])))) {
    throw new BackupError('restore-conflict', 'Current browser progress changed during recovery and was preserved. Study remains paused. Export current encrypted progress from this screen, keep the original kit and recovery file, and use a fresh profile instead of overwriting this change.');
  }
}

function observeRestoreStorageWrites() {
  let changed = false;
  const mark = () => { changed = true; };
  const storageChanged = (event: Event) => {
    const key = (event as StorageEvent).key;
    if (key === null || (typeof key === 'string' && isIndependentStorageKey(key))) mark();
  };
  const unsubscribe = [useSettingsStore.subscribe(mark), useXPStore.subscribe(mark),
    useBadgeStore.subscribe(mark), useStudySetsStore.subscribe(mark)];
  if (typeof window !== 'undefined') {
    window.addEventListener(BACKUP_SOURCE_EVENT, mark);
    window.addEventListener('storage', storageChanged);
  }
  return {
    check() {
      if (changed) throw new BackupError('restore-conflict', 'A participating writer saved browser progress during recovery. It was preserved. Export current encrypted progress and recover in a fresh profile; this recovery remains paused.');
    },
    stop() {
      unsubscribe.forEach((stop) => stop());
      if (typeof window !== 'undefined') {
        window.removeEventListener(BACKUP_SOURCE_EVENT, mark);
        window.removeEventListener('storage', storageChanged);
      }
    },
  };
}

/** Explicit paused-gate export: preserve the actual current state, not the pre-restore safety image. */
export async function exportCurrentEncryptedRecoveryFile(kit: RecoveryKit, storage: Storage = localStorage): Promise<string> {
  const validatedKit = parseRecoveryKit(kit);
  const payload = await captureIndependentPayload(storage, () => 0);
  const envelope = await encryptCheckpoint(JSON.stringify(payload), validatedKit.encryptionKey, null,
    payload.schemaVersion, independentProgressRows(payload));
  return encryptedCheckpointFile(validatedKit, envelope);
}

/** Fresh-only restore. IDB + localStorage are not one transaction: a durable journal gates normal app activation. */
export async function restoreIndependentCheckpoint(
  kitValue: RecoveryKit, envelope: CheckpointEnvelope,
  options: { store?: IndependentBackupStore; storage?: Storage; retry?: boolean } = {},
): Promise<void> {
  const kit = parseRecoveryKit(kitValue);
  const { payload } = await decodeBackupCheckpoint(envelope, kit);
  const store = options.store ?? independentBackupStore;
  const storage = options.storage ?? localStorage;
  const restoreWithFence = async (fence: ReturnType<typeof observeRestoreStorageWrites>) => {
    let guardedJournal: RestoreJournal | undefined;
    const checkStorage = (journal: RestoreJournal, mode: 'original' | 'allowed' | 'installed') => {
      fence.check();
      assertRestoreStorageUnchanged(storage, journal, payload, mode);
    };
    try {
    const oldJournal = await store.journal.get('restore');
    const sourceState = await store.state.get('client') ?? null;
    let journal: RestoreJournal;
    const retrying = oldJournal && oldJournal.phase !== 'verified';
    const beforeInstall = retrying ? 'allowed' : 'original';
    if (oldJournal && oldJournal.phase !== 'verified') {
      if (!options.retry || oldJournal.checkpointId !== envelope.id ||
        stableBackupJSON(oldJournal.envelope) !== stableBackupJSON(envelope) ||
        stableBackupJSON(oldJournal.kit) !== stableBackupJSON(kit)) {
        throw new BackupError('restore-in-progress', 'An interrupted restore must be retried with its original kit and encrypted checkpoint before normal study resumes.');
      }
      if (!Object.hasOwn(oldJournal, 'sourceState')) {
        throw new BackupError('restore-sidecar-conflict', 'This older interrupted restore cannot verify its original backup connection. Preserve the current private kit, queued file, and recovery file, and recover in a fresh profile.');
      }
      assertRestoreSidecarUnchanged(sourceState, oldJournal.sourceState);
    }
    // Domain emptiness never grants permission to replace independent credentials or queued bytes.
    assertRestoreSidecarAvailable(sourceState, kit);
    const current = validateIndependentPayload(await readIndependentPayload(storage));
    const currentStorageKeys = Object.keys(readIndependentStorage(storage, false));
    const safetyStorageKeys = oldJournal?.safetyStorageKeys ?? currentStorageKeys;
    if (oldJournal && oldJournal.phase !== 'verified') {
      journal = oldJournal;
      guardedJournal = journal;
      checkStorage(journal, beforeInstall);
      assertRetryUnchanged(current, oldJournal.safetyCopy, payload, oldJournal.phase, safetyStorageKeys, currentStorageKeys);
    } else {
      assertFreshRestoreTarget(current);
      journal = await store.transaction('rw', store.state, store.journal, store.safetyCopies, async () => {
        const lockedSource = await store.state.get('client') ?? null;
        assertRestoreSidecarUnchanged(lockedSource, sourceState);
        assertRestoreJournalUnchanged(await store.journal.get('restore'), oldJournal);
        assertRestoreSidecarAvailable(lockedSource, kit);
        const startedAt = new Date().toISOString();
        const prepared: RestoreJournal = { id: 'restore', phase: 'prepared', checkpointId: envelope.id, kit, envelope,
          safetyCopy: current, safetyStorageKeys: currentStorageKeys, sourceState: lockedSource, startedAt };
        checkStorage(prepared, 'original');
        await store.safetyCopies.add({ createdAt: startedAt, checkpointId: envelope.id, payload: current });
        checkStorage(prepared, 'original');
        await store.journal.put(prepared);
        return prepared;
      });
      guardedJournal = journal;
      const readback = await store.journal.get('restore');
      assertRestoreJournalUnchanged(readback, journal);
      if (!readback || payloadContent(readback.safetyCopy) !== payloadContent(current)) {
        throw new BackupError('restore-journal', 'A mandatory local safety copy could not be verified. No restore was started.');
      }
    }
    checkStorage(journal, beforeInstall);
    // The journal is committed before the main database is changed.
    await db.transaction('rw', BACKUP_TABLE_NAMES.map((name) => db.table(name)), async () => {
      // Recheck after acquiring the IDB lock; another tab must not be overwritten.
      const locked = await readIndependentPayload(storage);
      checkStorage(journal, beforeInstall);
      assertRetryUnchanged(locked, oldJournal?.safetyCopy ?? current, payload,
        oldJournal?.phase ?? 'prepared', safetyStorageKeys, Object.keys(readIndependentStorage(storage, false)));
      for (const name of BACKUP_TABLE_NAMES) {
        await db.table(name).clear();
        if (payload.tables[name].length) await db.table(name).bulkPut(payload.tables[name]);
      }
    });
    journal = await store.transaction('rw', store.journal, async () => {
      assertRestoreJournalUnchanged(await store.journal.get('restore'), journal);
      const written: RestoreJournal = { ...journal, phase: 'database-written' };
      await store.journal.update('restore', { phase: 'database-written' });
      return written;
    });
    guardedJournal = journal;
    checkStorage(journal, beforeInstall);
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (key && isIndependentStorageKey(key)) keys.push(key);
    }
    // No awaits in this batch: same-tab participating writers cannot interleave.
    // Other tabs still require these boundary checks; IDB/LS are not one transaction.
    for (const key of keys) if (!Object.hasOwn(payload.localStorage, key)) {
      checkStorage(journal, 'allowed');
      storage.removeItem(key);
    }
    for (const [key, raw] of Object.entries(payload.localStorage)) {
      checkStorage(journal, 'allowed');
      storage.setItem(key, raw);
    }
    checkStorage(journal, 'installed');
    const readback = validateIndependentPayload(await readIndependentPayload(storage));
    checkStorage(journal, 'installed');
    if (payloadContent(readback) !== payloadContent(payload)) {
      throw new BackupError('restore-readback', 'Restored data could not be verified. Normal study is paused; retry with the original kit and checkpoint.');
    }
    await store.transaction('rw', store.state, store.journal, async () => {
      assertRestoreJournalUnchanged(await store.journal.get('restore'), journal);
      checkStorage(journal, 'installed');
      const state = await store.state.get('client') ?? null;
      checkStorage(journal, 'installed');
      assertRestoreSidecarUnchanged(state, journal.sourceState);
      assertRestoreSidecarAvailable(state, kit);
      const s = state ?? await store.read();
      checkStorage(journal, 'installed');
      s.kit = kit; s.enrolled = true; s.enabled = false; s.kitConfirmed = false; s.consent = false;
      s.headId = envelope.id; s.pending = undefined; s.lastAck = undefined; s.error = undefined; s.dirty = true;
      await store.state.put(s);
      checkStorage(journal, 'installed');
      await store.journal.put({ ...journal, phase: 'verified' });
      checkStorage(journal, 'installed');
    });
    try { checkStorage(journal, 'installed'); }
    catch (error) {
      await store.transaction('rw', store.journal, async () => {
        const verified = { ...journal, phase: 'verified' as const };
        assertRestoreJournalUnchanged(await store.journal.get('restore'), verified);
        await store.journal.put(journal);
      });
      throw error;
    }
    } catch (error) {
      if (guardedJournal && error instanceof BackupError && error.code === 'restore-conflict') {
        const expected = guardedJournal;
        await store.transaction('rw', store.journal, async () => {
          const current = await store.journal.get('restore');
          assertRestoreJournalUnchanged(current, expected);
          await store.journal.update('restore', { storageConflict: true });
        });
      }
      throw error;
    }
  };
  const perform = async () => {
    const fence = observeRestoreStorageWrites();
    try { await restoreWithFence(fence); }
    finally { fence.stop(); }
  };
  if (typeof navigator !== 'undefined' && navigator.locks) {
    await navigator.locks.request('langlearn-independent-backup', perform);
  } else await perform();
}

export type BackupPreview = { envelope: CheckpointEnvelope; payload: IndependentBackupPayload; receipt?: CheckpointSummary };
