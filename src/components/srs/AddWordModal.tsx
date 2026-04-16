import { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { addWord } from '../../db/words';
import { lookupWord } from '../../lib/dictionary';
import { speak, isTTSSupported } from '../../lib/tts';
import { getLanguageLabel } from '../../lib/languages';

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddWordModal({ isOpen, onClose }: AddWordModalProps) {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const [language, setLanguage] = useState(activeLanguages[0] ?? 'ja');
  const [word, setWord] = useState('');
  const [reading, setReading] = useState('');
  const [meaning, setMeaning] = useState('');
  const [tags, setTags] = useState('');
  const [looking, setLooking] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const wordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => wordRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!activeLanguages.includes(language) && activeLanguages.length > 0) {
      setLanguage(activeLanguages[0]);
    }
  }, [activeLanguages, language]);

  function clearForm() {
    setWord('');
    setReading('');
    setMeaning('');
    setTags('');
    setError('');
  }

  async function handleLookup() {
    if (!word.trim()) return;
    setLooking(true);
    setError('');
    try {
      const result = await lookupWord(word.trim(), language);
      if (result) {
        if (result.reading) setReading(result.reading);
        if (result.meanings.length > 0) setMeaning(result.meanings.join('; '));
      } else {
        setError('No results found');
      }
    } catch {
      setError('Lookup failed');
    } finally {
      setLooking(false);
    }
  }

  async function handleAdd() {
    if (!word.trim() || !meaning.trim()) {
      setError('Word and meaning are required');
      return;
    }
    setError('');
    try {
      await addWord({
        language,
        word: word.trim(),
        reading: reading.trim(),
        meaning: meaning.trim(),
        contextSentence: '',
        sourceTextId: null,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setSuccess(`Added "${word.trim()}"!`);
      clearForm();
      setTimeout(() => setSuccess(''), 2000);
      setTimeout(() => wordRef.current?.focus(), 50);
    } catch {
      setError('Failed to add word');
    }
  }

  if (!isOpen) return null;

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add Word</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={inputClass}
            >
              {activeLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {getLanguageLabel(lang)}
                </option>
              ))}
            </select>
          </div>

          {/* Word + lookup */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Word <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                ref={wordRef}
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLookup();
                }}
                className={`${inputClass} flex-1`}
                placeholder="e.g. 食べる"
              />
              <button
                onClick={handleLookup}
                disabled={looking || !word.trim()}
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 shrink-0"
                title="Look up"
              >
                {looking ? (
                  <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  '🔍'
                )}
              </button>
              {isTTSSupported() && word.trim() && (
                <button
                  onClick={() => speak(word.trim(), language)}
                  className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 shrink-0"
                  title="Listen"
                >
                  🔊
                </button>
              )}
            </div>
          </div>

          {/* Reading */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reading
            </label>
            <input
              type="text"
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              className={inputClass}
              placeholder="e.g. たべる"
            />
          </div>

          {/* Meaning */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meaning <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
              className={inputClass}
              placeholder="e.g. to eat"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={inputClass}
              placeholder="verb, food (comma-separated)"
            />
          </div>

          {/* Messages */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={!word.trim() || !meaning.trim()}
              className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
