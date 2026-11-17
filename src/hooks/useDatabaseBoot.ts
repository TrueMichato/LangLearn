import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { classifyOpenError, openDatabase, subscribeDatabaseInvalidation, takeSnapshot, type DbStatus } from '../db/recovery';
import { refreshRecoveryCapsule, startRecoveryCapsuleLifecycle } from '../db/recovery-capsule';
import type { DatabaseBoot } from './database-boot-context';
import {
  ensurePersistentStorage,
  browserPersistenceEnvironment,
  type PersistenceState,
} from '../lib/storage-persistence';

const LAST_SNAPSHOT_KEY = 'langlearn-last-snapshot-date';

/**
 * Take a routine snapshot at most once a day.
 *
 * Pre-upgrade snapshots only help when an upgrade is what went wrong. A daily
 * one also covers bugs that corrupt rows during normal use. Database-only
 * eviction is handled by the independent localStorage recovery capsule.
 */
async function maybeTakeDailySnapshot(): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(LAST_SNAPSHOT_KEY) === today) return;
    const snapshot = await takeSnapshot('daily automatic backup');
    if (snapshot) localStorage.setItem(LAST_SNAPSHOT_KEY, today);
  } catch {
    /* best effort */
  }
}

/**
 * Prepare local storage before the app renders anything that reads from it.
 *
 * Two things have to happen, in this order: ask the browser to stop evicting
 * our data, and open the database in a way that can report failure instead of
 * throwing into a blank screen.
 *
 * Call this once, from `DatabaseBootProvider`. Everything else should read the
 * result through `useDatabaseBootContext`, so the storage permission is
 * requested once and boot status has a single source of truth.
 */
export function useDatabaseBoot(): DatabaseBoot {
  const [status, setStatus] = useState<DbStatus>({ kind: 'opening' });
  const [persistence, setPersistence] = useState<PersistenceState>('unknown');
  const attempt = useRef<Promise<{ status: DbStatus; persistence: PersistenceState }> | null>(null);
  const lifecycle = useRef<ReturnType<typeof startRecoveryCapsuleLifecycle> | null>(null);
  const invalidated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const stopCapture = () => {
      const current = lifecycle.current;
      lifecycle.current = null;
      if (current) void current.stop();
    };
    const unsubscribe = subscribeDatabaseInvalidation((change) => {
      invalidated.current = true;
      stopCapture();
      if (!cancelled) setStatus(change);
    });

    // The ref survives StrictMode's effect replay. Share the entire safety
    // boundary, not just db.open(), so snapshots and capsule writes run once.
    attempt.current ??= (async () => {
      // Ask first: a grant only takes effect for data written afterwards on
      // some engines, and it costs nothing when already granted.
      const persistenceState = await ensurePersistentStorage(browserPersistenceEnvironment());
      try {
        const result = await openDatabase();
        if (result.kind === 'ready' && !invalidated.current) {
          // openDatabase has already flushed the pre-upgrade snapshot and
          // checked history. No routes, timer or onboarding can run yet.
          const capsule = await refreshRecoveryCapsule(undefined, () => !invalidated.current);
          if (capsule.kind === 'failed' && capsule.phase === 'read') throw capsule.error;
          if (capsule.kind === 'failed' || capsule.kind === 'unavailable' || capsule.kind === 'too-large') {
            result.recoveryWarning =
              'Your separate recovery copy could not be refreshed. Keep an exported backup from Settings → Data and privacy.';
          }
          if (capsule.kind === 'kept') {
            result.recoveryWarning = capsule.reason === 'unreadable-copy'
              ? capsule.error.message
              : 'An earlier recovery copy was kept because saved history changed. Download or restore it in Settings → Data and privacy.';
          }
          if (!invalidated.current) await maybeTakeDailySnapshot();
        }
        return { status: result, persistence: persistenceState };
      } catch (error) {
        return { status: classifyOpenError(error), persistence: persistenceState };
      }
    })();
    void attempt.current.then((result) => {
      if (cancelled || invalidated.current) return;
      setPersistence(result.persistence);
      if (result.status.kind === 'ready') lifecycle.current ??= startRecoveryCapsuleLifecycle();
      setStatus(result.status);
    });

    return () => {
      cancelled = true;
      unsubscribe();
      stopCapture();
    };
  }, []);

  const dismissRecovery = useCallback(() => {
    if (invalidated.current) return;
    lifecycle.current ??= startRecoveryCapsuleLifecycle();
    setStatus({ kind: 'ready' });
  }, []);

  return useMemo(
    () => ({ status, persistence, dismissRecovery }),
    [status, persistence, dismissRecovery],
  );
}
