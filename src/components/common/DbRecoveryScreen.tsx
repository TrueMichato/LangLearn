import { useEffect, useState } from 'react';
import type { DbStatus } from '../../db/recovery';
import {
  listSnapshots,
  exportSnapshot,
  dismissDataLoss,
  exportRecoveryPoint,
  restoreRecoveryPoint,
} from '../../db/recovery';
import { downloadJson } from '../../db/backup';
import type { Snapshot } from '../../db/schema';
import { formatBytes } from '../../lib/storage-persistence';
import { getRecoveryCapsuleInfo } from '../../db/recovery-capsule';

/**
 * What the learner sees when the database will not open.
 *
 * The instinct when an app breaks is to reinstall it or clear site data — and
 * for a local-first app that is the one action that turns a recoverable problem
 * into permanent data loss. So this screen exists to say, clearly and first:
 * your data is still there. It then offers the two safe moves (reload, or
 * restore a pre-upgrade snapshot) and a way to get the data off the device.
 * It never suggests clearing storage.
 */
export default function DbRecoveryScreen({
  status,
  onDismiss,
}: {
  status: DbStatus;
  onDismiss?: () => void;
}) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapshotError, setSnapshotError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    listSnapshots().then(setSnapshots).catch(() =>
      setSnapshotError('Saved snapshots could not be read. Reload after resolving the storage problem above; do not clear site data.'));
  }, []);

  const handleRestore = async (snapshot: Snapshot) => {
    if (busy || !confirmRecoveryRestore()) return;
    setBusy(true);
    setMessage('');
    try {
      await restoreRecoveryPoint({ kind: 'snapshot', snapshot });
      setMessage('Restored. Reloading…');
      setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'That snapshot could not be restored. Your data has not been changed.');
      setBusy(false);
    }
  };

  const handleDownload = async (snapshot: Snapshot) => {
    const payload = await exportSnapshot(snapshot.id!);
    if (!payload) return;
    downloadJson(payload, `langlearn-snapshot-${snapshot.createdAt.slice(0, 10)}.json`);
  };

  const { title, explanation, primaryAction } = describe(status);
  const lostRecovery =
    status.kind === 'data-loss-suspected' ? status.recovery : null;
  const lostCapsule =
    lostRecovery?.kind === 'capsule' ? lostRecovery.capsule : null;
  const capsuleInfo = lostCapsule ? getRecoveryCapsuleInfo() : null;

  const handleStartFresh = () => {
    if (!lostRecovery) return;
    dismissDataLoss(lostRecovery);
    onDismiss?.();
  };

  const handleCapsuleRestore = async () => {
    if (!lostRecovery || lostRecovery.kind !== 'capsule' || busy) return;
    if (!confirmRecoveryRestore()) return;
    setBusy(true);
    setMessage('');
    try {
      await restoreRecoveryPoint(lostRecovery);
      setMessage('Restored. Reloading…');
      setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The recovery copy could not be restored. Nothing was changed.');
      setBusy(false);
    }
  };

  const handleCapsuleDownload = () => {
    if (!lostRecovery || lostRecovery.kind !== 'capsule') return;
    downloadJson(
      exportRecoveryPoint(lostRecovery),
      `langlearn-recovery-${lostRecovery.capsule.createdAt.slice(0, 10)}.json`,
    );
  };

  return (
    <div className="app-frame min-h-screen bg-slate-50 dark:bg-slate-900 px-5 py-10">
      <div className="mx-auto max-w-md space-y-5">
        <header className="space-y-2">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">{explanation}</p>
        </header>

        <div className="rounded-2xl border border-green-200/70 dark:border-green-900/40 bg-green-50 dark:bg-green-950/40 p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            {lostRecovery
              ? "An earlier copy of your progress is still on this device. Download it before restoring. Please don't clear the site data or delete the app first."
              : "An opening problem does not mean your data has been deleted. Please don't clear the site data or delete the app — that could remove data that is still recoverable."}
          </p>
        </div>

        {primaryAction && !lostRecovery && (
          <button
            onClick={() => window.location.reload()}
            className="w-full min-h-[44px] rounded-xl bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {primaryAction}
          </button>
        )}

        {lostCapsule && (
          <section className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-white/10 dark:bg-slate-800">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Browser recovery copy
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Saved {new Date(lostCapsule.createdAt).toLocaleString()}
              {capsuleInfo ? ` · ${formatBytes(capsuleInfo.sizeBytes)}` : ''}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Missing progress can be added while keeping your current work.
              If saved IDs conflict, restoration stops without changing your data.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={handleCapsuleDownload}
                disabled={busy}
                className="min-h-[44px] rounded-xl border border-slate-200/70 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-700/50"
              >
                Download
              </button>
              <button
                onClick={handleCapsuleRestore}
                disabled={busy}
                className="min-h-[44px] flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Restore missing progress
              </button>
            </div>
            {message && (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300" role="status">
                {message}
              </p>
            )}
          </section>
        )}

        <section className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-800 p-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Saved snapshots
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Copies stored with the main database for undoing a bad app update.
          </p>

          {snapshotError ? (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300" role="status">{snapshotError}</p>
          ) : snapshots.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              No snapshots available yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
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
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleRestore(snapshot)}
                      disabled={busy}
                      className="min-h-[44px] flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handleDownload(snapshot)}
                      className="min-h-[44px] rounded-xl border border-slate-200/70 dark:border-white/10 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Download
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {message && !lostCapsule && (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300" role="status">
              {message}
            </p>
          )}
        </section>

        {lostRecovery && (
          <button
            onClick={handleStartFresh}
            disabled={busy}
            className="w-full min-h-[44px] rounded-xl border border-slate-200/70 dark:border-white/10 px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Continue without restoring
          </button>
        )}
      </div>
    </div>
  );
}

function confirmRecoveryRestore(): boolean {
  return window.confirm(
    'Restore missing progress while keeping current work, bonus XP, badges and study sets? ' +
    'A safety snapshot will be saved first. Conflicting IDs will stop restoration without changes. ' +
    'Download the selected copy first; you can also export current data from Settings after continuing.',
  );
}

function describe(status: DbStatus): {
  title: string;
  explanation: string;
  primaryAction: string | null;
} {
  switch (status.kind) {
    case 'reload-required':
      return {
        title: 'Reload to continue safely',
        explanation:
          'Another tab requested a database change, so this tab closed its connection. Reload before continuing your study.',
        primaryAction: 'Reload the app',
      };
    case 'version-mismatch':
      return {
        title: 'This version of the app is out of date',
        explanation:
          'Your saved data was written by a newer version of LangLearn than the one that just loaded — usually a cached copy. Reloading fetches the current version and everything reappears.',
        primaryAction: 'Reload the app',
      };
    case 'blocked':
      return {
        title: 'LangLearn is open in another tab',
        explanation:
          'An update needs to finish, but another tab is still using the old version. Close the other tabs, then reload here.',
        primaryAction: 'Reload the app',
      };
    case 'data-loss-suspected':
      return {
        title: 'Your progress looks like it went missing',
        explanation:
          'Some previously saved history is missing from the main database. An earlier local recovery copy is available below. Download it before making changes.',
        primaryAction: null,
      };
    default:
      return {
        title: "Your data couldn't be opened",
        explanation:
          'Something went wrong while opening your local database. Try reloading first; if that does not help, restore one of the automatic snapshots below.',
        primaryAction: 'Reload the app',
      };
  }
}
