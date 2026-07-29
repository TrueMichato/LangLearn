import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWeeklyRecap, currentWeekKey, type WeeklyRecap } from '../../lib/weekly-recap';
import { useSettingsStore } from '../../stores/settingsStore';
import { getLanguageFlag } from '../../lib/languages';

export default function WeeklyRecapModal() {
  const [recap, setRecap] = useState<WeeklyRecap | null>(null);
  const [open, setOpen] = useState(false);
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const lastRecapShownWeek = useSettingsStore((s) => s.lastRecapShownWeek);
  const setLastRecapShownWeek = useSettingsStore((s) => s.setLastRecapShownWeek);
  const navigate = useNavigate();

  useEffect(() => {
    const week = currentWeekKey();
    if (week === lastRecapShownWeek) return;

    let cancelled = false;
    getWeeklyRecap(activeLanguages).then((data) => {
      if (cancelled) return;
      const hasActivity =
        data.activeDays > 0 || data.reviews > 0 || data.wordsLearned > 0;
      if (hasActivity) {
        setRecap(data);
        setOpen(true);
      } else {
        // Nothing to celebrate yet — don't nag; try again next week.
        setLastRecapShownWeek(week);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeLanguages, lastRecapShownWeek, setLastRecapShownWeek]);

  function dismiss() {
    setLastRecapShownWeek(currentWeekKey());
    setOpen(false);
  }

  if (!open || !recap) return null;

  const stats = [
    { icon: '📚', label: 'Words learned', value: recap.wordsLearned },
    { icon: '🃏', label: 'Reviews', value: recap.reviews },
    { icon: '⏱️', label: 'Minutes', value: recap.studyMinutes },
    { icon: '⭐', label: 'XP earned', value: recap.xp },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-4"
      onClick={dismiss}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <p className="text-4xl mb-2">🎉</p>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Your week in review
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            You showed up on {recap.activeDays} day{recap.activeDays === 1 ? '' : 's'}. That's what counts. 💪
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center"
            >
              <span className="text-lg">{s.icon}</span>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1 tabular-nums">
                {s.value}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>

        {recap.topFocus.length > 0 && (
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Suggested focus next week
            </h3>
            <div className="flex flex-col gap-1.5">
              {recap.topFocus.map(({ word }) => (
                <div
                  key={word.id}
                  className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2"
                >
                  <span>{getLanguageFlag(word.language)}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {word.word}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 truncate">
                    {word.meaning}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => {
              dismiss();
              navigate('/review');
            }}
            className="flex-1 fill-primary text-white px-5 py-2.5 rounded-xl font-medium press-feedback hover:opacity-90 transition-opacity min-h-[44px]"
          >
            Start reviewing
          </button>
          <button
            onClick={dismiss}
            className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-h-[44px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
