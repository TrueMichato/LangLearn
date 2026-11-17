import { useId, useState } from 'react';
import { downloadJson } from '../../db/backup';
import { BackupError, parseRecoveryKit, type CheckpointSummary, type RecoveryKit } from '../../lib/backup-crypto';
import {
  backupProblem, downloadRemoteCheckpoint, encryptedCheckpointFile, listRemoteCheckpoints,
  readEncryptedCheckpointFile, restoreIndependentCheckpoint, type BackupPreview,
} from '../../lib/independent-backup';

const button = 'min-h-[44px] rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700';
const primary = 'min-h-[44px] rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40';
const input = 'block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';

export default function BackupRestorePanel() {
  const id = useId();
  const [kit, setKit] = useState<RecoveryKit>();
  const [versions, setVersions] = useState<CheckpointSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [listed, setListed] = useState(false);
  const [preview, setPreview] = useState<BackupPreview>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [freshConfirmed, setFreshConfirmed] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true); setMessage('');
    try { await action(); } catch (error) { setMessage(backupProblem(error).message); }
    finally { setBusy(false); }
  };
  const loadVersions = async (more = false) => {
    if (!kit) return;
    await run(async () => {
      const result = await listRemoteCheckpoints(kit, more && cursor ? cursor : undefined);
      setVersions((current) => more ? [...current, ...result.checkpoints] : result.checkpoints);
      setCursor(result.nextCursor); setListed(true);
    });
  };

  return (
    <div className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
      <header className="space-y-2">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Recover an encrypted backup</h3>
        <p>You need the recovery kit saved outside this site. No account or enrollment code is needed to read a vault.</p>
        <p className="text-slate-500 dark:text-slate-400">
          Recovery is for a fresh browser profile only. Existing learning data, XP, and study sets will not be replaced or automatically merged. Close other LangLearn tabs first.
        </p>
      </header>
      <div className="space-y-1">
        <label className="block font-medium" htmlFor={`${id}-kit`}>Recovery kit file</label>
        <input id={`${id}-kit`} type="file" accept=".json,application/json" className={input} disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            setKit(undefined); setPreview(undefined); setVersions([]); setCursor(null); setListed(false); setFreshConfirmed(false);
            void run(async () => {
              if (file.size > 16_384) throw new BackupError('kit-size', 'This recovery kit file is too large. Choose the small private kit JSON file, not a checkpoint.');
              let value: unknown;
              try { value = JSON.parse(await file.text()); } catch { setMessage('This is not a valid JSON recovery kit.'); return; }
              const next = parseRecoveryKit(value);
              setKit(next); setVersions([]); setPreview(undefined); setCursor(null); setListed(false); setFreshConfirmed(false);
            });
          }} />
      </div>
      {kit && (
        <>
          <p className="break-all text-slate-500 dark:text-slate-400">
            Recovery service: {kit.endpoint}<br />Vault: {kit.vaultId}
          </p>
          <p>Only choose “List recovery versions” if you trust this kit’s service address. It receives the kit’s read capability, never its encryption key.</p>
          <button type="button" className={button} disabled={busy} onClick={() => void loadVersions()}>List recovery versions</button>
          {listed && versions.length === 0 && <p>No remote checkpoints were found in this vault. A new empty vault will not be created.</p>}
          {versions.length > 0 && (
            <ul className="divide-y divide-slate-200 dark:divide-white/10">
              {versions.map((version) => (
                <li key={version.id} className="py-3">
                  <p className="font-medium">{new Date(version.createdAt).toLocaleString()}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {version.progressRows} saved records · version {version.sequence}
                  </p>
                  <button type="button" className={`${button} mt-2`} disabled={busy} onClick={() => void run(async () => {
                    setPreview(undefined);
                    setPreview(await downloadRemoteCheckpoint(kit, version.id)); setFreshConfirmed(false);
                  })}>Decrypt and preview</button>
                </li>
              ))}
            </ul>
          )}
          {cursor && <button type="button" className={button} disabled={busy} onClick={() => void loadVersions(true)}>Load older versions</button>}
          <div className="space-y-1 border-t border-slate-200 pt-4 dark:border-white/10">
            <label className="block font-medium" htmlFor={`${id}-checkpoint`}>Or open an encrypted checkpoint file offline</label>
            <p className="text-xs text-slate-500 dark:text-slate-400">This works without contacting the service. Use the matching recovery kit.</p>
            <input id={`${id}-checkpoint`} type="file" accept=".json,application/json" className={input} disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0]; event.target.value = '';
                if (!file) return;
                setPreview(undefined);
                void run(async () => {
                  if (file.size > 8 * 1024 * 1024 + 1024) { setMessage('This checkpoint file is too large.'); return; }
                  setPreview(await readEncryptedCheckpointFile(await file.text(), kit)); setFreshConfirmed(false);
                });
              }} />
          </div>
        </>
      )}
      {kit && preview && (
        <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-white/10">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100">Verified recovery point</h4>
          <p>{new Date(preview.envelope.createdAt).toLocaleString()} · {preview.payload.tables.words.length} words · {preview.payload.tables.reviews.length} reviews</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Checksum, encryption authentication, schema, and full payload validation passed. All saved tables, available stores, and lesson drafts in this copy will be restored with their original IDs. Device push registration is not copied.</p>
          <button type="button" className={button} disabled={busy} onClick={() => downloadJson(
            encryptedCheckpointFile(kit, preview.envelope), `langlearn-encrypted-${preview.envelope.id}.json`,
          )}>Download this encrypted checkpoint</button>
          <label className="flex min-h-[44px] items-start gap-3 py-2">
            <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-indigo-600" checked={freshConfirmed}
              onChange={(event) => setFreshConfirmed(event.target.checked)} />
            <span>I am restoring into a fresh profile and have closed other LangLearn tabs. Keep a local safety copy before starting.</span>
          </label>
          <button type="button" className={primary} disabled={busy || !freshConfirmed} onClick={() => void run(async () => {
            await restoreIndependentCheckpoint(kit, preview.envelope);
            setMessage('Recovery verified. Use the recovery screen’s reload button to hydrate the restored stores.');
          })}>Restore this recovery point</button>
        </div>
      )}
      {(busy || message) && <p role="status" aria-live="polite" className="text-sm text-slate-600 dark:text-slate-300">{busy ? 'Checking your backup…' : message}</p>}
    </div>
  );
}
