import { getLanguageLabel, getLanguageName } from '../../lib/languages';

interface LanguagePickerProps {
  /** Languages to offer. Renders nothing when fewer than two. */
  options: readonly string[];
  /** Currently shown language, or `undefined` when `allowAll` and "All" is active. */
  value: string | undefined;
  onChange: (lang: string) => void;
  /** Adds an "All languages" option — for surfaces where language is a filter. */
  allowAll?: boolean;
  onSelectAll?: () => void;
  className?: string;
  /** Describes what is being switched, for screen readers. */
  label?: string;
}

/**
 * The one language switcher.
 *
 * This replaced twenty hand-rolled chip rows that had drifted into four
 * different selected-states — including a `bg-pink-600` in Lyrics, which broke
 * the One Accent Rule. Same control, same place, same look, everywhere.
 *
 * It renders nothing for a single-language learner: most people study one
 * language and should never see a control that only has one answer.
 */
export default function LanguagePicker({
  options,
  value,
  onChange,
  allowAll = false,
  onSelectAll,
  className = '',
  label = 'Language',
}: LanguagePickerProps) {
  if (options.length < 2) return null;

  const chip = 'shrink-0 min-h-[44px] px-3 rounded-xl text-sm font-medium transition-colors press-feedback';
  const on = 'bg-indigo-600 text-white';
  const off =
    'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600';

  return (
    <div
      role="group"
      aria-label={label}
      className={`flex gap-2 overflow-x-auto pb-1 ${className}`}
    >
      {allowAll && (
        <button
          onClick={onSelectAll}
          aria-pressed={value === undefined}
          className={`${chip} ${value === undefined ? on : off}`}
        >
          All languages
        </button>
      )}
      {options.map((lang) => (
        <button
          key={lang}
          onClick={() => onChange(lang)}
          aria-pressed={value === lang}
          aria-label={getLanguageName(lang)}
          className={`${chip} ${value === lang ? on : off}`}
        >
          {getLanguageLabel(lang)}
        </button>
      ))}
    </div>
  );
}
