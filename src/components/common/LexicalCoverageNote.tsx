import type { LexicalCoverage } from '../../lib/lexical-coverage';

export default function LexicalCoverageNote({ coverage }: { coverage: LexicalCoverage }) {
  const percent = (value: number | null) => value === null ? 'not available' : `${Math.round(value)}%`;
  return (
    <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
      <p>Familiar word occurrences: {percent(coverage.occurrences.familiarPercentage)}
        {' · '}Distinct vocabulary: {percent(coverage.distinct.familiarPercentage)}.</p>
      <details>
        <summary className="min-h-[44px] cursor-pointer py-3">About this vocabulary estimate</summary>
        <p>{coverage.occurrences.familiar}/{coverage.occurrences.total} occurrences and{' '}
          {coverage.distinct.familiar}/{coverage.distinct.total} distinct words are familiar.</p>
        <p>Including {percent(coverage.occurrences.reviewBackedPercentage)} review-backed occurrences
          and {percent(coverage.distinct.reviewBackedPercentage)} review-backed distinct vocabulary.
          {' '}Vocabulary estimate, not guaranteed comprehension.</p>
        {coverage.limitations.map((limit) => <p key={limit}>{limit}</p>)}
      </details>
    </div>
  );
}
