import { useEffect, useMemo, useState } from 'react';
import type { CaptureCandidate } from '../../lib/lesson-capture';
import { findSavedCandidates, saveCandidates } from '../../db/lesson-cards';
import { rtlProps } from '../../lib/rtl';

interface LessonCaptureModalProps {
  candidates: CaptureCandidate[];
  language: string;
  lessonId: string;
  onClose: () => void;
  onSaved: (count: number) => void;
}

/**
 * Pick which of a lesson's terms to add to the vocabulary deck.
 *
 * Saving one word at a time from a lesson meant a learner had to click through
 * dozens of ➕ buttons, and gave no view of what was already saved. Terms
 * already in the deck are shown as saved and cannot be selected, so re-opening
 * a lesson never creates duplicates.
 */
export default function LessonCaptureModal({
  candidates,
  language,
  lessonId,
  onClose,
  onSaved,
}: LessonCaptureModalProps) {
  const [savedIds, setSavedIds] = useState<Set<string> | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    findSavedCandidates(candidates, language).then((saved) => {
      if (!active) return;
      setSavedIds(saved);
      setSelected(new Set(candidates.filter((c) => !saved.has(c.id)).map((c) => c.id)));
    });
    return () => {
      active = false;
    };
  }, [candidates, language]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const available = useMemo(
    () => candidates.filter((c) => !savedIds?.has(c.id)),
    [candidates, savedIds],
  );
  const allSelected = available.length > 0 && selected.size === available.length;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(available.map((c) => c.id)));
  };

  const handleSave = async () => {
    if (saving || selected.size === 0) return;
    setSaving(true);
    try {
      const count = await saveCandidates(
        candidates.filter((c) => selected.has(c.id)),
        language,
        lessonId,
      );
      onSaved(count);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-capture-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-800 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-200/70 dark:border-white/10">
          <div>
            <h2 id="lesson-capture-title" className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Save vocabulary from this lesson
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {savedIds === null
                ? 'Checking your deck…'
                : `${selected.size} of ${available.length} selected`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="min-h-[44px] min-w-[44px] -mt-2 -mr-2 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            ✕
          </button>
        </div>

        {savedIds !== null && available.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-200/70 dark:border-white/10">
            <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 accent-indigo-600"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {allSelected ? 'Deselect all' : 'Select all'}
              </span>
            </label>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {savedIds !== null && available.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
              Everything from this lesson is already in your deck. Nice work.
            </p>
          )}

          <ul className="divide-y divide-slate-200/70 dark:divide-white/10">
            {candidates.map((candidate) => {
              const alreadySaved = savedIds?.has(candidate.id) ?? false;
              return (
                <li key={candidate.id}>
                  <label
                    className={`flex items-start gap-3 py-2 min-h-[44px] ${
                      alreadySaved ? 'opacity-60' : 'cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={alreadySaved || selected.has(candidate.id)}
                      disabled={alreadySaved || savedIds === null}
                      onChange={() => toggle(candidate.id)}
                      aria-label={`Save ${candidate.word}`}
                      className="mt-1.5 w-4 h-4 accent-indigo-600"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block text-slate-800 dark:text-slate-100 font-medium break-words"
                        {...rtlProps(language)}
                      >
                        {candidate.word}
                      </span>
                      {candidate.reading && (
                        <span className="block text-xs text-slate-500 dark:text-slate-400 italic">
                          {candidate.reading}
                        </span>
                      )}
                      <span className="block text-sm text-slate-600 dark:text-slate-300">
                        {candidate.meaning}
                      </span>
                    </span>
                    {alreadySaved && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 mt-1.5">
                        Saved
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="p-4 border-t border-slate-200/70 dark:border-white/10">
          <button
            onClick={handleSave}
            disabled={saving || selected.size === 0}
            className="w-full min-h-[44px] rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {saving ? 'Saving…' : `Save ${selected.size} word${selected.size === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
