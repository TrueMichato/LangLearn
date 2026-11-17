import Dexie, { type ObservabilitySet } from 'dexie';
import { BACKUP_TABLE_NAMES } from '../db/backup';
import { db } from '../db/schema';
import { isIndependentStorageKey } from '../db/independent-backup-payload';
import { useSettingsStore } from '../stores/settingsStore';
import { useXPStore } from '../stores/xpStore';
import { useBadgeStore } from '../stores/badgeStore';
import { useStudySetsStore } from '../stores/studySetsStore';
import { IndependentBackupClient } from './independent-backup';
import { BACKUP_SOURCE_EVENT } from './backup-source';

let sourceRevision = 0;
export const backupClient = new IndependentBackupClient(undefined, undefined, () => sourceRevision);

/** Best effort capture, not a transactional outbox: closing the process before capture can lose the latest changes. */
export function startIndependentBackupRuntime(options: {
  client?: IndependentBackupClient;
  windowTarget?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
  documentTarget?: Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>;
  delayMs?: number;
  intervalMs?: number;
} = {}) {
  const client = options.client ?? backupClient;
  const win = options.windowTarget ?? (typeof window === 'undefined' ? undefined : window);
  const doc = options.documentTarget ?? (typeof document === 'undefined' ? undefined : document);
  const prefixes = BACKUP_TABLE_NAMES.map((name) => `idb://${db.name}/${name}/`);
  let active = true;
  let scheduled: ReturnType<typeof setTimeout> | undefined;
  let failures = 0;
  client.start();

  const flush = async () => {
    if (!active) return;
    await client.flush();
    failures = client.getProblem() ? Math.min(failures + 1, 7) : 0;
    schedule(failures ? Math.min(300_000, 2000 * 2 ** failures) * (0.75 + Math.random() / 2) : options.intervalMs ?? 60_000);
  };
  const schedule = (delay = options.delayMs ?? 60_000) => {
    if (!active || scheduled) return;
    scheduled = setTimeout(() => { scheduled = undefined; void flush(); }, delay);
  };
  const changed = () => {
    sourceRevision++;
    // Zustand listeners fire before its persist middleware writes; the microtask
    // ensures capture observes the durable value, not just the in-memory award.
    queueMicrotask(() => { if (active) void client.markDirty().then(() => schedule()); });
  };
  const databaseChanged = (parts: ObservabilitySet) => {
    if (Object.keys(parts).some((part) => prefixes.some((prefix) => part.startsWith(prefix)))) changed();
  };
  const storageChanged = (event: Event) => {
    const key = (event as StorageEvent).key;
    if (key === null || (typeof key === 'string' && isIndependentStorageKey(key))) changed();
  };
  const resume = () => {
    if (scheduled) clearTimeout(scheduled);
    scheduled = undefined;
    schedule(250 + Math.random() * 750);
  };
  const visibility = () => { if (doc?.visibilityState === 'hidden') void flush(); else resume(); };
  const unsubscribe = [useSettingsStore.subscribe(changed), useXPStore.subscribe(changed),
    useBadgeStore.subscribe(changed), useStudySetsStore.subscribe(changed)];
  Dexie.on('storagemutated', databaseChanged);
  win?.addEventListener(BACKUP_SOURCE_EVENT, changed);
  win?.addEventListener('storage', storageChanged);
  win?.addEventListener('online', resume);
  win?.addEventListener('pageshow', resume);
  doc?.addEventListener('visibilitychange', visibility);
  // Reload may have happened after source commit but before the dirty flag.
  schedule(500);
  return {
    flush,
    stop() {
      active = false; client.stop();
      if (scheduled) clearTimeout(scheduled);
      unsubscribe.forEach((stop) => stop());
      Dexie.on('storagemutated').unsubscribe(databaseChanged);
      win?.removeEventListener(BACKUP_SOURCE_EVENT, changed);
      win?.removeEventListener('storage', storageChanged);
      win?.removeEventListener('online', resume);
      win?.removeEventListener('pageshow', resume);
      doc?.removeEventListener('visibilitychange', visibility);
    },
  };
}
