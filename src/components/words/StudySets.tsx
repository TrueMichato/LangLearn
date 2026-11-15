import { useState, useEffect } from 'react';
import { useStudySetsStore, type StudySet } from '../../stores/studySetsStore';
import { dueCards, getWordsForSet } from '../../lib/study-sets';
import { getLanguageLabel } from '../../lib/languages';
import type { ReviewAttempt } from '../../lib/review-session';
import SetModal from './SetModal';

interface SetCounts {
  set: StudySet;
  available: number;
  due: number;
}

interface Props {
  language?: string;
  onStart: (attempt: ReviewAttempt) => void;
}

export default function StudySets({ language, onStart }: Props) {
  const { sets, deleteSet, ensureDefaults } = useStudySetsStore();
  const [showModal, setShowModal] = useState(false);
  const [editingSet, setEditingSet] = useState<StudySet>();
  const [loaded, setLoaded] = useState<{ data: SetCounts[]; sets: StudySet[]; language?: string; retry: number } | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve().then(ensureDefaults).catch(() => {
      setError('Study sets could not be saved on this device. Please try again.');
    });
  }, [ensureDefaults, retry]);

  useEffect(() => {
    let live = true;
    Promise.all(sets.map(async (set) => {
      const cards = await getWordsForSet(set, language);
      return { set, available: cards.length, due: dueCards(cards).length };
    })).then((data) => { if (live) setLoaded({ data, sets, language, retry }); }).catch(() => {
      if (live) setError('Study-set counts could not be loaded. Please try again.');
    });
    return () => { live = false; };
  }, [sets, language, retry]);

  function renderRow({ set, available, due }: SetCounts) {
    const scope = language ? getLanguageLabel(language) : set.language ? getLanguageLabel(set.language) : 'All languages';
    const mismatched = !!language && !!set.language && language !== set.language;
    const dueOnly = set.smartFilter === 'due-today';
    return (
      <li key={set.id} className="py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="break-words font-semibold text-slate-800 dark:text-slate-100">{set.name}</h3>
            {set.description && <p className="break-words text-sm text-slate-500 dark:text-slate-400">{set.description}</p>}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {set.type === 'custom' ? set.selectionMode === 'manual' ? 'Selected words' : 'Tag rules' : 'Smart set'} · {scope}
            </p>
          </div>
          {set.type === 'custom' && (
            <button onClick={() => { setEditingSet(set); setShowModal(true); }} aria-label={`Edit ${set.name}`}
              className="min-h-[44px] shrink-0 rounded-xl px-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700">Edit</button>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{available} available · {due} due</p>
        {!available && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {mismatched ? `This set is for ${getLanguageLabel(set.language!)}. Switch language above or choose All languages.`
            : dueOnly ? 'Nothing is due in this set. Choose another set to practise anytime.'
              : set.type === 'custom' ? 'No available cards. Edit this set to choose saved words or tags.' : 'No matching cards yet. Try another set.'}
        </p>}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <button disabled={!available || countsLoading} onClick={() => onStart({ kind: 'practice', source: { type: 'set', setId: set.id, language: language || set.language }, label: set.name })}
            className="min-h-[44px] rounded-xl px-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
            {dueOnly ? 'Practise due cards' : 'Practise set'}
          </button>
          <button disabled={!due || countsLoading} onClick={() => onStart({ kind: 'scheduled', source: { type: 'set', setId: set.id, language: language || set.language }, label: set.name })}
            className="min-h-[44px] rounded-xl px-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
            Review due ({due})
          </button>
          {set.type === 'custom' && (deleteConfirmId === set.id ? (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-sm text-slate-500 dark:text-slate-400">Delete set?</span>
              <button onClick={() => {
                try { deleteSet(set.id); setDeleteConfirmId(null); }
                catch { setError('This set could not be deleted on this device. Please try again.'); }
              }} className="min-h-[44px] rounded-xl px-3 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
              <button onClick={() => setDeleteConfirmId(null)} className="min-h-[44px] rounded-xl px-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">Keep set</button>
            </div>
          ) : (
            <button onClick={() => setDeleteConfirmId(set.id)} aria-label={`Delete ${set.name}`}
              className="min-h-[44px] rounded-xl px-3 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">Delete</button>
          ))}
        </div>
      </li>
    );
  }

  const countsLoading = loaded?.sets !== sets || loaded?.language !== language || loaded?.retry !== retry;
  const counts = loaded?.data ?? null;
  const custom = counts?.filter(({ set }) => set.type === 'custom') ?? [];
  const smart = counts?.filter(({ set }) => set.type === 'smart') ?? [];

  return (
    <section id="study-sets" aria-labelledby="study-sets-heading" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 id="study-sets-heading" className="text-lg font-semibold text-slate-800 dark:text-slate-100">Study sets</h2>
        <button onClick={() => { setEditingSet(undefined); setShowModal(true); }}
          className="min-h-[44px] rounded-xl px-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700">Create set</button>
      </div>
      {error && <div role="alert" className="text-sm text-slate-700 dark:text-slate-200">
        <p>{error}</p>
        <button onClick={() => { setError(''); setRetry((value) => value + 1); }} className="min-h-[44px] px-3 text-indigo-600 dark:text-indigo-400 hover:underline">Retry</button>
      </div>}
      {countsLoading && !error && <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Loading sets…</p>}
      {counts && (
        <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-800/90 px-4">
          {custom.length ? <ul className="divide-y divide-slate-200 dark:divide-white/10">{custom.slice(0, 4).map(renderRow)}</ul>
            : <p className="py-3 text-sm text-slate-500 dark:text-slate-400">Pick saved words or use tag rules to make a set of your own.</p>}
          {custom.length > 4 && <details className="border-t border-slate-200 dark:border-white/10">
            <summary className="min-h-[44px] cursor-pointer py-3 text-sm font-medium text-slate-700 dark:text-slate-200">More sets ({custom.length - 4})</summary>
            <ul className="divide-y divide-slate-200 dark:divide-white/10">{custom.slice(4).map(renderRow)}</ul>
          </details>}
          <details className="border-t border-slate-200 dark:border-white/10">
            <summary className="min-h-[44px] cursor-pointer py-3 text-sm font-medium text-slate-700 dark:text-slate-200">Smart sets ({smart.length})</summary>
            <ul className="divide-y divide-slate-200 dark:divide-white/10">{smart.map(renderRow)}</ul>
          </details>
        </div>
      )}
      <SetModal isOpen={showModal} editingSet={editingSet} onClose={() => { setShowModal(false); setEditingSet(undefined); }} />
    </section>
  );
}
