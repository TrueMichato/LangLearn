import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => {
  let state: unknown[] = [];
  let cursor = 0;
  return {
    effects: [] as Array<() => (() => void) | void>,
    reset() { state = []; cursor = 0; hooks.effects = []; },
    render<T>(component: () => T) { cursor = 0; return component(); },
    state<T>(initial: T) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], (next: T) => { state[index] = next; }];
    },
    ref<T>(initial: T) {
      const [reference] = hooks.state({ current: initial });
      return reference;
    },
  };
});
const mocks = vi.hoisted(() => ({
  open: vi.fn(), capsule: vi.fn(), snapshot: vi.fn(), persistence: vi.fn(),
  start: vi.fn(), stop: vi.fn(async () => {}),
  subscribe: vi.fn(),
  changes: new Set<(status: { kind: 'reload-required' }) => void>(),
}));
vi.mock('react', async (original) => ({
  ...await original<typeof import('react')>(),
  useState: hooks.state, useRef: hooks.ref,
  useMemo: <T,>(read: () => T) => read(),
  useCallback: <T,>(callback: T) => callback,
  useEffect: (effect: () => (() => void) | void) => { hooks.effects.push(effect); },
}));
vi.mock('../db/recovery', () => ({
  openDatabase: mocks.open, takeSnapshot: mocks.snapshot,
  subscribeDatabaseInvalidation: mocks.subscribe,
  classifyOpenError: (error: Error) => ({ kind: 'failed', error }),
}));
vi.mock('../db/recovery-capsule', () => ({
  refreshRecoveryCapsule: mocks.capsule,
  startRecoveryCapsuleLifecycle: mocks.start,
}));
vi.mock('../lib/storage-persistence', () => ({
  ensurePersistentStorage: mocks.persistence, browserPersistenceEnvironment: () => ({}),
}));
import { useDatabaseBoot } from '../hooks/useDatabaseBoot';

beforeEach(() => {
  hooks.reset();
  vi.clearAllMocks();
  mocks.persistence.mockResolvedValue('unsupported');
  mocks.open.mockResolvedValue({ kind: 'ready' });
  mocks.snapshot.mockResolvedValue(null);
  mocks.start.mockReturnValue({ stop: mocks.stop });
  mocks.changes.clear();
  mocks.subscribe.mockImplementation((listener: (status: { kind: 'reload-required' }) => void) => {
    mocks.changes.add(listener);
    return () => mocks.changes.delete(listener);
  });
  vi.stubGlobal('localStorage', { getItem: () => null, setItem() {} });
});
afterEach(() => vi.unstubAllGlobals());

describe('database boot safety lifecycle', () => {
  it('shares StrictMode opening work and admits writers only after safety checks finish', async () => {
    let finishCapture!: (result: { kind: string }) => void;
    mocks.capsule.mockImplementation(() => new Promise((resolve) => { finishCapture = resolve; }));
    expect(hooks.render(useDatabaseBoot).status.kind).toBe('opening');
    const effect = hooks.effects[0];
    effect()?.(); // StrictMode setup/cleanup/setup.
    const cleanup = effect();
    expect(mocks.subscribe).toHaveBeenCalledTimes(2);
    expect(mocks.changes.size).toBe(1);
    await vi.waitFor(() => expect(mocks.capsule).toHaveBeenCalledOnce());
    expect(mocks.persistence).toHaveBeenCalledOnce();
    expect(mocks.open).toHaveBeenCalledOnce();
    expect(hooks.render(useDatabaseBoot).status.kind).toBe('opening');
    expect(mocks.start).not.toHaveBeenCalled();
    finishCapture({ kind: 'empty' });
    await vi.waitFor(() => expect(hooks.render(useDatabaseBoot).status.kind).toBe('ready'));
    expect(mocks.start).toHaveBeenCalledOnce();
    expect(mocks.snapshot).toHaveBeenCalledOnce();
    cleanup?.();
    expect(mocks.stop).toHaveBeenCalledOnce();
    expect(mocks.changes.size).toBe(0);
  });

  it('does not report ready or run housekeeping after a critical capture read fails', async () => {
    mocks.capsule.mockResolvedValue({ kind: 'failed', phase: 'read', error: new Error('Read failed') });
    hooks.render(useDatabaseBoot);
    const cleanup = hooks.effects[0]();
    await vi.waitFor(() => expect(hooks.render(useDatabaseBoot).status.kind).toBe('failed'));
    expect(mocks.start).not.toHaveBeenCalled();
    expect(mocks.snapshot).not.toHaveBeenCalled();
    cleanup?.();
  });

  it('admits usable storage with an actionable warning when only the independent copy cannot be written', async () => {
    mocks.capsule.mockResolvedValue({ kind: 'failed', phase: 'write', error: new Error('Quota exceeded') });
    hooks.render(useDatabaseBoot);
    const cleanup = hooks.effects[0]();
    await vi.waitFor(() => expect(hooks.render(useDatabaseBoot).status).toMatchObject({
      kind: 'ready', recoveryWarning: expect.stringContaining('exported backup'),
    }));
    cleanup?.();
  });

  it('leaves ready and stops capture when a database version-change notification arrives', async () => {
    mocks.capsule.mockResolvedValue({ kind: 'empty' });
    hooks.render(useDatabaseBoot);
    const cleanup = hooks.effects[0]();
    await vi.waitFor(() => expect(hooks.render(useDatabaseBoot).status.kind).toBe('ready'));
    for (const listener of mocks.changes) listener({ kind: 'reload-required' });

    expect(hooks.render(useDatabaseBoot).status.kind).toBe('reload-required');
    expect(mocks.stop).toHaveBeenCalledOnce();
    cleanup?.();
    expect(mocks.changes.size).toBe(0);
    expect(mocks.stop).toHaveBeenCalledOnce();
  });

  it('does not let a pending boot capture return the app to ready after versionchange', async () => {
    let finishCapture!: (result: { kind: string }) => void;
    mocks.capsule.mockImplementation(() => new Promise((resolve) => { finishCapture = resolve; }));
    hooks.render(useDatabaseBoot);
    const cleanup = hooks.effects[0]();
    await vi.waitFor(() => expect(mocks.capsule).toHaveBeenCalledOnce());
    for (const listener of mocks.changes) listener({ kind: 'reload-required' });
    finishCapture({ kind: 'empty' });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const boot = hooks.render(useDatabaseBoot);
    expect(boot.status.kind).toBe('reload-required');
    boot.dismissRecovery();
    expect(hooks.render(useDatabaseBoot).status.kind).toBe('reload-required');
    expect(mocks.start).not.toHaveBeenCalled();
    expect(mocks.snapshot).not.toHaveBeenCalled();
    cleanup?.();
    expect(mocks.changes.size).toBe(0);
  });
});
