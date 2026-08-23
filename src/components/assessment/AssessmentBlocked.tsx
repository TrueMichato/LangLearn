interface LessonRef {
  id: string;
  title: string;
}

interface Props {
  missingLessons: LessonRef[];
  onBack: () => void;
  backLabel?: string;
}

/**
 * Shown when the coverage guarantee can't be met — at least one lesson in
 * the requested range has no assessable content (no vocab words, or no quiz
 * blocks in its grammar markdown). Testing out anyway would mark that lesson
 * complete without ever actually checking the learner knows it, so the
 * attempt is refused rather than silently skipping the gap.
 */
export default function AssessmentBlocked({
  missingLessons,
  onBack,
  backLabel = 'Back to lessons',
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-800 p-5 text-center">
      <p className="text-2xl mb-1" aria-hidden="true">🤔</p>
      <h2 className="font-semibold text-slate-800 dark:text-slate-100">
        This range isn’t ready to check yet
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {missingLessons.length === 1
          ? `"${missingLessons[0].title}" doesn't have enough content to confirm you know it yet.`
          : `${missingLessons.length} lessons in this range don't have enough content to confirm you know them yet.`}{' '}
        Try a shorter range, or complete {missingLessons.length === 1 ? 'it' : 'them'} normally.
      </p>
      <button
        onClick={onBack}
        className="mt-4 min-h-[44px] w-full rounded-xl bg-slate-100 dark:bg-slate-700 px-4 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
      >
        ← {backLabel}
      </button>
    </div>
  );
}
