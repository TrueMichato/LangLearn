import { useNavigate } from 'react-router-dom';

interface StudyPlanProps {
  dueCards: number;
  weekStudySeconds: number;
  weeklyGoalSeconds: number;
  currentStreak: number;
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
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">
        📋 Today's Plan
      </h3>

      <div className="space-y-2 mb-4">
        {dueCards > 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            🃏 <strong>{dueCards} card{dueCards !== 1 ? 's' : ''}</strong> due for review
          </p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            All caught up! 🎉 No cards due right now
          </p>
        )}

        <div className="text-sm text-gray-600 dark:text-gray-300">
          <span>⏱️ {minutesStudied}m / {goalMinutes}m weekly goal ({percentage}%)</span>
          <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">
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
          className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Open Reader
        </button>
        <button
          onClick={() => navigate('/words')}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          + Add Word
        </button>
      </div>
    </div>
  );
}
