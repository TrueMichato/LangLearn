import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentLanguage } from '../../hooks/useCurrentLanguage';
import { getLanguageLabel } from '../../lib/languages';
import { dueCards, getSavedCards, type SavedCard } from '../../lib/study-sets';
import type { ReviewAttempt } from '../../lib/review-session';
import { reviewedGrammarLessonId } from '../../lib/grammar-review-scope';
import GrammarRefresh from './GrammarRefresh';
import LanguagePicker from '../common/LanguagePicker';
import StartingPoints from '../onboarding/StartingPoints';
import StudySets from '../words/StudySets';

interface Props {
  onStart: (attempt: ReviewAttempt) => void;
  showAll: boolean;
  onShowAll: (all: boolean) => void;
  focusSets: boolean;
}

export default function ReviewHome({ onStart, showAll, onShowAll, focusSets }: Props) {
  const { language: currentLanguage, setLanguage, options } = useCurrentLanguage();
  const navigate = useNavigate();
  const [cards, setCards] = useState<SavedCard[] | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const language = showAll ? undefined : currentLanguage;

  useEffect(() => {
    let live = true;
    getSavedCards().then((data) => { if (live) setCards(data); }).catch(() => {
      if (live) setError('Your saved cards could not be loaded. Please try again.');
    });
    return () => { live = false; };
  }, [retry]);

  useEffect(() => {
    if (focusSets && cards) document.getElementById('study-sets')?.scrollIntoView({ block: 'start' });
  }, [focusSets, cards]);

  const scoped = cards?.filter(({ word }) => !language || word.language === language) ?? [];
  const due = dueCards(scoped).length;
  const reviewedWords = scoped.map(({ word }) => word).filter((word) => reviewedGrammarLessonId(word));
  const label = language ? getLanguageLabel(language) : 'All saved languages';
  const primary = 'min-h-[44px] rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40';
  const secondary = 'min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 px-5 py-2 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Review</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <LanguagePicker options={options} value={language} allowAll onSelectAll={() => onShowAll(true)}
          onChange={(value) => { onShowAll(false); setLanguage(value); }} label="Review language" />
        {options.length < 2 && !!cards?.some(({ word }) => word.language !== currentLanguage) && (
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input type="checkbox" checked={showAll} onChange={(event) => onShowAll(event.target.checked)} className="h-5 w-5 accent-indigo-600" />
            Include all saved languages
          </label>
        )}
      </header>
      {error ? (
        <div role="alert" className="text-slate-700 dark:text-slate-200">
          <p>{error}</p>
          <button onClick={() => { setCards(null); setError(''); setRetry((value) => value + 1); }} className={secondary}>Retry loading</button>
        </div>
      ) : !cards ? <p role="status" className="text-slate-500 dark:text-slate-400">Loading reviews…</p> : !scoped.length ? (
        <StartingPoints language={currentLanguage ?? ''} onSelect={(point) => navigate(point.route)}
          heading={cards.length ? `No saved cards for ${label} yet` : 'Your first reviews start with a lesson'}
          description="Learn a little first. The cards you save will be here whenever you want to practise." />
      ) : (
        <section aria-labelledby="review-start-heading" className="space-y-3 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-800/90 p-4">
          <h2 id="review-start-heading" className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {due ? `${due} card${due === 1 ? '' : 's'} ready for review` : "You're all caught up"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {due ? 'Scheduled reviews help you remember at the right time.' : 'Nothing is due right now. You can still revisit your saved cards.'}
          </p>
          <div className="flex flex-col gap-2">
            {due > 0 && <button className={primary}
              onClick={() => onStart({ kind: 'scheduled', source: { type: 'library', language }, label })}>Start due reviews</button>}
            <button className={due ? secondary : primary}
              onClick={() => onStart({ kind: 'practice', source: { type: 'library', language }, label })}>Practice anytime</button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Practice won't change your review dates. {scoped.length} saved card{scoped.length === 1 ? '' : 's'} available.</p>
        </section>
      )}
      {reviewedWords.length > 0 && <GrammarRefresh words={reviewedWords} />}
      {cards && <StudySets language={language} onStart={onStart} />}
    </div>
  );
}
