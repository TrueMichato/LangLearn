import { useNavigate } from 'react-router-dom';

interface StudyPlanProps {
  dueCards: number;
  todayStudySeconds: number;
  dailyGoalSeconds: number;
  weekStudySeconds: number;
  weeklyGoalSeconds: number;
  currentStreak: number;
  streakFreezes?: number;
  /** Before the first session there is nothing to measure — say so plainly. */
  hasData?: boolean;
}

function ProgressRing({ percentage }: { percentage: number }) {
  const size = 40;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // The adjacent label already states the numbers, so the ring stays purely
  // visual rather than cramming a percentage into 9px of space.
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90" aria-hidden="true" focusable="false">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-slate-200 dark:text-slate-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-indigo-600 dark:text-indigo-400 transition-all duration-500"
      />
    </svg>
  );
}

export default function StudyPlan({
  dueCards,
  todayStudySeconds,
  dailyGoalSeconds,
  weekStudySeconds,
  weeklyGoalSeconds,
  currentStreak,
  streakFreezes,
  hasData = true,
}: StudyPlanProps) {
  const navigate = useNavigate();

  const minutesStudied = Math.round(weekStudySeconds / 60);
  const goalMinutes = Math.round(weeklyGoalSeconds / 60);
  const percentage = goalMinutes > 0
    ? Math.min(100, Math.round((weekStudySeconds / weeklyGoalSeconds) * 100))
    : 0;

  const todayMinutes = Math.round(todayStudySeconds / 60);
  const dailyMinutes = Math.round(dailyGoalSeconds / 60);
  const todayPct = dailyGoalSeconds > 0
    ? Math.min(100, Math.round((todayStudySeconds / dailyGoalSeconds) * 100))
    : 0;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-2xl shadow p-5 mb-6">
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">
        📋 Today's Plan
      </h3>

      {!hasData ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Nothing due yet — that's normal on day one. Finish a lesson below and
          your first reviews will show up here.
        </p>
      ) : (
        <>
          <div className="space-y-2 mb-4">
        {dueCards > 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            🃏 <strong>{dueCards} card{dueCards !== 1 ? 's' : ''}</strong> due for review
          </p>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            All caught up! 🎉 No cards due right now
          </p>
        )}

        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          <ProgressRing percentage={todayPct} />
          <span>🎯 {todayMinutes}m / {dailyMinutes}m today</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          <ProgressRing percentage={percentage} />
          <span>⏱️ {minutesStudied}m / {goalMinutes}m weekly goal</span>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2 flex-wrap">
          <span>
            {currentStreak > 0
              ? `🔥 ${currentStreak}-day streak`
              : 'Start your streak today! 💪'}
          </span>
          {streakFreezes != null && streakFreezes > 0 && (
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300"
              title="Freeze days protect your streak if you miss a day"
            >
              🧊 ×{streakFreezes}
            </span>
          )}
        </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {dueCards > 0 && (
              <button
                onClick={() => navigate('/review')}
                className="min-h-[44px] px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Start Review
              </button>
            )}
            <button
              onClick={() => navigate('/learn')}
              className="min-h-[44px] px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Keep learning
            </button>
            <button
              onClick={() => navigate('/reader')}
              className="min-h-[44px] px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Open Reader
            </button>
          </div>
        </>
      )}
    </div>
  );
}
