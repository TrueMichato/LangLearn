import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import {
  applyUpdate,
  browserUpdateEnvironment,
  consumeUpdateApplied,
  hasWaitingWorker,
} from '../../lib/sw-update';

const WAITING_POLL_MS = 3000;
const CONFIRMATION_MS = 5000;

// Single-use flag, so read it once per page load rather than per mount.
const updateWasApplied = consumeUpdateApplied();

export default function UpdateToast() {
  // Registers the service worker. `needRefresh` is the plugin's signal that an
  // update exists — necessary but not sufficient, see the effect below.
  const {
    needRefresh: [needRefresh],
  } = useRegisterSW();

  const [waiting, setWaiting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [confirmed, setConfirmed] = useState(updateWasApplied);

  // Confirm the update on the other side of the reload, so the banner vanishing
  // reads as "that worked" rather than "that gave up".
  useEffect(() => {
    if (!confirmed) return;
    const timer = window.setTimeout(() => setConfirmed(false), CONFIRMATION_MS);
    return () => window.clearTimeout(timer);
  }, [confirmed]);

  // `needRefresh` can outlive the worker it refers to: a worker that activates
  // itself leaves nothing to skip, and the banner would then offer a button
  // with no work to do. Only offer the update while a worker is really waiting,
  // and retract the banner if that worker goes away on its own.
  useEffect(() => {
    if (!needRefresh || updating) return;
    let cancelled = false;
    const check = async () => {
      const found = await hasWaitingWorker();
      if (!cancelled) setWaiting(found);
    };
    void check();
    const id = window.setInterval(() => void check(), WAITING_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [needRefresh, updating]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await applyUpdate(browserUpdateEnvironment());
    } catch {
      window.location.reload();
    }
  };

  if (confirmed) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-20 left-4 right-4 z-[70] motion-safe:animate-[slideUp_0.3s_ease-out] glass rounded-2xl shadow-lg border border-slate-200/60 dark:border-white/10 p-4"
      >
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
          You&rsquo;re on the latest version ✓
        </p>
      </div>
    );
  }

  if (!needRefresh || !waiting || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 right-4 z-[70] motion-safe:animate-[slideUp_0.3s_ease-out] glass rounded-2xl shadow-lg border border-slate-200/60 dark:border-white/10 p-4"
    >
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
        A new version is available
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={handleUpdate}
          disabled={updating}
          className="fill-primary text-white rounded-xl press-feedback px-4 min-h-[44px] text-sm font-medium disabled:opacity-70"
        >
          {updating ? 'Updating…' : 'Update'}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          disabled={updating}
          className="rounded-xl px-4 min-h-[44px] text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 press-feedback disabled:opacity-70"
        >
          Later
        </button>
      </div>
    </div>
  );
}
