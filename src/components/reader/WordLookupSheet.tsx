import { useState } from 'react';
import { speak, isTTSSupported } from '../../lib/tts';
import { lookupWord } from '../../lib/dictionary';

interface WordLookupSheetProps {
  word: string;
  language: string;
  initialReading?: string;
  onAdd: (word: string, reading: string, meaning: string) => void;
  onClose: () => void;
}

export default function WordLookupSheet({
  word,
  language,
  initialReading = '',
  onAdd,
  onClose,
}: WordLookupSheetProps) {
  const [reading, setReading] = useState(initialReading);
  const [meaning, setMeaning] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    setLoading(true);
    try {
      const result = await lookupWord(word, language);
      if (result) {
        setReading(result.reading);
        setMeaning(result.meanings.join('; '));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 rounded-t-2xl shadow-xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-50">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">{word}</span>
            {isTTSSupported() && (
              <button
                onClick={() => speak(word, language)}
                className="text-lg hover:scale-110 transition-transform"
              >
                🔊
              </button>
            )}
            <button
              onClick={handleLookup}
              disabled={loading}
              className="text-sm bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-1">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Looking up…
                </span>
              ) : (
                '🔍 Look up'
              )}
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <input
          type="text"
          placeholder="Reading / pronunciation"
          value={reading}
          onChange={(e) => setReading(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <input
          type="text"
          placeholder="Meaning / translation"
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          onClick={() => onAdd(word, reading, meaning)}
          disabled={!meaning}
          className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-40"
        >
          + Add to SRS
        </button>
      </div>
    </div>
  );
}
