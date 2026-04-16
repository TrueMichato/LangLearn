import { useState, useEffect } from 'react';
import { db } from '../../db/schema';
import type { Review } from '../../db/schema';
import { getWordsByLanguage } from '../../db/words';
import { getLanguageLabel } from '../../lib/languages';

interface LangStat {
  total: number;
  due: number;
  learning: number;
  mature: number;
  avgEase: number;
}

interface LanguageStatsProps {
  languages: string[];
}
  en: '🇬🇧 English',
  es: '🇪🇸 Spanish',
  fr: '🇫🇷 French',
  de: '🇩🇪 German',
  zh: '🇨🇳 Chinese',
  ko: '🇰🇷 Korean',
  pt: '🇧🇷 Portuguese',
  it: '🇮🇹 Italian',
  ar: '🇸🇦 Arabic',
  hi: '🇮🇳 Hindi',
  tr: '🇹🇷 Turkish',
  pl: '🇵🇱 Polish',
  nl: '🇳🇱 Dutch',
  sv: '🇸🇪 Swedish',
  uk: '🇺🇦 Ukrainian',
  he: '🇮🇱 Hebrew',
};

function getHealthIndicator(ease: number): { label: string; emoji: string } {
  if (ease >= 2.5) return { label: 'Great', emoji: '💚' };
  if (ease >= 2.0) return { label: 'Good', emoji: '💛' };
  return { label: 'Needs practice', emoji: '🧡' };
}

export default function LanguageStats({ languages }: LanguageStatsProps) {
  const [langStats, setLangStats] = useState<Map<string, LangStat>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const stats = new Map<string, LangStat>();

      await Promise.all(
        languages.map(async (lang) => {
          const words = await getWordsByLanguage(lang);
          const wordIds = words.map((w) => w.id!);

          const reviews = (
            await Promise.all(
              wordIds.map((id) => db.reviews.where('wordId').equals(id).first())
            )
          ).filter(Boolean) as Review[];

          const now = new Date().toISOString();
          const due = reviews.filter((r) => r.nextReviewDate <= now).length;
          const learning = reviews.filter((r) => r.interval < 21).length;
          const mature = reviews.filter((r) => r.interval >= 21).length;
          const avgEase =
            reviews.length > 0
              ? reviews.reduce((s, r) => s + r.ease, 0) / reviews.length
              : 2.5;

          stats.set(lang, { total: words.length, due, learning, mature, avgEase });
        })
      );

      if (!cancelled) {
        setLangStats(stats);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [languages]);

  if (loading) return null;

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
        Per-Language Breakdown
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {languages.map((lang) => {
          const stat = langStats.get(lang);
          const label = LANG_LABELS[lang] ?? lang.toUpperCase();

          if (!stat || stat.total === 0) {
            return (
              <div
                key={lang}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 text-center"
              >
                <p className="font-semibold text-gray-500 dark:text-gray-400">
                  {label}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  No words yet — start reading!
                </p>
              </div>
            );
          }

          const health = getHealthIndicator(stat.avgEase);
          const maturePercent =
            stat.total > 0 ? Math.round((stat.mature / stat.total) * 100) : 0;

          return (
            <div
              key={lang}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-800 dark:text-gray-100">
                  {label}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {health.emoji} {health.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
                <p className="text-gray-600 dark:text-gray-300">
                  Total:{' '}
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {stat.total}
                  </span>
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Due:{' '}
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {stat.due}
                  </span>
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Learning:{' '}
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {stat.learning}
                  </span>
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Mature:{' '}
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {stat.mature}
                  </span>
                </p>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${maturePercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
                {maturePercent}% mature
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
