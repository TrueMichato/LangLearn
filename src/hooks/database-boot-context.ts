import { createContext, useContext } from 'react';
import type { DbStatus } from '../db/recovery';
import type { PersistenceState } from '../lib/storage-persistence';

export interface DatabaseBoot {
  status: DbStatus;
  persistence: PersistenceState;
  /** Accept the current (empty) state and carry on — see `data-loss-suspected`. */
  dismissRecovery: () => void;
}

/**
 * Boot has to happen exactly once per app load.
 *
 * It asks the browser for persistent storage and takes the daily snapshot, so
 * running it per consumer meant re-requesting a storage permission every time
 * Settings was opened, and tracking boot status in two places that could
 * disagree. Consumers read the single result from here instead.
 */
export const DatabaseBootContext = createContext<DatabaseBoot | null>(null);

export function useDatabaseBootContext(): DatabaseBoot {
  const boot = useContext(DatabaseBootContext);
  if (!boot) {
    throw new Error('useDatabaseBootContext must be used within a <DatabaseBootProvider>');
  }
  return boot;
}
