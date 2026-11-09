import type { LexicalCoverage } from '../../lib/lexical-coverage';

export type ReaderCoverageState =
  | { status: 'loading' | 'idle' | 'error' }
  | { status: 'ready'; coverage: LexicalCoverage };

export default function CoverageSummary({ state, onRetry, errorMessage }: {
  state: ReaderCoverageState; onRetry?: () => void; errorMessage?: string;
}) {
  if (state.status !== 'ready') {
    return <div className="text-xs text-slate-500 dark:text-slate-400" role="status">
      {state.status === 'idle' ? 'Vocabulary estimate appears when this story is in view.'
        : state.status === 'loading' ? 'Estimating vocabulary coverage…'
          : errorMessage ?? 'Vocabulary estimate unavailable. You can still read this story.'}
      {state.status === 'error' && onRetry && <button type="button" onClick={onRetry}
        className="min-h-[44px] px-2 text-indigo-600 dark:text-indigo-400 underline">Retry estimate</button>}
    </div>;
  }
  const { coverage } = state;
  if (coverage.status === 'empty') {
    return <p className="text-xs text-slate-500 dark:text-slate-400">No lexical words to estimate in this text.</p>;
  }
  const percent = (value: number | null) => `${Math.round(value ?? 0)}%`;
  const approximate = coverage.mode === 'japanese-fallback' ||
    coverage.limitations.some((limitation) => limitation.includes('not verified'));
  return <div className="text-xs text-slate-600 dark:text-slate-300">
    <p>{approximate ? 'Approximate vocabulary coverage' : 'Vocabulary coverage'}{!coverage.complete ? ' · incomplete evidence' : ''}</p>
    <p>Word occurrences: {percent(coverage.occurrences.familiarPercentage)} familiar · Distinct vocabulary: {percent(coverage.distinct.familiarPercentage)} familiar</p>
    <details>
      <summary className="min-h-[44px] flex items-center cursor-pointer text-indigo-600 dark:text-indigo-400">About this estimate</summary>
      <div className="space-y-2 pb-2">
        <p>Full-text vocabulary coverage, not a guarantee of comprehension. Familiar means taught in a completed vocabulary lesson or supported by successful reviews. Saving alone does not count.</p>
        <p>Word occurrences: {coverage.occurrences.familiar}/{coverage.occurrences.total} familiar, including {coverage.occurrences.reviewBacked}/{coverage.occurrences.total} ({percent(coverage.occurrences.reviewBackedPercentage)}) review-backed.</p>
        <p>Distinct vocabulary: {coverage.distinct.familiar}/{coverage.distinct.total} familiar, including {coverage.distinct.reviewBacked}/{coverage.distinct.total} ({percent(coverage.distinct.reviewBackedPercentage)}) review-backed.</p>
        <p>Review-backed is a subset of familiar words, not an extra count: current reviews are spaced at least 21 days apart. Occurrences count repetitions; distinct vocabulary counts each normalized form once.</p>
        {coverage.limitations.map((limitation) => <p key={limitation}>{limitation}</p>)}
      </div>
    </details>
  </div>;
}
