import { useState, useEffect } from 'react';
import type { Text } from '../../db/schema';
import { getAllTexts, deleteText } from '../../db/texts';
import { relativeDate } from '../../lib/dates';
import { getLanguageLabel } from '../../lib/languages';
import { useSettingsStore } from '../../stores/settingsStore';

const LANGUAGE_COLORS: Record<string, string> = {
  ja: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  ru: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  en: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  es: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  fr: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  de: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  zh: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  ko: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  pt: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
  medium: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
  hard: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
};

export interface CuratedText {
  id: string;
  title: string;
  titleEn: string;
  difficulty: 'easy' | 'medium' | 'hard';
  wordCount: number;
  tags: string[];
  description: string;
}

type SubTab = 'my-texts' | 'curated';
type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

function userWordCount(content: string, language: string): number {
  const cjkLangs = ['ja', 'zh', 'ko'];
  if (cjkLangs.includes(language)) {
    return content.replace(/\s/g, '').length;
  }
  return content.split(/\s+/).filter(Boolean).length;
}

interface TextLibraryProps {
  onSelectText: (text: Text) => void;
  onSelectCurated?: (id: string, language: string, title: string) => void;
}

export default function TextLibrary({ onSelectText, onSelectCurated }: TextLibraryProps) {
  const [subTab, setSubTab] = useState<SubTab>('curated');
  const [texts, setTexts] = useState<Text[]>([]);
  const [filterLang, setFilterLang] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Curated library state
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const curatedLangs = activeLanguages.filter((l) => ['ja', 'ru', 'pt', 'es', 'ar'].includes(l));
  const [curatedLang, setCuratedLang] = useState<string>(curatedLangs[0] ?? 'ja');
  const [curatedTexts, setCuratedTexts] = useState<CuratedText[]>([]);
  const [curatedLoading, setCuratedLoading] = useState(false);
  const [curatedError, setCuratedError] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');

  useEffect(() => {
    loadTexts();
  }, [filterLang]);

  useEffect(() => {
    if (subTab === 'curated') {
      fetchCuratedTexts(curatedLang);
    }
  }, [subTab, curatedLang]);

  async function fetchCuratedTexts(lang: string) {
    setCuratedLoading(true);
    setCuratedError(null);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}content/reading/${lang}/index.json`);
      if (!res.ok) throw new Error(`Failed to load curated texts`);
      const data = await res.json();
      setCuratedTexts(data.texts ?? []);
    } catch {
      setCuratedError('Could not load curated texts.');
      setCuratedTexts([]);
    } finally {
      setCuratedLoading(false);
    }
  }

  async function loadTexts() {
    const result = await getAllTexts(filterLang || undefined);
    setTexts(result);
  }

  async function handleDelete(id: number) {
    await deleteText(id);
    setConfirmDeleteId(null);
    await loadTexts();
  }

  function handleCuratedClick(ct: CuratedText) {
    onSelectCurated?.(ct.id, curatedLang, ct.title);
  }

  const uniqueLangs = [...new Set(texts.map((t) => t.language))].sort();

  const filteredCurated = difficultyFilter === 'all'
    ? curatedTexts
    : curatedTexts.filter((t) => t.difficulty === difficultyFilter);

  return (
    <div className="space-y-3">
      {/* Sub-tab toggle: Curated / Saved. The parent tab is already called
          "Library", so the inner tabs must not repeat that word. */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        <button
          onClick={() => setSubTab('curated')}
          className={`flex-1 py-2 min-h-[44px] text-sm font-medium rounded-lg transition-colors press-feedback ${
            subTab === 'curated'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
          }`}
        >
          Ready to read
        </button>
        <button
          onClick={() => setSubTab('my-texts')}
          className={`flex-1 py-2 min-h-[44px] text-sm font-medium rounded-lg transition-colors press-feedback ${
            subTab === 'my-texts'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
          }`}
        >
          Saved by you
        </button>
      </div>

      {subTab === 'curated' ? (
        <CuratedLibrary
          langs={curatedLangs.length > 0 ? curatedLangs : ['ja', 'ru', 'pt', 'es', 'ar']}
          currentLang={curatedLang}
          onChangeLang={setCuratedLang}
          texts={filteredCurated}
          loading={curatedLoading}
          error={curatedError}
          difficultyFilter={difficultyFilter}
          onChangeDifficulty={setDifficultyFilter}
          onSelect={handleCuratedClick}
        />
      ) : (
        <MyTextsTab
          texts={texts}
          filterLang={filterLang}
          setFilterLang={setFilterLang}
          uniqueLangs={uniqueLangs}
          confirmDeleteId={confirmDeleteId}
          setConfirmDeleteId={setConfirmDeleteId}
          onSelectText={onSelectText}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

/* ---------- Curated Library Sub-component ---------- */

function CuratedLibrary({
  langs,
  currentLang,
  onChangeLang,
  texts,
  loading,
  error,
  difficultyFilter,
  onChangeDifficulty,
  onSelect,
}: {
  langs: string[];
  currentLang: string;
  onChangeLang: (l: string) => void;
  texts: CuratedText[];
  loading: boolean;
  error: string | null;
  difficultyFilter: DifficultyFilter;
  onChangeDifficulty: (d: DifficultyFilter) => void;
  onSelect: (t: CuratedText) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Language pills */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 overflow-x-auto">
        {langs.map((lang) => (
          <button
            key={lang}
            onClick={() => onChangeLang(lang)}
            className={`shrink-0 py-1.5 px-3 min-h-[44px] text-sm font-medium rounded-lg transition-colors press-feedback ${
              currentLang === lang
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
            }`}
          >
            {getLanguageLabel(lang)}
          </button>
        ))}
      </div>

      {/* Difficulty filter */}
      <div className="flex gap-1 overflow-x-auto">
        {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
          <button
            key={d}
            onClick={() => onChangeDifficulty(d)}
            className={`shrink-0 py-1 px-3 min-h-[44px] text-xs font-medium rounded-full transition-colors press-feedback border ${
              difficultyFilter === d
                ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <svg className="animate-spin h-6 w-6 text-indigo-600 dark:text-indigo-400 mb-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading library…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">{error}</p>
        </div>
      ) : texts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No texts match this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {texts.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelect(t)}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">
                    {t.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t.titleEn}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${DIFFICULTY_COLORS[t.difficulty]}`}
                >
                  {t.difficulty.charAt(0).toUpperCase() + t.difficulty.slice(1)}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{t.description}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ~{t.wordCount} {['ja', 'zh', 'ko'].includes(currentLang) ? 'chars' : 'words'}
                </span>
                {t.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- My Texts Sub-component ---------- */

function MyTextsTab({
  texts,
  filterLang,
  setFilterLang,
  uniqueLangs,
  confirmDeleteId,
  setConfirmDeleteId,
  onSelectText,
  onDelete,
}: {
  texts: Text[];
  filterLang: string;
  setFilterLang: (l: string) => void;
  uniqueLangs: string[];
  confirmDeleteId: number | null;
  setConfirmDeleteId: (id: number | null) => void;
  onSelectText: (t: Text) => void;
  onDelete: (id: number) => void;
}) {
  if (texts.length === 0 && !filterLang) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-4xl mb-3">📚</p>
        <p className="text-slate-500 dark:text-slate-400">
          No saved texts yet. Import something to read!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Language filter — pill tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 overflow-x-auto">
        <button
          onClick={() => setFilterLang('')}
          className={`shrink-0 py-1.5 px-3 min-h-[44px] text-sm font-medium rounded-lg transition-colors press-feedback ${
            !filterLang
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
          }`}
        >
          All
        </button>
        {uniqueLangs.map((lang) => (
          <button
            key={lang}
            onClick={() => setFilterLang(lang)}
            className={`shrink-0 py-1.5 px-3 min-h-[44px] text-sm font-medium rounded-lg transition-colors press-feedback ${
              filterLang === lang
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
            }`}
          >
            {getLanguageLabel(lang)}
          </button>
        ))}
      </div>

      {texts.length === 0 && filterLang ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No texts found for this language.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {texts.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelectText(t)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">
                      {t.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        LANGUAGE_COLORS[t.language] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {getLanguageLabel(t.language)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                    {t.content.slice(0, 100)}
                    {t.content.length > 100 ? '…' : ''}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>{relativeDate(t.createdAt)}</span>
                    <span>
                      {userWordCount(t.content, t.language)}{' '}
                      {['ja', 'zh', 'ko'].includes(t.language) ? 'chars' : 'words'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteId(confirmDeleteId === t.id! ? null : t.id!);
                  }}
                  className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors p-1 shrink-0 press-feedback"
                  aria-label="Delete text"
                >
                  🗑️
                </button>
              </div>
              {confirmDeleteId === t.id && (
                <div className="mt-2 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-sm text-red-600 dark:text-red-400">Delete this text?</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(t.id!);
                    }}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors press-feedback"
                  >
                    Delete
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(null);
                    }}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:underline press-feedback"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
