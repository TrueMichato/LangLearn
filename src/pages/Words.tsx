import { useState, useEffect, useCallback } from 'react';
import SearchBar from '../components/common/SearchBar';
import { searchWords, updateWord, deleteWord, type WordFilter } from '../db/words';
import { db, type Word, type Review } from '../db/schema';
import { useSettingsStore } from '../stores/settingsStore';

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
  return LANG_COLORS[lang] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isDue(nextReviewDate: string) {
  return nextReviewDate <= new Date().toISOString();
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
    'px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer select-none';
  const chipActive = 'bg-indigo-600 text-white';
  const chipInactive =
    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';

  return (
    <div className="p-4 max-w-lg mx-auto pb-24 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Words</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {results.length} word{results.length !== 1 ? 's' : ''}
        </span>
      </div>

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
            {lang.toUpperCase()}
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
          className="ml-auto text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300"
        >
          <option value="createdAt-desc">Newest</option>
          <option value="createdAt-asc">Oldest</option>
          <option value="word-asc">A → Z</option>
          <option value="word-desc">Z → A</option>
          <option value="nextReview-asc">Due soonest</option>
        </select>
      </div>

      {/* Word list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Loading…</div>
      ) : results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-gray-500 dark:text-gray-400">
            No words yet! Head to the Reader to start building your vocabulary.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map(({ word, review }) => {
            const isExpanded = expandedId === word.id;
            const isEditing = editingId === word.id;

            return (
              <div
                key={word.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Collapsed row */}
                <button
                  className="w-full text-left p-3 flex items-start gap-3"
                  onClick={() => setExpandedId(isExpanded ? null : word.id!)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {word.word}
                      </span>
                      {word.reading && (
                        <span className="text-sm text-gray-400 dark:text-gray-500">
                          {word.reading}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {word.meaning}
                    </div>
                    {word.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {word.tags.map((t) => (
                          <span
                            key={t}
                            className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
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
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(review.nextReviewDate)}
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded section */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-3 space-y-3">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          value={editForm.word}
                          onChange={(e) => setEditForm((f) => ({ ...f, word: e.target.value }))}
                          placeholder="Word"
                        />
                        <input
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          value={editForm.reading}
                          onChange={(e) => setEditForm((f) => ({ ...f, reading: e.target.value }))}
                          placeholder="Reading"
                        />
                        <input
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          value={editForm.meaning}
                          onChange={(e) => setEditForm((f) => ({ ...f, meaning: e.target.value }))}
                          placeholder="Meaning"
                        />
                        <input
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          value={editForm.tags}
                          onChange={(e) => setEditForm((f) => ({ ...f, tags: e.target.value }))}
                          placeholder="Tags (comma-separated)"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(word.id!)}
                            className="px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {word.contextSentence && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Context
                            </span>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {word.contextSentence}
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400">
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
                            className="px-3 py-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-sm hover:bg-indigo-200 dark:hover:bg-indigo-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => resetProgress(word.id!)}
                            className="px-3 py-1 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-sm hover:bg-amber-200 dark:hover:bg-amber-800"
                          >
                            Reset progress
                          </button>
                          {deleteConfirmId === word.id ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-red-600 dark:text-red-400">Delete?</span>
                              <button
                                onClick={() => handleDelete(word.id!)}
                                className="px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(word.id!)}
                              className="px-3 py-1 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-sm hover:bg-red-200 dark:hover:bg-red-800"
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
    </div>
  );
}
