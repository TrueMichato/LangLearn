import { useEffect, useId, useState } from 'react';
import { liveQuery } from 'dexie';
import { downloadJson } from '../../db/backup';
import { independentBackupStore, type BackupClientState, type RestoreSafetyCopy } from '../../db/independent-backup-store';
import { captureIndependentPayload, independentProgressRows } from '../../db/independent-backup-payload';
import { encryptCheckpoint } from '../../lib/backup-crypto';
import { backupClient } from '../../lib/backup-runtime';
import { backupProblem, encryptedCheckpointFile, readVaultStatus } from '../../lib/independent-backup';
import { formatBytes } from '../../lib/storage-persistence';
import BackupRestorePanel from './BackupRestorePanel';

const button = 'min-h-[44px] rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700';
const primary = 'min-h-[44px] rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40';
const input = 'block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';

export default function EncryptedBackupSection() {
  const id = useId();
  const [state, setState] = useState<BackupClientState>();
  const [endpoint, setEndpoint] = useState<string>(import.meta.env.VITE_BACKUP_API_URL ?? '');
  const [enrollment, setEnrollment] = useState('');
  const [consent, setConsent] = useState(false);
  const [kitDownloaded, setKitDownloaded] = useState(false);
  const [kitSaved, setKitSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [runtimeError, setRuntimeError] = useState<ReturnType<typeof backupProblem>>();
  const [usage, setUsage] = useState<{ storedBytes: number; maxBytes: number; checkpointCount: number }>();
  const [safetyCopy, setSafetyCopy] = useState<RestoreSafetyCopy>();
  useEffect(() => {
    const subscription = liveQuery(() => independentBackupStore.read()).subscribe({
      next: setState, error: (error) => setMessage(backupProblem(error).message),
    });
    const unsubscribe = backupClient.subscribe(() => {
      setUploading(backupClient.isUploading()); setRuntimeError(backupClient.getProblem());
    });
    const safety = liveQuery(() => independentBackupStore.safetyCopies.orderBy('createdAt').last()).subscribe({
      next: setSafetyCopy, error: (error) => setMessage(backupProblem(error).message),
    });
    return () => { subscription.unsubscribe(); safety.unsubscribe(); unsubscribe(); };
  }, []);
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setMessage('');
    try { await action(); } catch (error) { setMessage(backupProblem(error).message); }
    finally { setBusy(false); }
  };
  const error = runtimeError ?? state?.error;
  const status = !state?.kit ? 'Unconfigured' : !state.enrolled ? 'Enrollment not confirmed' :
    !state.enabled ? state.kitConfirmed ? 'Disconnected — uploads paused' : 'Needs recovery kit confirmation' :
    uploading ? 'Uploading — confirmation pending' : error ? 'Backup needs attention' :
    state.pending || state.dirty ? 'Pending changes' : state.lastAck ? 'Remote confirmed' : 'Pending first backup';

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-800/90" aria-labelledby={`${id}-title`}>
      <header className="space-y-2">
        <h3 id={`${id}-title`} className="font-semibold text-slate-800 dark:text-slate-100">Independent encrypted backups</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          An optional copy outside this browser. Words, review history, texts, and learning progress are encrypted here before upload. This is backup and recovery, not device sync.
        </p>
      </header>
      <div role="status" aria-live="polite" className="space-y-1 text-sm">
        <p className="font-medium text-slate-800 dark:text-slate-100">{status}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {state?.lastAck ? `Last read back, decrypted, and verified: ${new Date(state.lastAck.confirmedAt).toLocaleString()}.` : 'No remote copy has been confirmed on this device.'}
          {(state?.pending || state?.dirty) && ' New pending changes are not yet confirmed remotely.'}
        </p>
      </div>
      {(!state?.kit || !state.enrolled) && (
        <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            try { await backupClient.enroll(state?.kit?.endpoint ?? endpoint, enrollment, consent); }
            finally { setEnrollment(''); }
          });
        }}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor={`${id}-endpoint`}>
            Backup service address
            <input id={`${id}-endpoint`} className={`${input} mt-1`} type="url" required autoComplete="url"
              placeholder="https://your-backup-service.example" value={state?.kit?.endpoint ?? endpoint}
              onChange={(event) => setEndpoint(event.target.value)} disabled={busy || !!state?.kit} />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor={`${id}-enrollment`}>
            One-time enrollment code
            <input id={`${id}-enrollment`} className={`${input} mt-1`} type="password" autoComplete="off" required
              value={enrollment} onChange={(event) => setEnrollment(event.target.value)} disabled={busy} />
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">Supplied by your service operator; never saved in LangLearn. No login provider or new account is needed.</p>
          <label className="flex min-h-[44px] items-start gap-3 py-2 text-sm text-slate-700 dark:text-slate-200">
            <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-indigo-600" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>I agree to store encrypted copies of my words, history, texts, settings, and lesson progress at this service. The operator sees checkpoint size, time, and record counts, not the contents.</span>
          </label>
          <button type="submit" className={primary} disabled={busy || !consent || !enrollment || (!endpoint && !state?.kit)}>
            {busy ? 'Creating vault…' : state?.kit ? 'Retry vault enrollment' : 'Create my backup vault'}
          </button>
        </form>
      )}
      {state?.kit && (
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
          <p className="break-all text-xs text-slate-500 dark:text-slate-400">Service: {state.kit.endpoint}</p>
          <p>The recovery kit contains the only decryption key and vault capabilities. Anyone holding it can read and add backups. Keep it private and save a copy off-device; the operator cannot recover a lost key.</p>
          <button type="button" className={button} disabled={busy} onClick={() => {
            downloadJson(JSON.stringify(state.kit, null, 2), `langlearn-recovery-kit-${state.kit!.vaultId}.json`);
            setKitDownloaded(true);
          }}>Download private recovery kit</button>
          {state.enrolled && !state.enabled && (
            <>
              <label className="flex min-h-[44px] items-start gap-3 py-2">
                <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-indigo-600" checked={kitSaved}
                  disabled={!kitDownloaded && !state.kitConfirmed} onChange={(event) => setKitSaved(event.target.checked)} />
                <span>I saved the kit somewhere independent of this browser, and agree to encrypted automatic backups.</span>
              </label>
              <button type="button" className={primary} disabled={busy || !kitSaved} onClick={() => void run(async () => {
                await backupClient.enable(true, kitSaved); await backupClient.flush();
              })}>Enable automatic encrypted backups</button>
            </>
          )}
          {state.enabled && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className={button} disabled={busy || uploading} onClick={() => void run(() => backupClient.retry())}>Back up now / retry</button>
              <button type="button" className={button} disabled={busy || uploading} onClick={() => void run(() => backupClient.disconnect())}>Disconnect uploads</button>
            </div>
          )}
          <button type="button" className={button} disabled={busy} onClick={() => void run(async () => {
            const payload = await captureIndependentPayload(localStorage, () => 0);
            const envelope = await encryptCheckpoint(JSON.stringify(payload), state.kit!.encryptionKey,
              state.headId, payload.schemaVersion, independentProgressRows(payload));
            downloadJson(encryptedCheckpointFile(state.kit!, envelope), `langlearn-encrypted-${envelope.id}.json`);
          })}>Export current data as an encrypted checkpoint</button>
          {state.pending && <button type="button" className={button} disabled={busy} onClick={() => downloadJson(
            encryptedCheckpointFile(state.kit!, state.pending!.envelope), `langlearn-queued-${state.pending!.envelope.id}.json`,
          )}>Export exact queued checkpoint</button>}
          {state.enrolled && <button type="button" className={button} disabled={busy} onClick={() => void run(async () => {
            setUsage(await readVaultStatus(state.kit!));
          })}>Check vault storage usage</button>}
          {usage && <p className="text-xs text-slate-500 dark:text-slate-400">{usage.checkpointCount} retained versions · {formatBytes(usage.storedBytes)} of {formatBytes(usage.maxBytes)} used. Capacity errors never delete protected recovery points.</p>}
          <p className="text-xs text-slate-500 dark:text-slate-400">Disconnecting keeps this kit, queued bytes, and all known remote versions. No remote deletion is performed. Keep the kit to recover them later.</p>
        </div>
      )}
      {error && <div role="alert" className="space-y-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <p>{error.message}</p>
        {error.code === 'history-decreased' && <button type="button" className={button} disabled={busy || uploading}
          onClick={() => {
            if (window.confirm('Only continue if you intentionally removed history and have inspected earlier recovery versions. Upload this exact smaller checkpoint without deleting older retained copies?')) {
              void run(() => backupClient.flush(true));
            }
          }}>I intentionally removed history — upload queued copy</button>}
      </div>}
      {message && <p role="status" className="text-sm text-slate-600 dark:text-slate-300">{message}</p>}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Capture coalesces changes about once a minute while open, and checks again on resume. Closing before capture can lose recent changes: learning writes and this queue are not one transaction. “Confirmed” protects that point in time, not every later change. The service retains the first nonempty copy, newest 8 versions, hourly anchors for 24 hours, and daily anchors for 30 days, within its capacity. It does not keep every write for 30 days. Keep offline exports too.
      </p>
      <details className="border-t border-slate-200 pt-4 dark:border-white/10">
        <summary className="min-h-[44px] cursor-pointer py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">Recover with a saved kit or encrypted file</summary>
        <div className="pt-3"><BackupRestorePanel /></div>
      </details>
      {safetyCopy && <div className="border-t border-slate-200 pt-4 dark:border-white/10">
        <button type="button" className={button} onClick={() => downloadJson(JSON.stringify(safetyCopy.payload, null, 2),
          `langlearn-before-recovery-${safetyCopy.createdAt.slice(0, 10)}.json`)}>Export local pre-recovery safety copy</button>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Saved independently before your latest restore. This local safety export is not encrypted.</p>
      </div>}
    </section>
  );
}
