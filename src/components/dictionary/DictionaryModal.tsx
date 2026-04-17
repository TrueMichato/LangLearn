import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { getLanguageLabel } from '../../lib/languages';
import { searchDictionary, type DictResult } from '../../lib/dictionary-search';
import { addWord, wordExists } from '../../db/words';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function DictionaryModal({ isOpen, onClose }: Props) {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);

  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState(activeLanguages[0] ?? 'ja');
  const [results, setResults] = useState<DictResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setAddedWords(new Set());
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchDictionary(query, language);
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, language, isOpen]);

  const handleAdd = useCallback(async (result: DictResult) => {
    const key = `${result.word}::${language}`;
    const exists = await wordExists(result.word, language);
    if (exists) {
      setAddedWords((prev) => new Set(prev).add(key));
      return;
    }

    await addWord({
      language,
      word: result.word,
      reading: result.reading,
      meaning: result.meaning,
      contextSentence: '',
      sourceTextId: null,
      tags: ['dictionary'],
    });
    setAddedWords((prev) => new Set(prev).add(key));
  }, [language]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-16"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Dictionary</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-lg"
              aria-label="Close dictionary"
            >
              ✕
            </button>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-2"
          />

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {activeLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {getLanguageLabel(lang)}
              </option>
            ))}
          </select>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 p-4">
          {loading && (
            <p className="text-center text-gray-400 dark:text-gray-500 py-4">Searching…</p>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <p className="text-center text-gray-400 dark:text-gray-500 py-4">No results found</p>
          )}

          {results.map((r, i) => {
            const key = `${r.word}::${language}`;
            const wasAdded = addedWords.has(key);

            return (
              <div
                key={`${r.word}-${r.source}-${i}`}
                className="mb-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {r.word}
                    </span>
                    {r.reading && (
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        {r.reading}
                      </span>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{r.meaning}</p>
                  </div>

                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                      r.source === 'local'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                    }`}
                  >
                    {r.source === 'local' ? 'Local' : 'Online'}
                  </span>
                </div>

                <div className="mt-2">
                  {r.source === 'local' || r.inDeck ? (
                    <span className="text-xs text-green-600 dark:text-green-400">In your deck ✓</span>
                  ) : wasAdded ? (
                    <span className="text-xs text-green-600 dark:text-green-400">✓ Added</span>
                  ) : (
                    <button
                      onClick={() => handleAdd(r)}
                      className="text-xs px-3 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
                    >
                      ➕ Add to flashcards
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
