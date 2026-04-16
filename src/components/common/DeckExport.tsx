import { useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { exportDeck } from '../../lib/decks';
import { downloadJson } from '../../db/backup';
import { db } from '../../db/schema';
import { getLanguageLabel } from '../../lib/languages';

export default function DeckExport() {
  const { activeLanguages } = useSettingsStore();
  const [language, setLanguage] = useState(activeLanguages[0] ?? '');
  const [deckName, setDeckName] = useState('');
  const [tag, setTag] = useState('');
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const refreshPreview = async (lang: string, t: string) => {
    if (!lang) {
      setWordCount(null);
      return;
    }
    let words = await db.words.where('language').equals(lang).toArray();
    if (t) words = words.filter((w) => w.tags.includes(t));
    setWordCount(words.length);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    refreshPreview(lang, tag);
  };

  const handleTagChange = (t: string) => {
    setTag(t);
    refreshPreview(language, t);
  };

  const handleExport = async () => {
    if (!language || !deckName.trim()) return;
    setExporting(true);
    try {
      const json = await exportDeck(deckName.trim(), language, tag || undefined);
      const filename = `${deckName.trim().replace(/\s+/g, '-').toLowerCase()}.json`;
      downloadJson(json, filename);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Export Deck</h4>

      <select
        value={language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
      >
        <option value="">Select language</option>
        {activeLanguages.map((lang) => (
          <option key={lang} value={lang}>{getLanguageLabel(lang)}</option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Deck name"
        value={deckName}
        onChange={(e) => setDeckName(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm placeholder-gray-400"
      />

      <input
        type="text"
        placeholder="Tag filter (optional)"
        value={tag}
        onChange={(e) => handleTagChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm placeholder-gray-400"
      />

      {wordCount !== null && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {wordCount} word{wordCount !== 1 ? 's' : ''} will be exported
        </p>
      )}

      <button
        onClick={handleExport}
        disabled={!language || !deckName.trim() || exporting}
        className="w-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 py-2 rounded-xl font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors disabled:opacity-50"
      >
        {exporting ? 'Exporting…' : '📦 Export Deck'}
      </button>
    </div>
  );
}
