import { useNavigate } from 'react-router-dom';

interface StudyPlanProps {
  dueCards: number;
  weekStudySeconds: number;
  weeklyGoalSeconds: number;
  currentStreak: number;
}

function ProgressRing({ percentage }: { percentage: number }) {
  const size = 40;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const gradientId = 'progress-ring-grad';

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
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
        stroke={`url(#${gradientId})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-500"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-slate-700 dark:fill-slate-200 text-[9px] font-semibold rotate-90 origin-center"
      >
        {percentage}%
      </text>
    </svg>
  );
}

export default function StudyPlan({
  dueCards,
  weekStudySeconds,
  weeklyGoalSeconds,
  currentStreak,
}: StudyPlanProps) {
  const navigate = useNavigate();

  const minutesStudied = Math.round(weekStudySeconds / 60);
  const goalMinutes = Math.round(weeklyGoalSeconds / 60);
  const percentage = goalMinutes > 0
    ? Math.min(100, Math.round((weekStudySeconds / weeklyGoalSeconds) * 100))
    : 0;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-2xl shadow p-5 mb-6">
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">
        📋 Today's Plan
      </h3>

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
          <ProgressRing percentage={percentage} />
          <span>⏱️ {minutesStudied}m / {goalMinutes}m weekly goal</span>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          {currentStreak > 0
            ? `🔥 ${currentStreak}-day streak`
            : 'Start your streak today! 💪'}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {dueCards > 0 && (
          <button
            onClick={() => navigate('/review')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Start Review
          </button>
        )}
        <button
          onClick={() => navigate('/reader')}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Open Reader
        </button>
        <button
          onClick={() => navigate('/words')}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          + Add Word
        </button>
      </div>
    </div>
  );
}
