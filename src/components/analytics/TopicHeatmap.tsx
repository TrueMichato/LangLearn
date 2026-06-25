import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTopicRetention, type TopicRetention } from '../../lib/grammar-topics';

interface GrammarIndexEntry {
  id: string;
  title?: string;
}

/** Color a topic cell by retention — kind framing: weak = "growing", not "bad". */
function cellColor(percent: number, cardCount: number): string {
  if (cardCount === 0) return 'bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500';
  if (percent >= 80) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200';
  if (percent >= 60) return 'bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-200';
  if (percent >= 40) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200';
  return 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200';
}

export default function TopicHeatmap({ language }: { language?: string }) {
  const [topics, setTopics] = useState<TopicRetention[] | null>(null);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await getTopicRetention(language);
      if (cancelled) return;
      setTopics(data);

      // Fetch lesson titles for the languages present (best-effort).
      const langs = Array.from(new Set(data.map((t) => t.language)));
      const titleMap: Record<string, string> = {};
      await Promise.all(
        langs.map(async (lang) => {
          try {
            const res = await fetch(`${import.meta.env.BASE_URL}content/grammar/${lang}/index.json`);
            if (!res.ok) return;
            const entries: GrammarIndexEntry[] = await res.json();
            for (const e of entries) {
              if (e.title) titleMap[`${lang}/${e.id}`] = e.title;
            }
          } catch {
            /* titles are optional */
          }
        })
      );
      if (!cancelled) setTitles(titleMap);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [language]);

  if (!topics || topics.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-slate-200/60 dark:border-white/10 p-4 mb-4">
      <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2">
        <span>🗺️</span> Grammar topics
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Tap a topic to drill it. Lower scores just mean more room to grow. 🌱
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {topics.map((t) => {
          const title = titles[`${t.language}/${t.topicId}`] ?? t.topicId;
          return (
            <button
              key={`${t.language}/${t.topicId}`}
              onClick={() =>
                navigate(`/review?deck=topic&topic=${encodeURIComponent(t.topicId)}`)
              }
              className={`text-left rounded-xl p-3 min-h-[44px] transition-transform hover:scale-[1.02] ${cellColor(
                t.retentionPercent,
                t.cardCount
              )}`}
              title={`${t.strongCount}/${t.cardCount} strong${t.lapses ? ` · ${t.lapses} slips` : ''}`}
            >
              <p className="text-sm font-medium truncate">{title}</p>
              <p className="text-xs opacity-80 tabular-nums">
                {t.retentionPercent}% · {t.cardCount} card{t.cardCount === 1 ? '' : 's'}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
