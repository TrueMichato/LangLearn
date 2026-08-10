import { useEffect, useRef, useState } from 'react';
import {
  exportAllData,
  importAllData,
  downloadJson,
  type ImportMode,
  type ImportResult,
} from '../../db/backup';
import {
  listSnapshots,
  restoreSnapshot,
  deleteSnapshot,
  takeSnapshot,
  exportSnapshot,
  MAX_SNAPSHOTS,
} from '../../db/recovery';
import type { Snapshot } from '../../db/schema';
import {
  getStorageEstimate,
  formatBytes,
  isInstalledPWA,
  type PersistenceState,
} from '../../lib/storage-persistence';

const sectionCard =
  'bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-slate-200/60 dark:border-white/10 p-4';

/**
 * Everything to do with keeping the learner's progress alive.
 *
 * Grouped deliberately: eviction risk, automatic snapshots and manual
 * export/import are three answers to the same question ("will my streak still
 * be here next month?"), and splitting them made none of them findable.
 */
export default function DataSafetySection({
  persistence,
}: {
  persistence: PersistenceState;
}) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [usage, setUsage] = useState<{ usageBytes: number | null; quotaBytes: number | null }>({
    usageBytes: null,
    quotaBytes: null,
  });
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    listSnapshots().then(setSnapshots).catch(() => setSnapshots([]));
    getStorageEstimate().then(setUsage);
  };

  useEffect(refresh, []);

  const handleExport = async () => {
    const json = await exportAllData();
    downloadJson(json, `langlearn-backup-${new Date().toISOString().slice(0, 10)}.json`);
    setStatus('Exported everything: words, reviews, streak, lessons, badges and settings.');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus('');
    try {
      // Importing rewrites live data, so capture the current state first — the
      // learner can undo a wrong file from the snapshot list below.
      await takeSnapshot('before importing a backup file');
      const result = await importAllData(await file.text(), importMode);
      setStatus(describeImport(result));
      refresh();
    } catch {
      setStatus("That file couldn't be read. Nothing was changed.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSnapshotNow = async () => {
    setBusy(true);
    const snapshot = await takeSnapshot('saved manually');
    setStatus(snapshot ? 'Snapshot saved.' : 'There is nothing to snapshot yet.');
    refresh();
    setBusy(false);
  };

  const handleRestore = async (snapshot: Snapshot) => {
    if (!window.confirm(`Restore your data as it was on ${new Date(snapshot.createdAt).toLocaleString()}? Your current data will be snapshotted first.`)) return;
    setBusy(true);
    try {
      await restoreSnapshot(snapshot.id!);
      setStatus('Restored. Reloading…');
      setTimeout(() => window.location.reload(), 800);
    } catch {
      setStatus('That snapshot could not be restored. Nothing was changed.');
      setBusy(false);
    }
  };

  const handleDownloadSnapshot = async (snapshot: Snapshot) => {
    const payload = await exportSnapshot(snapshot.id!);
    if (payload) {
      downloadJson(payload, `langlearn-snapshot-${snapshot.createdAt.slice(0, 10)}.json`);
    }
  };

  const handleDeleteSnapshot = async (snapshot: Snapshot) => {
    await deleteSnapshot(snapshot.id!);
    refresh();
  };

  return (
    <section className={sectionCard}>
      <div className="flex items-center gap-2 mb-3">
        <span aria-hidden="true">💾</span>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Your data
        </h3>
      </div>

      <PersistenceNotice persistence={persistence} usage={usage} />

      {/* ─ Snapshots ─ */}
      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Automatic snapshots
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Taken daily and before every app update. The last {MAX_SNAPSHOTS} are kept.
            </p>
          </div>
          <button
            onClick={handleSnapshotNow}
            disabled={busy}
            className="min-h-[44px] shrink-0 rounded-xl border border-slate-200/70 dark:border-white/10 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 press-feedback"
          >
            Save now
          </button>
        </div>

        {snapshots.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No snapshots yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {snapshots.map((snapshot) => (
              <li
                key={snapshot.id}
                className="rounded-xl border border-slate-200/70 dark:border-white/10 p-3"
              >
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {new Date(snapshot.createdAt).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {snapshot.reason} · {formatBytes(snapshot.sizeBytes)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleRestore(snapshot)}
                    disabled={busy}
                    className="min-h-[44px] rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 press-feedback"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => handleDownloadSnapshot(snapshot)}
                    className="min-h-[44px] rounded-xl border border-slate-200/70 dark:border-white/10 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 press-feedback"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDeleteSnapshot(snapshot)}
                    aria-label={`Delete snapshot from ${new Date(snapshot.createdAt).toLocaleString()}`}
                    className="min-h-[44px] rounded-xl px-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 press-feedback"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ─ Manual export / import ─ */}
      <div className="mt-5 border-t border-slate-200/70 dark:border-white/10 pt-4 space-y-2">
        <button
          onClick={handleExport}
          className="w-full min-h-[44px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 py-2 rounded-xl font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors press-feedback"
        >
          📥 Export all data
        </button>

        <div>
          <label
            htmlFor="import-mode"
            className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
          >
            When importing a file
          </label>
          <select
            id="import-mode"
            value={importMode}
            onChange={(e) => setImportMode(e.target.value as ImportMode)}
            className="w-full min-h-[44px] rounded-xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="merge">Keep what I have and add anything missing</option>
            <option value="replace">Replace my data with the file's</option>
          </select>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="w-full min-h-[44px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-2 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 press-feedback"
        >
          📤 Import from file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
          aria-label="Choose a backup file to import"
        />

        {status && (
          <p className="text-sm text-slate-600 dark:text-slate-300" role="status">
            {status}
          </p>
        )}
      </div>
    </section>
  );
}

function describeImport(result: ImportResult): string {
  const total = Object.values(result.written).reduce((sum, n) => sum + (n ?? 0), 0);
  const skipped = Object.values(result.skipped).reduce((sum, n) => sum + (n ?? 0), 0);
  const base =
    result.mode === 'merge'
      ? `Added ${total} item${total === 1 ? '' : 's'}${skipped > 0 ? `, kept ${skipped} you already had` : ''}.`
      : `Restored ${total} item${total === 1 ? '' : 's'}.`;
  // Naming what was left alone matters: the old importer silently wiped the
  // tables a partial backup did not mention.
  const untouched = result.untouchedTables.length;
  return untouched > 0
    ? `${base} That file didn't include everything, so ${untouched} other area${untouched === 1 ? '' : 's'} of your data were left untouched.`
    : base;
}

function PersistenceNotice({
  persistence,
  usage,
}: {
  persistence: PersistenceState;
  usage: { usageBytes: number | null; quotaBytes: number | null };
}) {
  const size = usage.usageBytes != null ? ` · using ${formatBytes(usage.usageBytes)}` : '';

  if (persistence === 'persisted') {
    return (
      <div className="rounded-xl border border-green-200/70 dark:border-green-900/40 bg-green-50 dark:bg-green-950/40 p-3">
        <p className="text-sm text-green-800 dark:text-green-200">
          ✅ Your browser has been asked to keep this data permanently{size}.
        </p>
      </div>
    );
  }

  if (persistence === 'denied') {
    return (
      <div className="rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/40 p-3">
        <p className="text-sm text-amber-900 dark:text-amber-200">
          Your browser hasn't guaranteed this data yet{size}. It can be cleared automatically
          if you don't open the app for a while.
        </p>
        {!isInstalledPWA() && (
          <p className="mt-2 text-sm text-amber-900 dark:text-amber-200">
            Installing LangLearn to your home screen is the most reliable fix, especially on
            iPhone and iPad. Exporting a backup now is a good idea either way.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 p-3">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        This browser can't tell us whether your data is protected from automatic cleanup{size}.
        Keep an exported backup somewhere safe.
      </p>
    </div>
  );
}
