export const BACKUP_SOURCE_EVENT = 'langlearn-backup-source-change';

/** Storage events only reach other tabs; these successful same-tab commits need an explicit signal. */
export function notifyBackupSourceChanged(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(BACKUP_SOURCE_EVENT));
}
