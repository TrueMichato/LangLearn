import { useCallback, useEffect, useState } from 'react';
import { openDatabase, flushPendingSnapshot, takeSnapshot, type DbStatus } from '../db/recovery';
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
 * one also covers the other ways progress disappears — an eviction that clears
 * IndexedDB but leaves localStorage, or a bug that corrupts rows during normal
 * use.
 */
async function maybeTakeDailySnapshot(): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(LAST_SNAPSHOT_KEY) === today) return;
    localStorage.setItem(LAST_SNAPSHOT_KEY, today);
    await takeSnapshot('daily automatic backup');
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
 */
export function useDatabaseBoot(): {
  status: DbStatus;
  persistence: PersistenceState;
  /** Accept the current (empty) state and carry on — see `data-loss-suspected`. */
  dismissRecovery: () => void;
} {
  const [status, setStatus] = useState<DbStatus>({ kind: 'opening' });
  const [persistence, setPersistence] = useState<PersistenceState>('unknown');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Ask first: a grant only takes effect for data written afterwards on
      // some engines, and it costs nothing when already granted.
      const persistenceState = await ensurePersistentStorage(browserPersistenceEnvironment());
      if (!cancelled) setPersistence(persistenceState);

      const result = await openDatabase();
      if (cancelled) return;
      setStatus(result);

      // A suspected-data-loss database is fully usable, so the routine
      // housekeeping should still run once the learner has decided what to do.
      if (result.kind === 'ready') {
        await flushPendingSnapshot();
        await maybeTakeDailySnapshot();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const dismissRecovery = useCallback(() => setStatus({ kind: 'ready' }), []);

  return { status, persistence, dismissRecovery };
}
