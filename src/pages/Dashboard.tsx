import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db/schema';
import type { StudySession, DailyActivity } from '../db/schema';
import { getDueCount } from '../db/reviews';
import { getTotalWordCount } from '../db/words';
import { calculateCurrentStreak, calculateLongestStreak, todayStr, reconcileFreezes } from '../lib/streaks';
import { useSettingsStore } from '../stores/settingsStore';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import { useXPStore } from '../stores/xpStore';
import HeatMap from '../components/dashboard/HeatMap';
import LanguageStats from '../components/dashboard/LanguageStats';
import StudyPlan from '../components/dashboard/StudyPlan';
import AddWordModal from '../components/srs/AddWordModal';
import BadgeCollection from '../components/badges/BadgeCollection';
import DailyChallengeCard from '../components/dashboard/DailyChallengeCard';
import MistakeDeckCard from '../components/dashboard/MistakeDeckCard';
import ReviewForecast from '../components/dashboard/ReviewForecast';
import WeeklyGoals from '../components/dashboard/WeeklyGoals';
import WeeklyRecapModal from '../components/dashboard/WeeklyRecapModal';
import HomeNextAction from '../components/dashboard/HomeNextAction';
import DashboardProgress from '../components/dashboard/DashboardProgress';
import Milestones from '../components/dashboard/Milestones';
import VocabSizeCard from '../components/dashboard/VocabSizeCard';
import { PageSkeleton } from '../components/common/Skeleton';
import StudyTip from '../components/common/StudyTip';
import { hasStarted, hasMatureDashboard, hasHistory } from '../lib/dashboard-gates';
import { useBadgeStore } from '../stores/badgeStore';
import { badgeTally } from '../lib/badge-visibility';

interface Stats {
  totalWords: number;
  dueCards: number;
  totalStudySeconds: number;
  weekStudySeconds: number;
  timeXP: number;
  /* Letters and lessons are real study even before they produce a word or a
     timed session. Without them the dashboard forgets a learner who did
     exactly what the on-ramp told them to do. */
  lessonsTouched: number;
}

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour <= 11) return { text: 'Good morning', emoji: '🌅' };
  if (hour >= 12 && hour <= 17) return { text: 'Good afternoon', emoji: '☀️' };
  return { text: 'Good evening', emoji: '🌙' };
}

async function loadDashboardData(streakFreezes: number) {
  const [totalWords, dueCards, sessions, dailyActivities, charactersTouched, lessonsTouched] = await Promise.all([
    getTotalWordCount(),
    getDueCount(),
    db.studySessions.toArray(),
    db.dailyActivity.toArray(),
    db.characterProgress.count(),
    db.lessonProgress.count(),
  ]);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const stats: Stats = {
    totalWords, dueCards,
    totalStudySeconds: sessions.reduce((sum, session) => sum + session.durationSeconds, 0),
    weekStudySeconds: sessions.filter((session) => new Date(session.startTime) >= weekAgo)
      .reduce((sum, session) => sum + session.durationSeconds, 0),
    timeXP: sessions.reduce((sum, session) => sum + session.xpEarned, 0),
    lessonsTouched: charactersTouched + lessonsTouched,
  };
  const spent = await reconcileFreezes(streakFreezes);
  return {
    stats, sessions, spent,
    activities: spent > 0 ? await db.dailyActivity.toArray() : dailyActivities,
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [allSessions, setAllSessions] = useState<StudySession[]>([]);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const weeklyGoalMinutes = useSettingsStore((s) => s.weeklyGoalMinutes);
  const dailyGoalMinutes = useSettingsStore((s) => s.dailyGoalMinutes);
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const { language: currentLanguage } = useCurrentLanguage();
  const streakFreezes = useSettingsStore((s) => s.streakFreezes);
  const consumeStreakFreezes = useSettingsStore((s) => s.consumeStreakFreezes);
  const grantStreakFreeze = useSettingsStore((s) => s.grantStreakFreeze);
  const bonusXP = useXPStore((s) => s.bonusXP);
  const unlockedBadges = useBadgeStore((s) => s.unlockedBadges);
  const [showAddModal, setShowAddModal] = useState(false);
  const greeting = useMemo(() => getGreeting(), []);

  const loadData = useCallback(() => {
    return loadDashboardData(streakFreezes).then((data) => {
      setAllSessions(data.sessions);
      setStats(data.stats);
      setActivities(data.activities);
      if (data.spent > 0) consumeStreakFreezes(data.spent);
      setLoadError(false);
    }).catch(() => { setLoadError(true); });
  }, [streakFreezes, consumeStreakFreezes]);

  // Load on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload when page becomes visible (user returns from another tab/page)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [loadData]);

  // Grant a bonus freeze when reaching a streak milestone (idempotent via store).
  useEffect(() => {
    if (activities.length === 0) return;
    const streak = calculateCurrentStreak(activities, streakFreezes);
    for (const milestone of [7, 30, 100]) {
      if (streak >= milestone) grantStreakFreeze(milestone);
    }
  }, [activities, streakFreezes, grantStreakFreeze]);

  if (loadError) {
    return <div role="alert" className="space-y-3 text-slate-700 dark:text-slate-200">
      <h1 className="text-xl font-semibold">Home could not be loaded</h1>
      <p>Your review count and progress could not be read. Please try again.</p>
      <button onClick={() => { void loadData(); }} className="min-h-[44px] rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700">Retry loading Home</button>
    </div>;
  }
  if (!stats) {
    return <PageSkeleton />;
  }

  const weeklyGoalSeconds = weeklyGoalMinutes * 60;

  const currentStreak = calculateCurrentStreak(activities, streakFreezes);
  const longestStreak = calculateLongestStreak(activities);

  const badges = badgeTally(activeLanguages, unlockedBadges);
  const activity = {
    totalWords: stats.totalWords,
    totalStudySeconds: stats.totalStudySeconds,
    lessonsTouched: stats.lessonsTouched,
    bonusXP,
    earnedBadges: badges.unlocked,
    activeDays: activities.filter((a) => a.studySeconds > 0 || a.cardsReviewed > 0 || a.wordsAdded > 0 || a.challengeComplete).length,
  };
  const started = hasStarted(activity);
  const mature = hasMatureDashboard(activity);
  const history = hasHistory(activity);

  return (
    <div className="page-enter">
      {history && <WeeklyRecapModal />}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            {greeting.text} {greeting.emoji}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Home</p>
        </div>
        <Link
          to="/settings"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Settings"
        >
          <span className="text-xl">⚙️</span>
        </Link>
      </div>

      <HomeNextAction key={currentLanguage ?? ''} dueCards={stats.dueCards} language={currentLanguage} />

      <DashboardProgress activity={activity} totalXP={stats.timeXP + bonusXP} />

      {mature && (
        <>
          <h2 className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">Optional practice</h2>
          <MistakeDeckCard />
          <DailyChallengeCard />
        </>
      )}

      {history && (
        <>
          <StudyPlan
            todayStudySeconds={activities.find((a) => a.date === todayStr())?.studySeconds ?? 0}
            dailyGoalSeconds={dailyGoalMinutes * 60}
            weekStudySeconds={stats.weekStudySeconds}
            weeklyGoalSeconds={weeklyGoalSeconds}
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            streakFreezes={streakFreezes}
          />
          <WeeklyGoals />
          <ReviewForecast />
          <Milestones />
          {stats.totalWords > 0 && <LanguageStats languages={activeLanguages} />}
          <VocabSizeCard />
          <BadgeCollection />
        </>
      )}

      {history && (
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-white/10 rounded-2xl shadow-sm p-4 mb-6">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">
            Study Activity
          </h3>
          <HeatMap studySessions={allSessions} />
        </div>
      )}

      {started && <StudyTip context="dashboard" className="mb-6" />}
      <button onClick={() => setShowAddModal(true)}
        className="mb-3 min-h-[44px] rounded-xl px-1 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
        Already have a word list? Add one manually
      </button>
      <AddWordModal isOpen={showAddModal} onClose={() => { setShowAddModal(false); loadData(); }} />
    </div>
  );
}
