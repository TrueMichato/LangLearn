import { useCallback, useEffect, useMemo, useState } from 'react';
import { openDatabase, flushPendingSnapshot, takeSnapshot, type DbStatus } from '../db/recovery';
import { refreshRecoveryCapsule } from '../db/recovery-capsule';
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
        await refreshRecoveryCapsule();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const dismissRecovery = useCallback(() => setStatus({ kind: 'ready' }), []);

  return useMemo(
    () => ({ status, persistence, dismissRecovery }),
    [status, persistence, dismissRecovery],
  );
}
