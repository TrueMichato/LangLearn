import { useState, useEffect, useMemo } from 'react';
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
import { PageSkeleton } from '../components/common/Skeleton';

interface Stats {
  totalWords: number;
  dueCards: number;
  totalStudySeconds: number;
  weekStudySeconds: number;
  timeXP: number;
}

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour <= 11) return { text: 'Good morning', emoji: '🌅' };
  if (hour >= 12 && hour <= 17) return { text: 'Good afternoon', emoji: '☀️' };
  return { text: 'Good evening', emoji: '🌙' };
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [allSessions, setAllSessions] = useState<StudySession[]>([]);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const weeklyGoalMinutes = useSettingsStore((s) => s.weeklyGoalMinutes);
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const bonusXP = useXPStore((s) => s.bonusXP);
  const [showAddModal, setShowAddModal] = useState(false);
  const greeting = useMemo(getGreeting, []);

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
    return <PageSkeleton />;
  }

  const weeklyGoalSeconds = weeklyGoalMinutes * 60;

  const currentStreak = calculateCurrentStreak(activities);
  const longestStreak = calculateLongestStreak(activities);
  const streakEmoji =
    currentStreak >= 30 ? '🔥🔥🔥' : currentStreak >= 7 ? '🔥🔥' : '🔥';
  const isMilestone = currentStreak >= 100 || currentStreak === 30 || currentStreak === 7;

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            {greeting.text} {greeting.emoji}
          </p>
          <h2 className="text-sm text-slate-500 dark:text-slate-400">Dashboard</h2>
        </div>
        <Link
          to="/settings"
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
        <StatCard
          label="Words Learned"
          value={stats.totalWords}
          icon="📚"
          gradient="from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30"
          accent="border-l-violet-400 dark:border-l-violet-500"
        />
        <StatCard
          label="Cards Due"
          value={stats.dueCards}
          icon="🃏"
          gradient="from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30"
          accent="border-l-amber-400 dark:border-l-amber-500"
        />
        <StatCard
          label="Total Study Time"
          value={formatStudyTime(stats.totalStudySeconds)}
          icon="⏱️"
          gradient="from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30"
          accent="border-l-blue-400 dark:border-l-blue-500"
        />
        <StatCard
          label="Total XP"
          value={stats.timeXP + bonusXP}
          icon="⭐"
          gradient="from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30"
          accent="border-l-emerald-400 dark:border-l-emerald-500"
        />
      </div>

      <Link
        to="/analytics"
        className="block bg-white dark:bg-slate-800/90 rounded-2xl shadow p-4 mb-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">SRS Analytics</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">View detailed review statistics</p>
            </div>
          </div>
          <span className="text-slate-400 dark:text-slate-500">→</span>
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

      <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow p-4 mb-6">
        {currentStreak > 0 ? (
          <>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-center">
              <span
                className="inline-block animate-[wiggle_1s_ease-in-out_infinite]"
                style={isMilestone ? { filter: 'drop-shadow(0 0 8px #f59e0b) drop-shadow(0 0 16px #f97316)' } : undefined}
              >
                {streakEmoji}
              </span>{' '}
              {currentStreak}-day streak
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">
              Best: {longestStreak} days
            </p>
          </>
        ) : (
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 text-center">
            Start your streak today! 💪
          </p>
        )}
      </div>

      <BadgeCollection />

      <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow p-4 mt-4">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">
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
  gradient,
  accent,
}: {
  label: string;
  value: string | number;
  icon: string;
  gradient: string;
  accent: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} border-l-4 ${accent} rounded-2xl shadow p-4 text-center`}>
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
