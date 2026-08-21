export type AddAllWordsStatus = 'idle' | 'saving' | 'done' | 'error';

export interface AddAllWordsResult {
  added: number;
  alreadySaved: number;
}

interface Props {
  status: AddAllWordsStatus;
  result: AddAllWordsResult | null;
  onClick: () => void;
}

/** Kind, honest copy for whatever mix of new/known words a save produced. */
function label(status: AddAllWordsStatus, result: AddAllWordsResult | null): string {
  if (status === 'saving') return 'Adding words…';
  if (status === 'error') return 'Couldn’t add words — try again';
  if (status === 'done' && result) {
    if (result.added > 0 && result.alreadySaved > 0) {
      return `✅ ${result.added} new, ${result.alreadySaved} already saved`;
    }
    if (result.added > 0) {
      return `✅ ${result.added} word${result.added === 1 ? '' : 's'} added`;
    }
    return '✅ Already in your vocabulary';
  }
  return '➕ Add all to Words';
}

/**
 * One shared "Add all to Words" action, used during word introduction,
 * exercises, and the summary so a lesson never hides bulk-save behind
 * completion. Secondary/outline styling per DESIGN.md — the indigo "Save to
 * flashcards" per-word button and "Start Exercises" stay the loud, primary
 * actions on screen.
 */
export default function AddAllWordsButton({ status, result, onClick }: Props) {
  const done = status === 'done';
  const failed = status === 'error';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={status === 'saving' || done}
      aria-label="Add all lesson words to your vocabulary"
      className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px] border disabled:opacity-70 ${
        done
          ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
          : failed
            ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50'
          : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40'
      }`}
    >
      {label(status, result)}
    </button>
  );
}
