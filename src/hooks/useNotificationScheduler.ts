import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { isNotificationSupported } from '../lib/notifications';
import { refreshNotifications, tickInApp } from '../lib/notification-scheduler';

export function useNotificationScheduler() {
  // Pull every notification-relevant setting so the effect re-runs on change.
  const prefs = useSettingsStore((s) => ({
    notificationsEnabled: s.notificationsEnabled,
    dailyReminderTime: s.dailyReminderTime,
    quietHoursStart: s.quietHoursStart,
    quietHoursEnd: s.quietHoursEnd,
    dailyNotificationBudget: s.dailyNotificationBudget,
    dueCardAlerts: s.dueCardAlerts,
    dueCardThreshold: s.dueCardThreshold,
    streakReminders: s.streakReminders,
    streakReminderMinDays: s.streakReminderMinDays,
    weeklyDigest: s.weeklyDigest,
    comebackNudges: s.comebackNudges,
    slippingWarnings: s.slippingWarnings,
    dailyGoalMetCelebration: s.dailyGoalMetCelebration,
    streakMilestoneAlerts: s.streakMilestoneAlerts,
    dailyGoalMinutes: s.dailyGoalMinutes,
    weeklyGoalMinutes: s.weeklyGoalMinutes,
  }));
  const intervalRef = useRef<number | null>(null);

  // Stable JSON-key for the effect deps.
  const prefsKey = JSON.stringify(prefs);

  useEffect(() => {
    if (!isNotificationSupported()) return;

    const run = async () => {
      await refreshNotifications(prefs);
      await tickInApp(prefs);
    };

    void run();

    intervalRef.current = window.setInterval(run, 5 * 60 * 1000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void run();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // prefs is captured by closure; key triggers re-subscription on changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefsKey]);
}

