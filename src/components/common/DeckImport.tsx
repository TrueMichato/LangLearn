import { useState, useRef } from 'react';
import { parseDeck, importDeck, type Deck } from '../../lib/decks';

export default function DeckImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setResult(null);
    setDeck(null);

    try {
      const text = await file.text();
      const parsed = parseDeck(text);
      setDeck(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse deck file');
    }

    // Reset the input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    if (!deck) return;
    setImporting(true);
    try {
      const res = await importDeck(deck);
      setResult(res);
      setDeck(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Import Deck</h4>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        📂 Choose Deck File
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">❌ {error}</p>
      )}

      {deck && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-2">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {deck.name} <span className="text-gray-500">({deck.language.toUpperCase()})</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {deck.words.length} word{deck.words.length !== 1 ? 's' : ''}
          </p>
          {deck.words.length > 0 && (
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
              {deck.words.slice(0, 5).map((w, i) => (
                <li key={i}>
                  <span className="font-medium">{w.word}</span>
                  {w.reading ? ` (${w.reading})` : ''} — {w.meaning}
                </li>
              ))}
              {deck.words.length > 5 && (
                <li className="text-gray-400">…and {deck.words.length - 5} more</li>
              )}
            </ul>
          )}
          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full bg-indigo-600 text-white py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {importing ? 'Importing…' : 'Import Deck'}
          </button>
        </div>
      )}

      {result && (
        <p className="text-sm text-center text-gray-700 dark:text-gray-300">
          ✅ Added {result.added} word{result.added !== 1 ? 's' : ''}, skipped{' '}
          {result.skipped} duplicate{result.skipped !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
