import type { PracticeSelection } from '../../lib/practice-selector';

export default function AdaptivePracticeNotice({
  status, error, selection,
}: {
  status: string;
  error: string;
  selection: PracticeSelection | null;
}) {
  if (status === 'loading') {
    return <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Matching practice to your vocabulary…</p>;
  }
  if (error) {
    return <p role="alert" className="text-sm text-slate-700 dark:text-slate-300">{error}</p>;
  }
  if (!selection?.limitedMatch) return null;
  return (
    <details className="text-sm text-slate-500 dark:text-slate-400">
      <summary className="min-h-[44px] cursor-pointer py-3">Limited vocabulary match · your filters are unchanged</summary>
      <ul className="list-disc ps-5 space-y-1">
        {selection.reasons.map((reason) => <li key={reason}>{reason}</li>)}
      </ul>
    </details>
  );
}
