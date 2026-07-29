import { getLanguageName, getLanguageLabel } from '../../lib/languages';

interface LanguageUnavailableProps {
  /** The language the learner actually chose. */
  requested: string | undefined;
  /** Languages this surface can offer instead. */
  options: readonly string[];
  onChange: (lang: string) => void;
  /** What isn't available, e.g. "Conjugation drills". */
  feature: string;
  /** Whether `feature` is plural, so the sentence reads correctly either way. */
  plural?: boolean;
  className?: string;
}

/**
 * Shown when the learner's chosen language isn't available on this surface.
 *
 * The alternative — quietly showing Japanese to someone who chose Romanian —
 * is exactly the "which language am I even looking at?" confusion this whole
 * change exists to remove. Say it by name, then offer the real choices.
 */
export default function LanguageUnavailable({
  requested,
  options,
  onChange,
  feature,
  plural = false,
  className = '',
}: LanguageUnavailableProps) {
  return (
    <div className={`rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-800 p-4 text-center ${className}`}>
      <p className="text-2xl" aria-hidden="true">
        🌱
      </p>
      <p className="mt-2 font-semibold text-slate-800 dark:text-slate-100">
        {`${feature} ${plural ? "aren't" : "isn't"} available for ${
          requested ? getLanguageName(requested) : 'this language'
        } yet`}
      </p>
      {options.length > 0 ? (
        <>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {options.length === 1
              ? 'You can practise in:'
              : 'Pick one of your other languages:'}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {options.map((lang) => (
              <button
                key={lang}
                onClick={() => onChange(lang)}
                className="min-h-[44px] rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                {getLanguageLabel(lang)}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          More languages are on the way — there's plenty else to study meanwhile.
        </p>
      )}
    </div>
  );
}
