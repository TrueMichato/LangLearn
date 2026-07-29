import { getStartingPoints, type StartingPoint } from '../../lib/starting-points';

interface StartingPointsProps {
  language: string;
  onSelect: (point: StartingPoint) => void;
  /** Rendered above the options. Omit to let the caller supply its own. */
  heading?: string;
  description?: string;
}

/**
 * The shared on-ramp: three ways into a language, one of them recommended.
 * Rendered both at the end of onboarding and on a first-run Dashboard, so a
 * learner who skipped the intro lands in exactly the same place as one who
 * did not.
 */
export default function StartingPoints({
  language,
  onSelect,
  heading,
  description,
}: StartingPointsProps) {
  const points = getStartingPoints(language);

  return (
    <div>
      {heading && (
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {heading}
        </h2>
      )}
      {description && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}

      <ul className={`space-y-2 ${heading || description ? 'mt-4' : ''}`}>
        {points.map((point) => (
          <li key={point.id}>
            <button
              type="button"
              onClick={() => onSelect(point)}
              className={`flex w-full min-h-[44px] items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                point.recommended
                  ? 'border-indigo-200 bg-indigo-50/70 hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/15'
                  : 'border-slate-200/70 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-slate-700/60'
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl ${
                  point.recommended
                    ? 'bg-indigo-100 dark:bg-indigo-500/20'
                    : 'bg-slate-100 dark:bg-slate-700'
                }`}
              >
                {point.emoji}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {point.label}
                  </span>
                  {point.recommended && (
                    <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                      Recommended
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-300">
                  {point.sublabel}
                </span>
              </span>

              <span
                aria-hidden="true"
                className="shrink-0 text-slate-500 dark:text-slate-400"
              >
                →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
