import { useState, useEffect, useCallback } from 'react';
import SearchBar from '../components/common/SearchBar';
import { searchWords, updateWord, deleteWord, type WordFilter } from '../db/words';
import { db, type Word, type Review } from '../db/schema';
import { useSettingsStore } from '../stores/settingsStore';
import AddWordModal from '../components/srs/AddWordModal';
import { getLanguageLabel, getLanguageFlag } from '../lib/languages';
import { SkeletonList } from '../components/common/Skeleton';
import StudySets from '../components/words/StudySets';
import { getFrequencyRank, getFrequencyTier, getFrequencyLabel, type FrequencyTier } from '../data/frequency';

type StatusFilter = 'all' | 'learning' | 'mature' | 'due';

interface WordRow {
  word: Word;
  review: Review;
}

const LANG_COLORS: Record<string, string> = {
  ja: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  ru: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  zh: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ko: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  es: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

function langColor(lang: string) {
  return LANG_COLORS[lang] ?? 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isDue(nextReviewDate: string) {
  return nextReviewDate <= new Date().toISOString();
}

function EaseDots({ ease }: { ease: number }) {
  // red < 2.0, yellow 2.0–2.7, green > 2.7
  const color = (threshold: number) => {
    if (ease >= threshold) return 'bg-emerald-400 dark:bg-emerald-500';
    if (ease >= threshold - 0.7) return 'bg-amber-400 dark:bg-amber-500';
    return 'bg-red-400 dark:bg-red-500';
  };
  return (
    <span className="inline-flex gap-0.5" title={`Ease: ${ease.toFixed(2)}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ease >= 1.5 ? color(1.5) : 'bg-slate-300 dark:bg-slate-600'}`} />
      <span className={`w-1.5 h-1.5 rounded-full ${ease >= 2.2 ? color(2.2) : 'bg-slate-300 dark:bg-slate-600'}`} />
      <span className={`w-1.5 h-1.5 rounded-full ${ease >= 2.8 ? color(2.8) : 'bg-slate-300 dark:bg-slate-600'}`} />
    </span>
  );
}

const TIER_COLORS: Record<FrequencyTier, string> = {
  essential: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200',
  common: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200',
  intermediate: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200',
  advanced: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200',
  unknown: '',
};

function FrequencyBadge({ word, language }: { word: string; language: string }) {
  const rank = getFrequencyRank(word, language);
  const tier = getFrequencyTier(rank);
  if (tier === 'unknown') return null;
  const label = getFrequencyLabel(tier);
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[tier]}`}>
      {label}
    </span>
  );
}

export default function WordsPage() {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<WordFilter['sortBy']>('createdAt');
  const [sortDir, setSortDir] = useState<WordFilter['sortDir']>('desc');
  const [results, setResults] = useState<WordRow[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ word: '', reading: '', meaning: '', tags: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const filter: WordFilter = {
      language,
      search: search || undefined,
      status: status === 'all' ? undefined : status,
      sortBy,
      sortDir,
    };
    const data = await searchWords(filter);
    setResults(data);
    setLoading(false);
  }, [language, search, status, sortBy, sortDir]);

  useEffect(() => { load(); }, [load]);

  function startEdit(row: WordRow) {
    setEditingId(row.word.id!);
    setEditForm({
      word: row.word.word,
      reading: row.word.reading,
      meaning: row.word.meaning,
      tags: row.word.tags.join(', '),
    });
  }

  async function saveEdit(id: number) {
    await updateWord(id, {
      word: editForm.word,
      reading: editForm.reading,
      meaning: editForm.meaning,
      tags: editForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setEditingId(null);
    load();
  }

  async function handleDelete(id: number) {
    await deleteWord(id);
    setDeleteConfirmId(null);
    setExpandedId(null);
    load();
  }

  async function resetProgress(wordId: number) {
    const review = await db.reviews.where('wordId').equals(wordId).first();
    if (review) {
      await db.reviews.update(review.id!, {
        ease: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: new Date().toISOString(),
      });
    }
    load();
  }

  const chipBase =
    'px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer select-none press-feedback';
  const chipActive = 'bg-indigo-600 text-white';
  const chipInactive =
    'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600';

  return (
    <div className="p-4 max-w-lg mx-auto pb-24 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Words</h1>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {results.length} word{results.length !== 1 ? 's' : ''}
        </span>
      </div>

      <StudySets />

      <SearchBar value={search} onChange={setSearch} placeholder="Search words…" />

      {/* Language chips */}
      <div className="flex flex-wrap gap-2">
        <button
          className={`${chipBase} ${!language ? chipActive : chipInactive}`}
          onClick={() => setLanguage(undefined)}
        >
          All
        </button>
        {activeLanguages.map((lang) => (
          <button
            key={lang}
            className={`${chipBase} ${language === lang ? chipActive : chipInactive}`}
            onClick={() => setLanguage(lang === language ? undefined : lang)}
          >
            {getLanguageLabel(lang)}
          </button>
        ))}
      </div>

      {/* Status chips + sort */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'learning', 'mature', 'due'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            className={`${chipBase} ${status === s ? chipActive : chipInactive}`}
            onClick={() => setStatus(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <select
          value={`${sortBy}-${sortDir}`}
          onChange={(e) => {
            const [sb, sd] = e.target.value.split('-');
            setSortBy(sb as WordFilter['sortBy']);
            setSortDir(sd as WordFilter['sortDir']);
          }}
          className="ml-auto text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300"
        >
          <option value="createdAt-desc">Newest</option>
          <option value="createdAt-asc">Oldest</option>
          <option value="word-asc">A → Z</option>
          <option value="word-desc">Z → A</option>
          <option value="nextReview-asc">Due soonest</option>
          <option value="frequency-asc">Frequency</option>
        </select>
      </div>

      {/* Word list */}
      {loading ? (
        <SkeletonList count={5} />
      ) : results.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-2">📚✨</p>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            No words yet! Start building your vocabulary.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors press-feedback"
          >
            Add your first words!
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map(({ word, review }) => {
            const isExpanded = expandedId === word.id;
            const isEditing = editingId === word.id;

            return (
              <div
                key={word.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                {/* Collapsed row */}
                <button
                  className="w-full text-left p-3 flex items-start gap-3 press-feedback"
                  onClick={() => setExpandedId(isExpanded ? null : word.id!)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm mr-0.5">{getLanguageFlag(word.language)}</span>
                      <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {word.word}
                      </span>
                      {word.reading && (
                        <span className="text-sm text-slate-400 dark:text-slate-500">
                          {word.reading}
                        </span>
                      )}
                      <EaseDots ease={review.ease} />
                      <FrequencyBadge word={word.word} language={word.language} />
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 truncate">
                      {word.meaning}
                    </div>
                    {word.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {word.tags.map((t) => (
                          <span
                            key={t}
                            className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${langColor(word.language)}`}>
                      {word.language.toUpperCase()}
                    </span>
                    {isDue(review.nextReviewDate) ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                        Due now
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDate(review.nextReviewDate)}
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded section */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-700 p-3 space-y-3">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                          value={editForm.word}
                          onChange={(e) => setEditForm((f) => ({ ...f, word: e.target.value }))}
                          placeholder="Word"
                        />
                        <input
                          className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                          value={editForm.reading}
                          onChange={(e) => setEditForm((f) => ({ ...f, reading: e.target.value }))}
                          placeholder="Reading"
                        />
                        <input
                          className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                          value={editForm.meaning}
                          onChange={(e) => setEditForm((f) => ({ ...f, meaning: e.target.value }))}
                          placeholder="Meaning"
                        />
                        <input
                          className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                          value={editForm.tags}
                          onChange={(e) => setEditForm((f) => ({ ...f, tags: e.target.value }))}
                          placeholder="Tags (comma-separated)"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(word.id!)}
                            className="px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 press-feedback"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm press-feedback"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {word.contextSentence && (
                          <div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              Context
                            </span>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {word.contextSentence}
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <div>
                            <div className="font-medium">Ease</div>
                            <div>{review.ease.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="font-medium">Interval</div>
                            <div>{review.interval}d</div>
                          </div>
                          <div>
                            <div className="font-medium">Added</div>
                            <div>{formatDate(word.createdAt)}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => startEdit({ word, review })}
                            className="px-3 py-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-sm hover:bg-indigo-200 dark:hover:bg-indigo-800 press-feedback"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => resetProgress(word.id!)}
                            className="px-3 py-1 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-sm hover:bg-amber-200 dark:hover:bg-amber-800 press-feedback"
                          >
                            Reset progress
                          </button>
                          {deleteConfirmId === word.id ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-red-600 dark:text-red-400">Delete?</span>
                              <button
                                onClick={() => handleDelete(word.id!)}
                                className="px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700 press-feedback"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs press-feedback"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(word.id!)}
                              className="px-3 py-1 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-sm hover:bg-red-200 dark:hover:bg-red-800 press-feedback"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-indigo-600 text-white text-2xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center z-40 press-feedback"
        aria-label="Add word"
      >
        +
      </button>

      <AddWordModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); load(); }}
      />
    </div>
  );
}
