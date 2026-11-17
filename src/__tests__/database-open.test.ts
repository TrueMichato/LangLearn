import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  open: vi.fn(),
  close: vi.fn(),
  exists: vi.fn(async () => false),
  read: vi.fn(),
  snapshots: vi.fn(async () => []),
  listeners: new Map<string, Set<() => void>>(),
}));

vi.mock('dexie', () => ({ default: { exists: mocks.exists } }));
vi.mock('../db/schema', () => ({
  CURRENT_SCHEMA_VERSION: 12, DB_NAME: 'LangLearnDB',
  db: {
    open: mocks.open,
    isOpen: () => true,
    close: mocks.close,
    on(name: string, callback?: () => void) {
      if (!mocks.listeners.has(name)) mocks.listeners.set(name, new Set());
      const callbacks = mocks.listeners.get(name)!;
      if (callback) callbacks.add(callback);
      return { unsubscribe: (listener: () => void) => callbacks.delete(listener) };
    },
    snapshots: { orderBy: () => ({ reverse: () => ({ toArray: mocks.snapshots }) }) },
  },
}));
vi.mock('../db/backup', () => ({
  buildBackupPayload: mocks.read,
  importRecoveryData: vi.fn(), importAllData: vi.fn(),
  BACKUP_STORAGE_KEYS: [], BACKUP_PAYLOAD_VERSION: 2,
}));
vi.mock('../db/recovery-capsule', () => ({
  readRecoveryCapsule: () => null,
  refreshRecoveryCapsule: vi.fn(),
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.listeners.clear();
  mocks.read.mockResolvedValue({ tables: {} });
});

describe('database opening safety failures', () => {
  it('reports the actual blocked event even while db.open remains pending', async () => {
    let finishOpen!: () => void;
    mocks.open.mockImplementation(() => new Promise<void>((resolve) => { finishOpen = resolve; }));
    const { openDatabase } = await import('../db/recovery');
    const result = openDatabase();
    expect(openDatabase()).toBe(result);
    await vi.waitFor(() => expect(mocks.open).toHaveBeenCalledOnce());
    for (const listener of mocks.listeners.get('blocked')!) listener();
    await expect(result).resolves.toEqual({ kind: 'blocked' });
    expect(mocks.listeners.get('blocked')?.size).toBe(0);
    finishOpen();
    await vi.waitFor(() => expect(mocks.read).toHaveBeenCalledOnce());
  });

  it('classifies a failed safety read instead of admitting database writers', async () => {
    mocks.open.mockResolvedValue(undefined);
    mocks.read.mockRejectedValue(new Error('Cannot read saved history'));
    const { openDatabase } = await import('../db/recovery');
    await expect(openDatabase()).resolves.toMatchObject({
      kind: 'failed', error: { message: 'Cannot read saved history' },
    });
  });

  it('notifies boot when versionchange closes a live connection without inferring a newer stored version', async () => {
    mocks.open.mockResolvedValue(undefined);
    const { openDatabase, subscribeDatabaseInvalidation } = await import('../db/recovery');
    const changes = vi.fn();
    const unsubscribe = subscribeDatabaseInvalidation(changes);
    await expect(openDatabase()).resolves.toEqual({ kind: 'ready' });
    expect(mocks.listeners.get('versionchange')?.size).toBe(1);

    for (const listener of mocks.listeners.get('versionchange')!) listener();
    expect(mocks.close).toHaveBeenCalledOnce();
    expect(changes).toHaveBeenCalledExactlyOnceWith({ kind: 'reload-required' });
    await expect(openDatabase()).resolves.toEqual({ kind: 'reload-required' });
    expect(mocks.open).toHaveBeenCalledOnce();
    unsubscribe();

    const lateChanges = vi.fn();
    const unsubscribeLate = subscribeDatabaseInvalidation(lateChanges);
    expect(lateChanges).toHaveBeenCalledExactlyOnceWith({ kind: 'reload-required' });
    unsubscribeLate();
    for (const listener of mocks.listeners.get('versionchange')!) listener();
    expect(changes).toHaveBeenCalledOnce();
    expect(lateChanges).toHaveBeenCalledOnce();
    expect(mocks.listeners.get('versionchange')?.size).toBe(1);
  });
});
