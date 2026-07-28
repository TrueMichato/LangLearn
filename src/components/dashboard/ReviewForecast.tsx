import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReviewForecast } from '../../lib/analytics';
import { useSettingsStore } from '../../stores/settingsStore';

interface DayLoad {
  date: string;
  count: number;
}

function dayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

export default function ReviewForecast() {
  const [forecast, setForecast] = useState<DayLoad[] | null>(null);
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Sum the per-language forecasts so the widget reflects "My Languages".
      const merged = new Map<string, number>();
      for (const lang of activeLanguages) {
        const days = await getReviewForecast(7, lang);
        for (const { date, count } of days) {
          merged.set(date, (merged.get(date) ?? 0) + count);
        }
      }
      const result = Array.from(merged.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count }));
      if (!cancelled) setForecast(result);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [activeLanguages]);

  if (!forecast) return null;

  const total = forecast.reduce((sum, d) => sum + d.count, 0);
  const max = Math.max(1, ...forecast.map((d) => d.count));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <span>📅</span> Next 7 days
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {total} review{total === 1 ? '' : 's'} coming up
        </span>
      </div>

      {total === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
          Nothing scheduled — you're all caught up. Add words or learn something new! ✨
        </p>
      ) : (
        <div className="flex items-end justify-between gap-1.5 sm:gap-2">
          {forecast.map((d, i) => {
            const heightPct = Math.round((d.count / max) * 100);
            return (
              <button
                key={d.date}
                onClick={() => navigate('/review')}
                disabled={d.count === 0}
                className="flex-1 flex flex-col items-center gap-1 group min-h-[44px] disabled:cursor-default"
                aria-label={`${d.count} reviews on ${dayLabel(d.date, i)}`}
              >
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                  {d.count}
                </span>
                <div className="w-full h-16 flex items-end rounded-md bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                  <div
                    className={`w-full rounded-md transition-all ${
                      i === 0
                        ? 'bg-gradient-to-t from-indigo-500 to-violet-500'
                        : 'bg-indigo-300 dark:bg-indigo-500/70 group-hover:bg-indigo-400 dark:group-hover:bg-indigo-400'
                    }`}
                    style={{ height: `${d.count === 0 ? 0 : Math.max(8, heightPct)}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] ${
                    i === 0
                      ? 'font-semibold text-indigo-600 dark:text-indigo-300'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {dayLabel(d.date, i)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
