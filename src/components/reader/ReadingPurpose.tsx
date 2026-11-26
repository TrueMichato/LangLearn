import type { ReadingPurpose as Purpose } from '../../db/reading-progress';

export default function ReadingPurpose({ purpose, onChange }: { purpose: Purpose; onChange: (value: Purpose) => void }) {
  return (
    <fieldset className="mb-4">
      <legend className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">How would you like to read?</legend>
      <div className="flex gap-2">
        {([['main-idea', 'Main idea'], ['close-study', 'Close study']] as const).map(([value, label]) => (
          <button key={value} type="button" aria-pressed={purpose === value} onClick={() => onChange(value)}
            className={`min-h-[44px] rounded-xl px-3 text-sm font-medium ${
              purpose === value ? 'bg-indigo-600 text-white dark:bg-indigo-600 dark:text-white'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
            }`}>
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {purpose === 'main-idea'
          ? 'Follow the meaning first. Look up what blocks understanding; you can leave other words for later.'
          : 'Take a short passage slowly. Notice how words work together, look up what helps, then reread.'}
        {' '}Word lookup and saving are always available. Highlighting is optional.
      </p>
    </fieldset>
  );
}
