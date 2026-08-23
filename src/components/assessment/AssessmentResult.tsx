interface LessonRef {
  id: string;
  title: string;
}

interface Props {
  passed: boolean;
  score: number;
  lessons: LessonRef[];
  onRetry: () => void;
  onContinue: () => void;
  continueLabel?: string;
  onStudy: () => void;
  studyLabel?: string;
}

/**
 * The outcome screen for a test-out attempt. Kept as a pure, presentational
 * component (no fetching, no db writes) so it renders identically for a
 * single lesson or a whole range, and so its two tones — celebratory pass,
 * encouraging-not-punishing fail — can be unit tested from plain props.
 */
export default function AssessmentResult({
  passed,
  score,
  lessons,
  onRetry,
  onContinue,
  continueLabel = 'Continue',
  onStudy,
  studyLabel = 'Study the lessons',
}: Props) {
  const lessonWord = lessons.length === 1 ? 'lesson' : 'lessons';

  if (passed) {
    return (
      <div className="rounded-2xl border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950 p-5 text-center">
        <p className="text-2xl mb-1" aria-hidden="true">🎉</p>
        <p className="font-semibold text-green-800 dark:text-green-200">
          You tested out of {lessons.length} {lessonWord}! Scored {score}%.
        </p>
        <p className="mt-2 text-sm text-green-700 dark:text-green-300">
          {lessons.length === 1 ? 'It is' : 'They are'} marked complete, and whatever came next is unlocked.
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          No XP for testing out — that comes from working through lessons and reviews.
        </p>
        <button
          onClick={onContinue}
          className="mt-4 min-h-[44px] w-full rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {continueLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-800 p-5 text-center">
      <p className="text-2xl mb-1" aria-hidden="true">💪</p>
      <p className="font-semibold text-slate-800 dark:text-slate-100">
        Scored {score}% — testing out needs 80%.
      </p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Nothing changed here — your {lessonWord} {lessons.length === 1 ? 'is' : 'are'} still exactly where{' '}
        {lessons.length === 1 ? 'it was' : 'they were'}. Try again, or just work through{' '}
        {lessons.length === 1 ? 'it' : 'them'} normally — either way you'll know it well.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          onClick={onRetry}
          className="min-h-[44px] flex-1 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Try again
        </button>
        <button
          onClick={onStudy}
          className="min-h-[44px] flex-1 rounded-xl bg-slate-100 dark:bg-slate-700 px-4 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
        >
          {studyLabel}
        </button>
      </div>
    </div>
  );
}
