import { useEffect, useState, type ReactNode } from 'react';
import { liveQuery } from 'dexie';
import { independentBackupStore, type RestoreJournal } from '../../db/independent-backup-store';
import {
  backupProblem, restoreIndependentCheckpoint, exportCurrentEncryptedRecoveryFile, encryptedCheckpointFile,
} from '../../lib/independent-backup';
import { downloadJson, exportAllData } from '../../db/backup';
import { finishIndependentRestore } from '../../lib/finish-backup-restore';
import BackupRestorePanel from '../settings/BackupRestorePanel';
import { BackupError } from '../../lib/backup-crypto';

/** Mount before primary database boot, timers, snapshots, notifications, or lesson effects. */
export default function IndependentRestoreGate({ children }: { children: ReactNode }) {
  const [journal, setJournal] = useState<RestoreJournal | null>();
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const subscription = liveQuery(() => independentBackupStore.journal.get('restore')).subscribe({
      next: (value) => { setJournal(value ?? null); setFailure(''); },
      error: (error) => setFailure(backupProblem(error).message),
    });
    return () => subscription.unsubscribe();
  }, [attempt]);
  if (journal === null && !failure) return children;
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    if (journal) setFailure('');
    try { await action(); } catch (error) { setFailure(backupProblem(error).message); }
    finally { setBusy(false); }
  };
  return (
    <main className="app-frame min-h-screen space-y-5 bg-slate-50 px-5 py-10 text-slate-700 dark:bg-slate-900 dark:text-slate-200" aria-busy={journal === undefined && !failure}>
      <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
        {journal ? journal.phase === 'verified' ? 'Your recovery is verified' : 'Finish your interrupted recovery' : failure ? 'Backup safety storage needs attention' : 'Opening backup safety storage…'}
      </h1>
      {journal === undefined && !failure && <p role="status" aria-live="polite" className="text-sm text-slate-600 dark:text-slate-300">
        Checking for an interrupted recovery before opening your saved progress…
      </p>}
      {journal && <>
        <p className="text-sm">
          {journal.phase === 'verified' ? 'All restored tables and browser progress passed readback checks. Reload the stores before returning to study.' :
            'Normal study is paused so a partial database/browser-storage restore cannot change your progress. Keep your original kit and checkpoint; do not clear site data. Close other LangLearn tabs and retry.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy}
            className="min-h-[44px] rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
            onClick={() => void run(async () => {
              if (journal.phase !== 'verified') {
                await restoreIndependentCheckpoint(journal.kit, journal.envelope, { retry: true });
                return;
              }
              // Never render the normal app with pre-restore in-memory XP/sets.
              await finishIndependentRestore();
              window.location.reload();
            })}>{busy ? 'Checking recovery…' : journal.phase === 'verified' ? 'Reload restored progress' : 'Retry original recovery'}</button>
          <button type="button" disabled={busy}
            className="min-h-[44px] rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-800"
            onClick={() => downloadJson(JSON.stringify(journal.safetyCopy, null, 2), 'langlearn-before-independent-recovery.json')}>
            Export pre-recovery local safety copy
          </button>
          <button type="button" disabled={busy}
            className="min-h-[44px] rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-800"
            onClick={() => void run(async () => downloadJson(
              await exportCurrentEncryptedRecoveryFile(journal.kit), 'langlearn-current-conflicting-progress.encrypted.json',
            ))}>Export current encrypted progress</button>
        </div>
        <p className="text-sm">The current-progress export includes changes saved during recovery and uses the original recovery kit below. It is separate from the older pre-recovery safety copy; no XP is automatically combined.</p>
        <details className="border-t border-slate-200 pt-3 dark:border-white/10">
          <summary className="min-h-[44px] cursor-pointer py-2 text-sm font-medium">Save private recovery files for a fresh profile</summary>
          <div className="flex flex-col gap-2 pt-2">
            <button type="button" disabled={busy}
              className="min-h-[44px] rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-800"
              onClick={() => downloadJson(JSON.stringify(journal.kit, null, 2), 'langlearn-original-private-recovery-kit.json')}>Download original private recovery kit</button>
            <button type="button" disabled={busy}
              className="min-h-[44px] rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-800"
              onClick={() => downloadJson(encryptedCheckpointFile(journal.kit, journal.envelope), 'langlearn-original-recovery-point.encrypted.json')}>Download original encrypted recovery point</button>
            <button type="button" disabled={busy}
              className="min-h-[44px] rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-800"
              onClick={() => void run(async () => {
                const state = await independentBackupStore.read();
                if (!state.kit) throw new BackupError('unconfigured', 'No separate local backup connection is saved.');
                downloadJson(JSON.stringify(state.kit, null, 2), 'langlearn-current-connection-private-kit.json');
              })}>Download current connection’s private kit</button>
            <button type="button" disabled={busy}
              className="min-h-[44px] rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-800"
              onClick={() => void run(async () => {
                const state = await independentBackupStore.read();
                if (!state.kit || !state.pending) throw new BackupError('pending', 'No separate queued checkpoint is saved in this profile.');
                downloadJson(encryptedCheckpointFile(state.kit, state.pending.envelope), 'langlearn-exact-queued-checkpoint.encrypted.json');
              })}>Download exact queued checkpoint</button>
          </div>
        </details>
      </>}
      {failure && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">{failure}</p>}
      {failure && !journal && <>
        <p className="text-sm">LangLearn cannot check whether a recovery was interrupted, so study is paused rather than risking a partial restore. Retry storage access or export any readable local data. Do not clear site data.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy}
            className="min-h-[44px] rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
            onClick={() => void run(async () => { await independentBackupStore.open(); setAttempt((value) => value + 1); })}>
            Retry opening safety storage
          </button>
          <button type="button" disabled={busy}
            className="min-h-[44px] rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-800"
            onClick={() => void run(async () => { downloadJson(await exportAllData(), 'langlearn-local-data-before-recovery.json'); })}>
            Export readable local data
          </button>
        </div>
        <BackupRestorePanel />
      </>}
    </main>
  );
}
