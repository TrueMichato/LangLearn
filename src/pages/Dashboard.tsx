import { useState, useEffect } from 'react';
import { db } from '../db/schema';
import { getDueCount } from '../db/reviews';
import { getTotalWordCount } from '../db/words';
import { formatStudyTime } from '../lib/xp';
import { useSettingsStore } from '../stores/settingsStore';

interface Stats {
  totalWords: number;
  dueCards: number;
  totalStudySeconds: number;
  weekStudySeconds: number;
  totalXP: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const weeklyGoalMinutes = useSettingsStore((s) => s.weeklyGoalMinutes);

  useEffect(() => {
    async function load() {
      const totalWords = await getTotalWordCount();
      const dueCards = await getDueCount();

      const sessions = await db.studySessions.toArray();
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
    }
    load();
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const weeklyGoalSeconds = weeklyGoalMinutes * 60;
  const weeklyProgress = Math.min(
    100,
    Math.round((stats.weekStudySeconds / weeklyGoalSeconds) * 100)
  );

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Dashboard</h2>

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

      <div className="bg-white rounded-2xl shadow p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-700">Weekly Goal</h3>
          <span className="text-sm text-gray-500">
            {formatStudyTime(stats.weekStudySeconds)} /{' '}
            {formatStudyTime(weeklyGoalSeconds)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-indigo-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${weeklyProgress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          {weeklyProgress >= 100
            ? '🎉 Goal reached this week!'
            : `${weeklyProgress}% — keep it up!`}
        </p>
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
    <div className="bg-white rounded-2xl shadow p-4 text-center">
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
