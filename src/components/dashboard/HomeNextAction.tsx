import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadHomeLearningState, resolveHomePrimaryAction, type HomeLearningState } from '../../lib/home-primary-action';

interface Props {
  dueCards: number;
  language: string | undefined;
}

export function HomeActionPanel({ dueCards, language, learning, onRetry }: Props & {
  learning: HomeLearningState;
  onRetry: () => void;
}) {
  const action = resolveHomePrimaryAction({ dueCards, language, learning });
  const saved = dueCards > 0 ? resolveHomePrimaryAction({ dueCards: 0, language, learning }) : null;
  const secondary = 'min-h-[44px] rounded-xl px-2 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700';

  return (
    <section aria-labelledby="home-next-step" className="mb-6 rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-white/10 dark:bg-slate-800/90">
      <h1 id="home-next-step" className="break-words text-xl font-bold text-slate-800 dark:text-slate-100">{action.title}</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400" role={action.kind === 'loading' ? 'status' : undefined}>{action.description}</p>
      {action.route && <Link to={action.route}
        className="mt-4 flex min-h-[44px] items-center justify-center rounded-xl bg-indigo-600 px-5 py-2 text-center font-semibold text-white transition-colors hover:bg-indigo-700">
        {action.label}
      </Link>}
      {action.kind === 'error' && <div role="alert">
        <button onClick={onRetry} className={`${secondary} mt-3`}>Retry loading your next step</button>
      </div>}
      {saved?.kind === 'resume' && (
        <div className="mt-4 border-t border-slate-200/70 pt-3 dark:border-white/10">
          <p className="break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{saved.title}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{saved.description}</p>
          <Link to={saved.route!} className={`${secondary} mt-1 inline-flex items-center`}>{saved.label}</Link>
        </div>
      )}
      {saved?.kind === 'loading' && <p role="status" className="mt-3 text-sm text-slate-500 dark:text-slate-400">Checking your saved lesson…</p>}
      {saved?.kind === 'error' && <div role="alert" className="mt-3 text-sm text-slate-700 dark:text-slate-200">
        <p>Your saved lesson or learning path could not be checked.</p>
        <button onClick={onRetry} className={secondary}>Retry loading your next step</button>
      </div>}
      {dueCards === 0 && action.kind !== 'loading' && action.kind !== 'error' && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">No reviews are due right now.</p>
      )}
    </section>
  );
}

export default function HomeNextAction({ dueCards, language }: Props) {
  const [learning, setLearning] = useState<HomeLearningState>({ status: 'loading' });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!language) return;
    let live = true;
    let revision = 0;
    const load = () => {
      const request = ++revision;
      loadHomeLearningState(language).then((value) => {
        if (live && request === revision) setLearning(value);
      }).catch(() => {
        if (live && request === revision) setLearning({ status: 'error' });
      });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        setLearning({ status: 'loading' });
        load();
      }
    };
    load();
    document.addEventListener('visibilitychange', onVisibility);
    return () => { live = false; document.removeEventListener('visibilitychange', onVisibility); };
  }, [language, retry]);

  return <HomeActionPanel dueCards={dueCards} language={language} learning={learning}
    onRetry={() => { setLearning({ status: 'loading' }); setRetry((value) => value + 1); }} />;
}
