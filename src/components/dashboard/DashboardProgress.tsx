import { Link } from 'react-router-dom';
import { hasStarted, type DashboardActivity } from '../../lib/dashboard-gates';
import { formatStudyTime } from '../../lib/xp';

export default function DashboardProgress({ activity, totalXP }: {
  activity: DashboardActivity;
  totalXP: number;
}) {
  if (!hasStarted(activity) && totalXP <= 0) return null;
  const progress = [
    activity.totalWords > 0 ? `${activity.totalWords} saved card${activity.totalWords === 1 ? '' : 's'}` : null,
    activity.totalStudySeconds > 0
      ? `${activity.totalStudySeconds < 60 ? `${activity.totalStudySeconds}s` : formatStudyTime(activity.totalStudySeconds)} studied`
      : null,
  ].filter(Boolean);

  return (
    <section aria-labelledby="home-progress" className="mb-6 border-t border-slate-200/70 pt-4 dark:border-white/10">
      <h2 id="home-progress" className="font-semibold text-slate-800 dark:text-slate-100">Your progress</h2>
      {progress.length > 0 && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{progress.join(' · ')}</p>}
      <Link to="/achievements" className="mt-2 flex min-h-[44px] flex-wrap items-center gap-x-2 rounded-xl py-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
        <span>🏅 Achievements</span>
        {totalXP > 0 && <span>· {totalXP} XP earned</span>}
        {(activity.earnedBadges ?? 0) > 0 && <span>· {activity.earnedBadges} badge{activity.earnedBadges === 1 ? '' : 's'} earned</span>}
      </Link>
      <Link to="/analytics" className="inline-flex min-h-[44px] items-center rounded-xl py-2 text-sm text-slate-500 hover:underline dark:text-slate-400">Your stats →</Link>
    </section>
  );
}
