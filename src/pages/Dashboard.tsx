import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db/schema';
import type { StudySession, DailyActivity } from '../db/schema';
import { getDueCount } from '../db/reviews';
import { getTotalWordCount } from '../db/words';
import { formatStudyTime } from '../lib/xp';
import { calculateCurrentStreak, calculateLongestStreak } from '../lib/streaks';
import { useSettingsStore } from '../stores/settingsStore';
import { useXPStore } from '../stores/xpStore';
import HeatMap from '../components/dashboard/HeatMap';
import LanguageStats from '../components/dashboard/LanguageStats';
import StudyPlan from '../components/dashboard/StudyPlan';
import AddWordModal from '../components/srs/AddWordModal';
import BadgeCollection from '../components/badges/BadgeCollection';
import DailyChallengeCard from '../components/dashboard/DailyChallengeCard';

interface Stats {
  totalWords: number;
  dueCards: number;
  totalStudySeconds: number;
  weekStudySeconds: number;
  timeXP: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [allSessions, setAllSessions] = useState<StudySession[]>([]);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const weeklyGoalMinutes = useSettingsStore((s) => s.weeklyGoalMinutes);
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const bonusXP = useXPStore((s) => s.bonusXP);
  const [showAddModal, setShowAddModal] = useState(false);

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
      const timeXP = sessions.reduce((sum, s) => sum + s.xpEarned, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekSessions = sessions.filter(
        (s) => new Date(s.startTime) >= weekAgo
      );
      const weekStudySeconds = weekSessions.reduce(
        (sum, s) => sum + s.durationSeconds,
        0
      );

      setStats({ totalWords, dueCards, totalStudySeconds, weekStudySeconds, timeXP });

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

  const currentStreak = calculateCurrentStreak(activities);
  const longestStreak = calculateLongestStreak(activities);
  const streakEmoji =
    currentStreak >= 30 ? '🔥🔥🔥' : currentStreak >= 7 ? '🔥🔥' : '🔥';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Dashboard</h2>
        <Link
          to="/settings"
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Settings"
        >
          <span className="text-xl">⚙️</span>
        </Link>
      </div>

      <StudyPlan
        dueCards={stats.dueCards}
        weekStudySeconds={stats.weekStudySeconds}
        weeklyGoalSeconds={weeklyGoalSeconds}
        currentStreak={currentStreak}
      />

      <DailyChallengeCard />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Words Learned" value={stats.totalWords} icon="📚" />
        <StatCard label="Cards Due" value={stats.dueCards} icon="🃏" />
        <StatCard
          label="Total Study Time"
          value={formatStudyTime(stats.totalStudySeconds)}
          icon="⏱️"
        />
        <StatCard label="Total XP" value={stats.timeXP + bonusXP} icon="⭐" />
      </div>

      <Link
        to="/analytics"
        className="block bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-100">SRS Analytics</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">View detailed review statistics</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </div>
      </Link>

      {stats.totalWords === 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 mb-6 text-center">
          <p className="text-indigo-800 dark:text-indigo-200 font-semibold">
            Get started by adding your first word ✨
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            ➕ Add a word
          </button>
        </div>
      )}

      <AddWordModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />

      {stats.totalWords > 0 && (
        <LanguageStats languages={activeLanguages} />
      )}

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

      <BadgeCollection />

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
