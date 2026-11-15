interface StudyPlanProps {
  todayStudySeconds: number;
  dailyGoalSeconds: number;
  weekStudySeconds: number;
  weeklyGoalSeconds: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezes?: number;
}

export default function StudyPlan({
  todayStudySeconds, dailyGoalSeconds, weekStudySeconds, weeklyGoalSeconds,
  currentStreak, longestStreak, streakFreezes,
}: StudyPlanProps) {
  return (
    <section aria-labelledby="study-goals" className="mb-6 rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-white/10 dark:bg-slate-800/90">
      <h2 id="study-goals" className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Study goals</h2>
      <div className="space-y-3">
        <GoalProgress label="Today" seconds={todayStudySeconds} goal={dailyGoalSeconds} />
        <GoalProgress label="This week" seconds={weekStudySeconds} goal={weeklyGoalSeconds} />
        {currentStreak > 0 && <p className="text-sm text-slate-700 dark:text-slate-200">🔥 {currentStreak}-day streak · Best: {longestStreak} days</p>}
        {!!streakFreezes && <p className="text-xs text-slate-500 dark:text-slate-400">🧊 {streakFreezes} freeze day{streakFreezes === 1 ? '' : 's'} available to protect your streak</p>}
      </div>
    </section>
  );
}

function GoalProgress({ label, seconds, goal }: { label: string; seconds: number; goal: number }) {
  const minutes = seconds > 0 && seconds < 60 ? 'Less than 1' : String(Math.floor(seconds / 60));
  const percentage = goal > 0 ? Math.min(100, seconds / goal * 100) : 0;
  return (
    <div>
      <p className="text-sm text-slate-700 dark:text-slate-200">{label}: {minutes} of {Math.round(goal / 60)} minutes</p>
      <div aria-hidden="true" className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
