import { useNudgeStore, type InAppNudge } from '../../stores/nudgeStore';

type Tone = NonNullable<InAppNudge['tone']>;

const toneClasses: Record<Tone, string> = {
  info: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200/60 dark:border-indigo-800/50',
  warm: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200/60 dark:border-amber-800/50',
  celebrate: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/60 dark:border-emerald-800/50',
};

export default function InAppNudgeStack() {
  const nudges = useNudgeStore((s) => s.nudges);
  const dismiss = useNudgeStore((s) => s.dismiss);

  if (nudges.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 z-[70] pointer-events-none px-4">
      <div className="max-w-lg mx-auto space-y-2">
        {nudges.map((n) => {
          const tone = n.tone ?? 'info';
          return (
            <div
              key={n.id}
              className={`pointer-events-auto rounded-2xl border ${toneClasses[tone]} shadow-lg p-3 animate-[scaleIn_0.2s_ease-out]`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {n.body}
                  </p>
                </div>
                <button
                  onClick={() => dismiss(n.id)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 -mr-1 -mt-1 rounded-md min-h-[32px] min-w-[32px]"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
              {n.ctaLabel && (
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={async () => {
                      try {
                        await n.ctaAction?.();
                      } finally {
                        dismiss(n.id);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors min-h-[32px]"
                  >
                    {n.ctaLabel}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
