import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

// If the waiting worker activates, the plugin reloads the page for us on the
// `controlling` event. When there is no waiting worker (e.g. a previously
// installed build already self-activated) that event never fires, so we fall
// back to reloading ourselves rather than leaving the button dead.
const RELOAD_FALLBACK_MS = 2000;

export default function UpdateToast() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (!needRefresh || dismissed) return null;

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await updateServiceWorker(true);
    } catch {
      /* fall through to the reload below */
    }
    window.setTimeout(() => window.location.reload(), RELOAD_FALLBACK_MS);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[70] animate-[slideUp_0.3s_ease-out] glass rounded-2xl shadow-lg border border-slate-200/60 dark:border-white/10 p-4">
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
        A new version is available
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={handleUpdate}
          disabled={updating}
          className="fill-primary text-white rounded-xl press-feedback px-3 py-1.5 text-sm font-medium disabled:opacity-70"
        >
          {updating ? 'Updating…' : 'Update'}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-xl px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 press-feedback"
        >
          Later
        </button>
      </div>
    </div>
  );
}
