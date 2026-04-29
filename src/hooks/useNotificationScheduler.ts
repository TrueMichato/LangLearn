import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { isNotificationSupported } from '../lib/notifications';
import { refreshNotifications, tickInApp } from '../lib/notification-scheduler';

export function useNotificationScheduler() {
  // Subscribe to each setting individually so Zustand can use referential
  // equality on primitives. Returning a fresh object from a selector causes
  // an infinite render loop (React error #185).
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const dailyReminderTime = useSettingsStore((s) => s.dailyReminderTime);
  const quietHoursStart = useSettingsStore((s) => s.quietHoursStart);
  const quietHoursEnd = useSettingsStore((s) => s.quietHoursEnd);
  const dailyNotificationBudget = useSettingsStore((s) => s.dailyNotificationBudget);
  const dueCardAlerts = useSettingsStore((s) => s.dueCardAlerts);
  const dueCardThreshold = useSettingsStore((s) => s.dueCardThreshold);
  const streakReminders = useSettingsStore((s) => s.streakReminders);
  const streakReminderMinDays = useSettingsStore((s) => s.streakReminderMinDays);
  const weeklyDigest = useSettingsStore((s) => s.weeklyDigest);
  const comebackNudges = useSettingsStore((s) => s.comebackNudges);
  const slippingWarnings = useSettingsStore((s) => s.slippingWarnings);
  const dailyGoalMetCelebration = useSettingsStore((s) => s.dailyGoalMetCelebration);
  const streakMilestoneAlerts = useSettingsStore((s) => s.streakMilestoneAlerts);
  const dailyGoalMinutes = useSettingsStore((s) => s.dailyGoalMinutes);
  const weeklyGoalMinutes = useSettingsStore((s) => s.weeklyGoalMinutes);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isNotificationSupported()) return;

    const prefs = {
      notificationsEnabled,
      dailyReminderTime,
      quietHoursStart,
      quietHoursEnd,
      dailyNotificationBudget,
      dueCardAlerts,
      dueCardThreshold,
      streakReminders,
      streakReminderMinDays,
      weeklyDigest,
      comebackNudges,
      slippingWarnings,
      dailyGoalMetCelebration,
      streakMilestoneAlerts,
      dailyGoalMinutes,
      weeklyGoalMinutes,
    };

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
  }, [
    notificationsEnabled,
    dailyReminderTime,
    quietHoursStart,
    quietHoursEnd,
    dailyNotificationBudget,
    dueCardAlerts,
    dueCardThreshold,
    streakReminders,
    streakReminderMinDays,
    weeklyDigest,
    comebackNudges,
    slippingWarnings,
    dailyGoalMetCelebration,
    streakMilestoneAlerts,
    dailyGoalMinutes,
    weeklyGoalMinutes,
  ]);
}

