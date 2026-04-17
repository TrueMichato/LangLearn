import { useEffect, useState } from 'react';
import { useBadgeStore } from '../../stores/badgeStore';
import { BADGE_MAP } from '../../data/badges';

export default function BadgeToast() {
  const lastToast = useBadgeStore((s) => s.lastToast);
  const clearToast = useBadgeStore((s) => s.clearToast);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastToast) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(clearToast, 300); // wait for exit animation
    }, 4000);

    return () => clearTimeout(timer);
  }, [lastToast, clearToast]);

  if (!lastToast) return null;
  const badge = BADGE_MAP.get(lastToast);
  if (!badge) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-indigo-200 dark:border-indigo-700 px-5 py-3 flex items-center gap-3">
        <span className="text-3xl">{badge.icon}</span>
        <div>
          <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide">
            Achievement Unlocked!
          </p>
          <p className="font-bold text-gray-800 dark:text-gray-100">
            {badge.name}
          </p>
        </div>
      </div>
    </div>
  );
}
