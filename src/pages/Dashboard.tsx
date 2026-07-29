import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../db/schema';
import type { StudySession, DailyActivity } from '../db/schema';
import { getDueCount } from '../db/reviews';
import { getTotalWordCount } from '../db/words';
import { formatStudyTime } from '../lib/xp';
import { calculateCurrentStreak, calculateLongestStreak, todayStr, reconcileFreezes } from '../lib/streaks';
import { useSettingsStore } from '../stores/settingsStore';
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
import SuggestedNext from '../components/dashboard/SuggestedNext';
import Milestones from '../components/dashboard/Milestones';
import VocabSizeCard from '../components/dashboard/VocabSizeCard';
import { PageSkeleton } from '../components/common/Skeleton';
import StudyTip from '../components/common/StudyTip';
import StartingPoints from '../components/onboarding/StartingPoints';
import { hasStarted, hasProgress } from '../lib/dashboard-gates';

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

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [allSessions, setAllSessions] = useState<StudySession[]>([]);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const weeklyGoalMinutes = useSettingsStore((s) => s.weeklyGoalMinutes);
  const dailyGoalMinutes = useSettingsStore((s) => s.dailyGoalMinutes);
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const streakFreezes = useSettingsStore((s) => s.streakFreezes);
  const consumeStreakFreezes = useSettingsStore((s) => s.consumeStreakFreezes);
  const grantStreakFreeze = useSettingsStore((s) => s.grantStreakFreeze);
  const bonusXP = useXPStore((s) => s.bonusXP);
  const [showAddModal, setShowAddModal] = useState(false);
  const greeting = useMemo(getGreeting, []);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
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

    const lessonsTouched =
      (await db.characterProgress.count()) + (await db.lessonProgress.count());

    setStats({
      totalWords,
      dueCards,
      totalStudySeconds,
      weekStudySeconds,
      timeXP,
      lessonsTouched,
    });

    const dailyActivities = await db.dailyActivity.toArray();

    // Spend explicit streak freezes on any missed days that need bridging.
    const spent = await reconcileFreezes(streakFreezes);
    if (spent > 0) {
      consumeStreakFreezes(spent);
      setActivities(await db.dailyActivity.toArray());
    } else {
      setActivities(dailyActivities);
    }
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

  if (!stats) {
    return <PageSkeleton />;
  }

  const weeklyGoalSeconds = weeklyGoalMinutes * 60;

  const currentStreak = calculateCurrentStreak(activities, streakFreezes);
  const longestStreak = calculateLongestStreak(activities);

  const streakEmoji =
    currentStreak >= 30 ? '🔥🔥🔥' : currentStreak >= 7 ? '🔥🔥' : '🔥';
  const isMilestone = currentStreak >= 100 || currentStreak === 30 || currentStreak === 7;

  // Two gates, not one — see src/lib/dashboard-gates.ts for why.
  const activity = {
    totalWords: stats.totalWords,
    totalStudySeconds: stats.totalStudySeconds,
    lessonsTouched: stats.lessonsTouched,
    bonusXP,
  };
  const started = hasStarted(activity);
  const progress = hasProgress(activity);
  const firstLanguage = activeLanguages[0];

  return (
    <div className="page-enter">
      <WeeklyRecapModal />
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            {greeting.text} {greeting.emoji}
          </p>
          <h2 className="text-sm text-slate-500 dark:text-slate-400">Dashboard</h2>
        </div>
        <Link
          to="/settings"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Settings"
        >
          <span className="text-xl">⚙️</span>
        </Link>
      </div>

      <StudyPlan
        dueCards={stats.dueCards}
        todayStudySeconds={activities.find((a) => a.date === todayStr())?.studySeconds ?? 0}
        dailyGoalSeconds={dailyGoalMinutes * 60}
        weekStudySeconds={stats.weekStudySeconds}
        weeklyGoalSeconds={weeklyGoalSeconds}
        currentStreak={currentStreak}
        streakFreezes={streakFreezes}
        hasData={started}
      />

      {!started ? (
        <div className="mb-6">
          {firstLanguage ? (
            <StartingPoints
              language={firstLanguage}
              onSelect={(point) => navigate(point.route)}
              heading="Start here"
              description="Pick one — it takes about two minutes."
            />
          ) : (
            <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-800 p-4">
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                Choose a language to begin
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Pick what you're learning and we'll suggest where to start.
              </p>
              <Link
                to="/settings"
                className="mt-3 inline-flex min-h-[44px] items-center rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Choose a language
              </Link>
            </div>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-3 min-h-[44px] px-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Already have a word list? Add one manually
          </button>
        </div>
      ) : (
        <>
          {progress && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <StatCard label="Words Learned" value={stats.totalWords} icon="📚" />
              <StatCard label="Cards Due" value={stats.dueCards} icon="🃏" />
              <StatCard label="Total Study Time" value={formatStudyTime(stats.totalStudySeconds)} icon="⏱️" />
              <StatCard label="Total XP" value={stats.timeXP + bonusXP} icon="⭐" />
            </div>
          )}

          <SuggestedNext />

          <MistakeDeckCard />

          <DailyChallengeCard />

          {progress && (
            <>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 mt-8">
            Your progress
          </h3>

          <WeeklyGoals />

          <ReviewForecast />

          <Milestones />

          {stats.totalWords > 0 && (
            <LanguageStats languages={activeLanguages} />
          )}

          <VocabSizeCard />

          <Link
            to="/analytics"
            className="block bg-white dark:bg-slate-800/90 rounded-2xl shadow p-4 mb-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📈</span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">Your stats</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Retention, forecasts and review history</p>
                </div>
              </div>
              <span className="text-slate-500 dark:text-slate-400">→</span>
            </div>
          </Link>

          <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow p-4 mb-6">
            {currentStreak > 0 ? (
              <>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-center">
                  <span
                    className="inline-block animate-[wiggle_0.8s_ease-in-out_2]"
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
            </>
          )}
        </>
      )}

      <StudyTip context="dashboard" className="mb-6" />

      {progress && (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow p-4 mt-4">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">
            Study Activity
          </h3>
          <HeatMap studySessions={allSessions} />
        </div>
      )}

      <AddWordModal isOpen={showAddModal} onClose={() => { setShowAddModal(false); loadData(); }} />
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
    <div className="bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-white/10 rounded-2xl shadow-sm p-4 text-center">
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
