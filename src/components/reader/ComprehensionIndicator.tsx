import { useState, useEffect, useCallback } from 'react';
import { analyzeText, type TextAnalysis } from '../../lib/text-analysis';

interface ComprehensionIndicatorProps {
  text: string;
  language: string;
  /** When true, known-word highlighting is active */
  highlightEnabled: boolean;
  onToggleHighlight: () => void;
}

const levelConfig = {
  easy: {
    color: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200',
    dot: 'bg-green-500',
    label: 'Easy reading ✅',
  },
  comfortable: {
    color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200',
    dot: 'bg-blue-500',
    label: 'Good level — slight challenge 👍',
  },
  challenging: {
    color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200',
    dot: 'bg-amber-500',
    label: 'Challenging — expect to look up words 📖',
  },
  difficult: {
    color: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200',
    dot: 'bg-red-500',
    label: 'Difficult — consider easier text 🔄',
  },
};

export default function ComprehensionIndicator({
  text,
  language,
  highlightEnabled,
  onToggleHighlight,
}: ComprehensionIndicatorProps) {
  const [analysis, setAnalysis] = useState<TextAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFreqWords, setShowFreqWords] = useState(false);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const result = await analyzeText(text, language);
      setAnalysis(result);
    } finally {
      setLoading(false);
    }
  }, [text, language]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 mb-4 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    );
  }

  if (!analysis || analysis.uniqueWords === 0) return null;

  const config = levelConfig[analysis.comprehensionLevel];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 mb-4 border border-gray-200 dark:border-gray-700">
      {/* Main stat row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${config.dot}`} />
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
            Estimated comprehension: ~{analysis.knownPercentage}%
          </span>
        </div>
        <button
          onClick={onToggleHighlight}
          title={highlightEnabled ? 'Hide known-word highlights' : 'Show known-word highlights'}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors press-feedback ${
            highlightEnabled
              ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            {highlightEnabled ? (
              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
            ) : null}
            <path
              fillRule="evenodd"
              d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Detail line */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        You know ~{analysis.knownWords} of {analysis.uniqueWords} unique words
      </p>

      {/* Level label */}
      <div className={`inline-block text-xs font-medium rounded-md px-2 py-0.5 mt-2 ${config.color}`}>
        {config.label}
      </div>

      {/* High-frequency unknown words */}
      {analysis.unknownHighFrequency.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowFreqWords((v) => !v)}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline press-feedback"
          >
            💡 {analysis.unknownHighFrequency.length} high-frequency word{analysis.unknownHighFrequency.length !== 1 ? 's' : ''} to learn
            <span className="ml-1">{showFreqWords ? '▲' : '▼'}</span>
          </button>
          {showFreqWords && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {analysis.unknownHighFrequency.map((w) => (
                <span
                  key={w}
                  className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md"
                >
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
