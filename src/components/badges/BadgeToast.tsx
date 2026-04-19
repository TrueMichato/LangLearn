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
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 rounded-2xl shadow-lg border border-amber-300 dark:border-amber-700 px-5 py-3 flex items-center gap-3 animate-[pulseGlow_1.5s_ease-in-out_3]">
        <span className="text-3xl animate-[pop_0.5s_ease-out]">{badge.icon}</span>
        <div>
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
            Achievement Unlocked!
          </p>
          <p className="font-bold text-slate-800 dark:text-slate-100">
            {badge.name}
          </p>
        </div>
        {/* Auto-dismiss countdown bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1">
          <div className="h-full bg-amber-400 dark:bg-amber-500 animate-[dismissCountdown_4s_linear_forwards]" />
        </div>
      </div>
    </div>
  );
}
