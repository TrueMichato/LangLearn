import { describe, it, expect, vi } from 'vitest';
import { applyUpdate, type UpdateEnvironment } from '../lib/sw-update';

type FakeWorker = { postMessage: ReturnType<typeof vi.fn> };

interface Scenario {
  waiting: FakeWorker | null;
  controllerChanges: boolean;
  online?: boolean;
  registration?: boolean;
  /** A worker that appears only once `update()` has been called. */
  waitingAfterUpdate?: FakeWorker | null;
}

function harness(scenario: Scenario) {
  const {
    waiting,
    controllerChanges,
    online = true,
    registration: hasRegistration = true,
    waitingAfterUpdate,
  } = scenario;

  const reload = vi.fn();
  const markApplied = vi.fn();
  const unregister = vi.fn().mockResolvedValue(true);

  const registration = {
    waiting,
    update: vi.fn().mockImplementation(async () => {
      if (waitingAfterUpdate !== undefined) registration.waiting = waitingAfterUpdate;
    }),
    unregister,
  };

  const env: UpdateEnvironment = {
    getRegistration: async () =>
      hasRegistration ? (registration as unknown as ServiceWorkerRegistration) : null,
    waitForControllerChange: async () => controllerChanges,
    isOnline: () => online,
    reload,
    markApplied,
  };

  return { env, registration, reload, markApplied, unregister };
}

describe('applyUpdate', () => {
  it('hands over to a waiting worker that honours SKIP_WAITING', async () => {
    const worker: FakeWorker = { postMessage: vi.fn() };
    const { env, reload, markApplied, unregister } = harness({
      waiting: worker,
      controllerChanges: true,
    });

    await expect(applyUpdate(env)).resolves.toBe('activated');

    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(markApplied).toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
    expect(unregister).not.toHaveBeenCalled();
  });

  it('re-checks for a build when the prompt outlived its worker', async () => {
    const fresh: FakeWorker = { postMessage: vi.fn() };
    const { env, registration } = harness({
      waiting: null,
      waitingAfterUpdate: fresh,
      controllerChanges: true,
    });

    await expect(applyUpdate(env)).resolves.toBe('activated');

    expect(registration.update).toHaveBeenCalled();
    expect(fresh.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  it('drops the registration when the waiting worker ignores SKIP_WAITING', async () => {
    // A worker built before the SKIP_WAITING handler existed never hands over,
    // and reloading does not release the client — so the banner would come
    // straight back. Unregistering guarantees the next load is the new build.
    const stale: FakeWorker = { postMessage: vi.fn() };
    const { env, reload, markApplied, unregister } = harness({
      waiting: stale,
      controllerChanges: false,
    });

    await expect(applyUpdate(env)).resolves.toBe('recovered');

    expect(unregister).toHaveBeenCalled();
    expect(markApplied).toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
  });

  it('keeps the offline cache rather than unregistering while offline', async () => {
    const stale: FakeWorker = { postMessage: vi.fn() };
    const { env, reload, unregister, markApplied } = harness({
      waiting: stale,
      controllerChanges: false,
      online: false,
    });

    await expect(applyUpdate(env)).resolves.toBe('reloaded');

    expect(unregister).not.toHaveBeenCalled();
    expect(markApplied).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
  });

  it('never claims an update it did not apply', async () => {
    const { env, reload, markApplied } = harness({
      waiting: null,
      waitingAfterUpdate: null,
      controllerChanges: false,
    });

    await expect(applyUpdate(env)).resolves.toBe('reloaded');

    expect(markApplied).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
  });

  it('still reloads when there is no registration at all', async () => {
    const { env, reload } = harness({
      waiting: null,
      controllerChanges: false,
      registration: false,
    });

    await expect(applyUpdate(env)).resolves.toBe('reloaded');
    expect(reload).toHaveBeenCalled();
  });

  it('survives an update() that rejects', async () => {
    const { env, registration, reload } = harness({
      waiting: null,
      controllerChanges: false,
    });
    registration.update.mockRejectedValue(new Error('offline'));

    await expect(applyUpdate(env)).resolves.toBe('reloaded');
    expect(reload).toHaveBeenCalled();
  });
});
