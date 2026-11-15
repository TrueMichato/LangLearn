import { useEffect, useState } from 'react';
import { reviewScopeLabel, type ReviewAttempt } from '../../lib/review-session';
import { loadReviewCompletionCounts, reviewCompletionMessage, type ReviewCompletionState } from '../../lib/review-completion';

interface Props {
  attempt: ReviewAttempt;
  cardsReviewed: number;
  onStart: (attempt: ReviewAttempt) => void;
  onExit: () => void;
  empty?: boolean;
}

export default function ReviewSummary({ attempt, cardsReviewed, onStart, onExit, empty = false }: Props) {
  const [counts, setCounts] = useState<ReviewCompletionState>({ status: 'loading' });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let live = true;
    loadReviewCompletionCounts(attempt.source).then((value) => {
      if (live) setCounts(value);
    }).catch((failure: unknown) => {
      if (live) setCounts({ status: 'error', message: failure instanceof Error ? failure.message : 'The remaining cards could not be loaded.' });
    });
    return () => { live = false; };
  }, [attempt, retry]);

  return <ReviewSummaryContent attempt={attempt} cardsReviewed={cardsReviewed} onStart={onStart} onExit={onExit}
    empty={empty} counts={counts} onRetry={() => { setCounts({ status: 'loading' }); setRetry((value) => value + 1); }} />;
}

export function ReviewSummaryContent({ attempt, cardsReviewed, onStart, onExit, empty = false, counts, onRetry }: Props & {
  counts: ReviewCompletionState;
  onRetry: () => void;
}) {
  const practice = attempt.kind === 'practice';
  const curated = attempt.source.type === 'mistakes' || attempt.source.type === 'topic';
  const title = empty ? practice ? 'No cards available in this source' : 'No reviews available in this source'
    : practice ? 'Practice complete' : 'Review batch finished';
  const primary = 'w-full min-h-[44px] rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700';
  const secondary = 'w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 px-5 py-2 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700';

  return (
    <div className="space-y-5 py-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
        <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">{attempt.label}</p>
        {attempt.label !== reviewScopeLabel(attempt.source) && <p className="text-xs text-slate-500 dark:text-slate-400">{reviewScopeLabel(attempt.source)}</p>}
        {!empty && <p className="mt-3 text-slate-700 dark:text-slate-200">{cardsReviewed} answer{cardsReviewed === 1 ? '' : 's'} given. Great effort!</p>}
        {practice && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Your review dates are unchanged.</p>}
      </div>
      <button onClick={onExit} className={primary}>Done for now</button>
      {counts.status === 'error' ? <div role="alert" className="space-y-2 text-sm text-slate-700 dark:text-slate-200"><p>{counts.message}</p>
        <button onClick={onRetry} className={secondary}>Retry loading</button></div>
        : counts.status === 'loading' ? <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Checking remaining cards…</p> : (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Want to do more? It’s optional.</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{reviewCompletionMessage(attempt, counts)}</p>
            {!practice && counts.remaining > 0 && <button className={secondary} onClick={() => onStart(attempt)}>
              {curated ? 'Review this focused deck again' : `Review remaining (${counts.remaining})`}
            </button>}
            {counts.available > 0 && <button className={secondary}
              onClick={() => onStart({ ...attempt, kind: 'practice' })}>{practice ? 'Practice another batch' : 'Practise this source anytime'}</button>}
            {!counts.available && <p className="text-sm text-slate-500 dark:text-slate-400">
              No cards remain in this source. Choose another set on Review{attempt.source.type === 'set' ? ', or edit this set’s words and language scope' : ''}.
            </p>}
          </div>
        )}
    </div>
  );
}
