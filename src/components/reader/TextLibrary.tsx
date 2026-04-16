import { useState, useEffect } from 'react';
import type { Text } from '../../db/schema';
import { getAllTexts, deleteText } from '../../db/texts';
import { relativeDate } from '../../lib/dates';
import { getLanguageLabel } from '../../lib/languages';

const LANGUAGE_COLORS: Record<string, string> = {
  ja: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  ru: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  en: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  es: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  fr: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  de: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  zh: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  ko: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};

function wordCount(content: string, language: string): number {
  const cjkLangs = ['ja', 'zh', 'ko'];
  if (cjkLangs.includes(language)) {
    // For CJK, count characters (excluding whitespace)
    return content.replace(/\s/g, '').length;
  }
  return content.split(/\s+/).filter(Boolean).length;
}

interface TextLibraryProps {
  onSelectText: (text: Text) => void;
}

export default function TextLibrary({ onSelectText }: TextLibraryProps) {
  const [texts, setTexts] = useState<Text[]>([]);
  const [filterLang, setFilterLang] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    loadTexts();
  }, [filterLang]);

  async function loadTexts() {
    const result = await getAllTexts(filterLang || undefined);
    setTexts(result);
  }

  async function handleDelete(id: number) {
    await deleteText(id);
    setConfirmDeleteId(null);
    await loadTexts();
  }

  const uniqueLangs = [...new Set(texts.map((t) => t.language))].sort();

  if (texts.length === 0 && !filterLang) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-4xl mb-3">📚</p>
        <p className="text-gray-500 dark:text-gray-400">
          No saved texts yet. Import something to read!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Language filter */}
      <select
        value={filterLang}
        onChange={(e) => setFilterLang(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm"
      >
        <option value="">All languages</option>
        {uniqueLangs.map((lang) => (
          <option key={lang} value={lang}>
            {getLanguageLabel(lang)}
          </option>
        ))}
      </select>

      {texts.length === 0 && filterLang ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No texts found for this language.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {texts.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelectText(t)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate">
                      {t.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        LANGUAGE_COLORS[t.language] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {getLanguageLabel(t.language)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                    {t.content.slice(0, 100)}
                    {t.content.length > 100 ? '…' : ''}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                    <span>{relativeDate(t.createdAt)}</span>
                    <span>
                      {wordCount(t.content, t.language)}{' '}
                      {['ja', 'zh', 'ko'].includes(t.language) ? 'chars' : 'words'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteId(confirmDeleteId === t.id! ? null : t.id!);
                  }}
                  className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors p-1 shrink-0"
                  aria-label="Delete text"
                >
                  🗑️
                </button>
              </div>
              {confirmDeleteId === t.id && (
                <div className="mt-2 flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-red-600 dark:text-red-400">Delete this text?</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(t.id!);
                    }}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(null);
                    }}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
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
