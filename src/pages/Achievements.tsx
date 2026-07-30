import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/schema';
import type { DailyActivity } from '../db/schema';
import { calculateCurrentStreak, calculateLongestStreak } from '../lib/streaks';
import { useSettingsStore } from '../stores/settingsStore';
import { useXPStore } from '../stores/xpStore';
import { useBadgeStore } from '../stores/badgeStore';
import { badgeTally } from '../lib/badge-visibility';
import BadgeCollection from '../components/badges/BadgeCollection';
import Milestones from '../components/dashboard/Milestones';

/**
 * Achievements needed somewhere to live.
 *
 * Badges unlock from XP, letters, lessons and drills, and the app fires an
 * "Achievement Unlocked!" toast when they do — but the collection itself was
 * buried at the bottom of the Dashboard behind the strictest gate, so a learner
 * could be congratulated for something they had no way to go and look at.
 */
export default function Achievements() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [timeXP, setTimeXP] = useState(0);
  const streakFreezes = useSettingsStore((s) => s.streakFreezes);
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const bonusXP = useXPStore((s) => s.bonusXP);
  const unlockedBadges = useBadgeStore((s) => s.unlockedBadges);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [daily, sessions] = await Promise.all([
        db.dailyActivity.toArray(),
        db.studySessions.toArray(),
      ]);
      if (cancelled) return;
      setActivities(daily);
      setTimeXP(sessions.reduce((sum, s) => sum + s.xpEarned, 0));
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentStreak = calculateCurrentStreak(activities, streakFreezes);
  const longestStreak = calculateLongestStreak(activities);
  const badges = badgeTally(activeLanguages, unlockedBadges);
  const totalXP = timeXP + bonusXP;

  return (
    <div className="page-enter">
      <button
        onClick={() => navigate('/')}
        className="inline-flex min-h-[44px] items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline press-feedback"
      >
        ← Back to Dashboard
      </button>
      <h2 className="mt-1 mb-1 text-lg font-semibold text-slate-700 dark:text-slate-200">
        Achievements
      </h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Everything you've earned so far. Badges unlock as you go — there's nothing to lose here.
      </p>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <SummaryTile icon="⭐" value={totalXP.toLocaleString()} label="Total XP" />
        <SummaryTile icon="🏅" value={`${badges.unlocked}/${badges.total}`} label="Badges" />
        <SummaryTile
          icon="🔥"
          value={currentStreak}
          label={longestStreak > currentStreak ? `Best ${longestStreak}` : 'Day streak'}
        />
      </div>

      <Milestones />

      <BadgeCollection />
    </div>
  );
}

function SummaryTile({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 text-center shadow-sm dark:border-white/10 dark:bg-slate-800/90">
      <span className="text-2xl">{icon}</span>
      <p className="mt-1 text-xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
