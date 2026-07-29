import { useState, useEffect } from 'react';
import { getWeeklyGoals, type GoalProgress } from '../../lib/goals';
import { useSettingsStore } from '../../stores/settingsStore';

function Ring({ goal }: { goal: GoalProgress }) {
  const size = 64;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = goal.target > 0 ? Math.min(1, goal.current / goal.target) : 0;
  const offset = circ * (1 - pct);
  const color = goal.done ? 'text-green-500' : 'text-indigo-600 dark:text-indigo-400';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            className="text-slate-200 dark:text-slate-700"
            stroke="currentColor"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            className={color}
            stroke="currentColor"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg">
          {goal.done ? '✅' : goal.icon}
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
        {goal.current}/{goal.target}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-tight">
        {goal.label}
      </p>
    </div>
  );
}

export default function WeeklyGoals() {
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const weeklyWordGoal = useSettingsStore((s) => s.weeklyWordGoal);
  const weeklyReviewGoal = useSettingsStore((s) => s.weeklyReviewGoal);
  const weeklyLessonGoal = useSettingsStore((s) => s.weeklyLessonGoal);

  useEffect(() => {
    let cancelled = false;
    getWeeklyGoals(
      { words: weeklyWordGoal, reviews: weeklyReviewGoal, lessons: weeklyLessonGoal },
      activeLanguages
    ).then((g) => {
      if (!cancelled) setGoals(g);
    });
    return () => {
      cancelled = true;
    };
  }, [activeLanguages, weeklyWordGoal, weeklyReviewGoal, weeklyLessonGoal]);

  if (goals.length === 0) return null;

  const allDone = goals.every((g) => g.done);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Weekly goals</h3>
        {allDone && (
          <span className="text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded-full">
            All done 🎉
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {goals.map((g) => (
          <Ring key={g.id} goal={g} />
        ))}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
        Progress over the last 7 days — every bit counts.
      </p>
    </div>
  );
}
