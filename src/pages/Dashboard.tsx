import { useState, useEffect } from 'react';
import { db } from '../db/schema';
import type { StudySession, DailyActivity } from '../db/schema';
import { getDueCount } from '../db/reviews';
import { getTotalWordCount } from '../db/words';
import { formatStudyTime } from '../lib/xp';
import { calculateCurrentStreak, calculateLongestStreak } from '../lib/streaks';
import { useSettingsStore } from '../stores/settingsStore';
import HeatMap from '../components/dashboard/HeatMap';

interface Stats {
  totalWords: number;
  dueCards: number;
  totalStudySeconds: number;
  weekStudySeconds: number;
  totalXP: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [allSessions, setAllSessions] = useState<StudySession[]>([]);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const weeklyGoalMinutes = useSettingsStore((s) => s.weeklyGoalMinutes);

  useEffect(() => {
    async function load() {
      const totalWords = await getTotalWordCount();
      const dueCards = await getDueCount();

      const sessions = await db.studySessions.toArray();
      setAllSessions(sessions);
      const totalStudySeconds = sessions.reduce(
        (sum, s) => sum + s.durationSeconds,
        0
      );
      const totalXP = sessions.reduce((sum, s) => sum + s.xpEarned, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekSessions = sessions.filter(
        (s) => new Date(s.startTime) >= weekAgo
      );
      const weekStudySeconds = weekSessions.reduce(
        (sum, s) => sum + s.durationSeconds,
        0
      );

      setStats({ totalWords, dueCards, totalStudySeconds, weekStudySeconds, totalXP });

      const dailyActivities = await db.dailyActivity.toArray();
      setActivities(dailyActivities);
    }
    load();
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 dark:text-gray-500">Loading...</p>
      </div>
    );
  }

  const weeklyGoalSeconds = weeklyGoalMinutes * 60;
  const weeklyProgress = Math.min(
    100,
    Math.round((stats.weekStudySeconds / weeklyGoalSeconds) * 100)
  );

  const currentStreak = calculateCurrentStreak(activities);
  const longestStreak = calculateLongestStreak(activities);
  const streakEmoji =
    currentStreak >= 30 ? '🔥🔥🔥' : currentStreak >= 7 ? '🔥🔥' : '🔥';

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Dashboard</h2>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Words Learned" value={stats.totalWords} icon="📚" />
        <StatCard label="Cards Due" value={stats.dueCards} icon="🃏" />
        <StatCard
          label="Total Study Time"
          value={formatStudyTime(stats.totalStudySeconds)}
          icon="⏱️"
        />
        <StatCard label="Total XP" value={stats.totalXP} icon="⭐" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-6">
        {currentStreak > 0 ? (
          <>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center">
              {streakEmoji} {currentStreak}-day streak
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
              Best: {longestStreak} days
            </p>
          </>
        ) : (
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 text-center">
            Start your streak today! 💪
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Weekly Goal</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatStudyTime(stats.weekStudySeconds)} /{' '}
            {formatStudyTime(weeklyGoalSeconds)}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-indigo-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${weeklyProgress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
          {weeklyProgress >= 100
            ? '🎉 Goal reached this week!'
            : `${weeklyProgress}% — keep it up!`}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mt-4">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
          Study Activity
        </h3>
        <HeatMap studySessions={allSessions} />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 text-center">
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
