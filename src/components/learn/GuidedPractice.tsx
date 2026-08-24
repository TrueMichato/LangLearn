import { Link } from 'react-router-dom';
import { ROUTES } from '../../lib/routes';
import type { GuidedPracticeState } from '../../hooks/useGuidedPractice';

export function GuidedPracticeError({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-8">
      <div
        role="alert"
        className="rounded-2xl border border-slate-200/70 bg-white p-4 text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
      >
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">
          Guided step unavailable
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {message}
        </p>
      </div>
      <Link
        to={ROUTES.learnCurriculum}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
      >
        Return to learning path
      </Link>
    </div>
  );
}

export function GuidedPracticeNotice({
  guided,
}: {
  guided: GuidedPracticeState;
}) {
  if (!guided.isGuided || !guided.descriptor) return null;
  return (
    <div className="rounded-2xl border border-indigo-200/70 bg-indigo-50 p-4 text-sm text-indigo-950 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-100">
      <p className="font-semibold">
        {guided.alreadyCompleted ? 'Path step already complete' : 'Guided path practice'}
      </p>
      <p className="mt-1 text-indigo-800 dark:text-indigo-200">
        This session has {guided.descriptor.session.targetItems} focused items.
        Finishing them completes the path step, whatever your score.
      </p>
    </div>
  );
}

export function GuidedCompletionActions({
  guided,
  onPracticeAgain,
}: {
  guided: GuidedPracticeState;
  onPracticeAgain: () => void;
}) {
  if (!guided.isGuided) return null;
  const saved = guided.alreadyCompleted || guided.completedNow;
  return (
    <div className="space-y-3">
      <div
        role={guided.completionError ? 'alert' : 'status'}
        className={`rounded-2xl border p-4 text-sm ${
          guided.completionError
            ? 'border-amber-200/70 bg-amber-50 text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100'
            : saved
              ? 'border-green-200/70 bg-green-50 text-green-800 dark:border-green-400/20 dark:bg-green-500/10 dark:text-green-200'
              : 'border-indigo-200/70 bg-indigo-50 text-indigo-900 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-100'
        }`}
      >
        <p className="font-semibold">
          {guided.completionError
            ? 'Path step not saved.'
            : guided.completionPending
              ? 'Saving path progress…'
              : guided.alreadyCompleted
                ? 'This path step was already complete.'
                : 'Path step complete.'}
        </p>
        <p className="mt-1">
          {guided.completionError ||
            'Your effort counts. Your score is saved here only as feedback.'}
        </p>
      </div>
      <Link
        to={ROUTES.learnCurriculum}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
      >
        Return to learning path
      </Link>
      <button
        type="button"
        onClick={onPracticeAgain}
        className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
      >
        Keep practicing
      </button>
    </div>
  );
}
