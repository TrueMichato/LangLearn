import { independentBackupStore, type IndependentBackupStore } from '../db/independent-backup-store';
import { payloadContent, readIndependentPayload, stableBackupJSON, upgradeIndependentPayload, validateIndependentPayload } from '../db/independent-backup-payload';
import { useSettingsStore } from '../stores/settingsStore';
import { useXPStore } from '../stores/xpStore';
import { useBadgeStore } from '../stores/badgeStore';
import { useStudySetsStore } from '../stores/studySetsStore';
import { BackupError } from './backup-crypto';
import { decodeBackupCheckpoint } from './independent-backup';

/** Do not release the app gate with stale in-memory XP/sets, even if a reload is blocked. */
export async function finishIndependentRestore(
  store: IndependentBackupStore = independentBackupStore, storage: Storage = localStorage,
): Promise<void> {
  const journal = await store.journal.get('restore');
  if (!journal || journal.phase !== 'verified') {
    throw new BackupError('restore-incomplete', 'Recovery has not passed verification. Retry the original checkpoint before continuing study.');
  }
  const decoded = await decodeBackupCheckpoint(journal.envelope, journal.kit);
  const payload = upgradeIndependentPayload(decoded.payload);
  const current = validateIndependentPayload(await readIndependentPayload(storage));
  if (payloadContent(current) !== payloadContent(payload)) {
    throw new BackupError('restore-changed', 'Saved data changed after recovery verification. Keep this profile and its safety copy; normal study remains paused rather than hiding a conflict.');
  }
  const stores = {
    'langlearn-settings': useSettingsStore, 'langlearn-xp': useXPStore,
    'langlearn-badges': useBadgeStore, 'langlearn-study-sets': useStudySetsStore,
  };
  await Promise.all(Object.values(stores).map((state) => state.persist.rehydrate()));
  for (const [key, state] of Object.entries(stores)) {
    const expected = JSON.parse(payload.localStorage[key]).state as Record<string, unknown>;
    const hydrated = state.getState() as unknown as Record<string, unknown>;
    if (Object.entries(expected).some(([field, value]) => stableBackupJSON(value) !== stableBackupJSON(hydrated[field]))) {
      throw new BackupError('restore-hydration', 'Restored progress could not be loaded into the app. The safety gate remains in place. Resolve browser storage access and retry.');
    }
  }
  // The independent safetyCopies table survives completion of this journal.
  await store.journal.delete('restore');
}
