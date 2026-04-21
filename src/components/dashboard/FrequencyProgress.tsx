import { useState, useEffect } from 'react';
import { getWordsByLanguage } from '../../db/words';
import { getFrequencyRank } from '../../data/frequency';
import { getLanguageLabel } from '../../lib/languages';

interface LangCoverage {
  language: string;
  top100: number;
  top500: number;
}

const SUPPORTED_LANGUAGES = ['ja', 'ru'];

interface FrequencyProgressProps {
  languages: string[];
}

export default function FrequencyProgress({ languages }: FrequencyProgressProps) {
  const [coverage, setCoverage] = useState<LangCoverage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const results: LangCoverage[] = [];

      const langs = languages.filter((l) => SUPPORTED_LANGUAGES.includes(l));

      await Promise.all(
        langs.map(async (lang) => {
          const words = await getWordsByLanguage(lang);
          let top100 = 0;
          let top500 = 0;

          for (const w of words) {
            const rank = getFrequencyRank(w.word, lang);
            if (rank && rank <= 100) top100++;
            if (rank && rank <= 500) top500++;
          }

          results.push({ language: lang, top100, top500 });
        })
      );

      if (!cancelled) {
        setCoverage(results);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [languages]);

  if (loading || coverage.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
        📊 Vocabulary Coverage
      </h3>

      {coverage.map((c) => (
        <div key={c.language} className="space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {getLanguageLabel(c.language)}
          </p>

          {/* Top 100 */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-0.5">
              <span>⭐ Top 100</span>
              <span>{c.top100} / 100</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 dark:bg-yellow-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, c.top100)}%` }}
              />
            </div>
          </div>

          {/* Top 500 */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-0.5">
              <span>📗 Top 500</span>
              <span>{c.top500} / 500</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (c.top500 / 500) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
