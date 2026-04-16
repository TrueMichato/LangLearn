import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function UpdateToast() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const [dismissed, setDismissed] = useState(false);

  if (!needRefresh || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-[slideUp_0.3s_ease-out] rounded-xl bg-white p-4 shadow-lg dark:bg-slate-800">
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
        A new version is available
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Update
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Later
        </button>
      </div>
    </div>
  );
}
