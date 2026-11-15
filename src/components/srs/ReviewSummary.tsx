import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReviewCandidates, reviewScopeLabel, type ReviewAttempt } from '../../lib/review-session';
import { getStudySuggestions, type StudySuggestion } from '../../lib/study-suggestions';
import { useSettingsStore } from '../../stores/settingsStore';

interface Props {
  attempt: ReviewAttempt;
  cardsReviewed: number;
  onStart: (attempt: ReviewAttempt) => void;
  onExit: () => void;
  empty?: boolean;
}

export default function ReviewSummary({ attempt, cardsReviewed, onStart, onExit, empty = false }: Props) {
  const [counts, setCounts] = useState<{ remaining: number; available: number } | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [nextUp, setNextUp] = useState<StudySuggestion | null>(null);
  const navigate = useNavigate();
  const curated = attempt.source.type === 'mistakes' || attempt.source.type === 'topic';

  useEffect(() => {
    let live = true;
    Promise.all([
      getReviewCandidates('scheduled', attempt.source),
      getReviewCandidates('practice', attempt.source),
    ]).then(([remaining, available]) => {
      if (live) setCounts({ remaining: remaining.length, available: available.length });
    }).catch((failure: unknown) => {
      if (live) setError(failure instanceof Error ? failure.message : 'The remaining cards could not be loaded.');
    });
    getStudySuggestions(useSettingsStore.getState().activeLanguages).then((suggestions) => {
      if (live) setNextUp(suggestions.filter((suggestion) => !suggestion.route.startsWith('/review'))
        .sort((a, b) => b.priority - a.priority)[0] ?? null);
    }).catch(() => { /* Next steps are optional; session counts are not. */ });
    return () => { live = false; };
  }, [attempt, retry]);

  const practice = attempt.kind === 'practice';
  const title = empty ? practice ? 'No cards available in this source' : 'No reviews available in this source'
    : practice ? 'Practice complete' : counts?.remaining ? 'Review batch finished' : counts ? curated ? 'Review batch finished' : 'All due reviews done' : 'Review batch finished';
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
      {error ? <div role="alert" className="text-sm text-slate-700 dark:text-slate-200"><p>{error}</p>
        <button onClick={() => { setError(''); setCounts(null); setRetry((value) => value + 1); }} className={secondary}>Retry loading</button></div>
        : !counts ? <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Checking remaining cards…</p> : (
          <div className="space-y-3">
            {!practice && <p className="text-sm text-slate-500 dark:text-slate-400">
              {curated ? `${counts.remaining} ${counts.remaining === 1 ? 'card remains' : 'cards remain'} in this focused deck.`
                : counts.remaining ? `${counts.remaining} due ${counts.remaining === 1 ? 'card remains' : 'cards remain'} in this scope.`
                  : 'Nothing else is due in this scope right now.'}
            </p>}
            {!practice && counts.remaining > 0 && <button className={primary} onClick={() => onStart(attempt)}>
              {curated ? 'Continue focused reviews' : `Review remaining (${counts.remaining})`}
            </button>}
            {counts.available > 0 && <button className={practice || !counts.remaining ? primary : secondary}
              onClick={() => onStart({ ...attempt, kind: 'practice' })}>{practice ? 'Practice another batch' : 'Practise this source anytime'}</button>}
            {!counts.available && <p className="text-sm text-slate-500 dark:text-slate-400">
              No cards remain in this source. Choose another set on Review{attempt.source.type === 'set' ? ', or edit this set’s words and language scope' : ''}.
            </p>}
          </div>
        )}
      <button onClick={onExit} className={secondary}>Back to Review</button>
      {nextUp && <button onClick={() => navigate(nextUp.route)}
        className="min-h-[44px] text-left text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Next up: {nextUp.title} →</button>}
    </div>
  );
}
