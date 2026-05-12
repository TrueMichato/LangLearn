import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import {
  isNotificationSupported,
  requestNotificationPermission,
  registerPeriodicSync,
  supportsPeriodicSync,
} from '../lib/notifications';
import { refreshNotifications, tickInApp, mirrorPrefsToIDB } from '../lib/notification-scheduler';
import type { FullPrefs } from '../lib/notification-scheduler';
import {
  ensurePushSubscription,
  syncPushPrefs,
  disablePush,
  isCloudPushConfigured,
  hasActivePushSubscription,
} from '../lib/push-subscription';

function buildPrefs(): FullPrefs {
  const s = useSettingsStore.getState();
  return {
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
  };
}

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
  const cloudRemindersEnabled = useSettingsStore((s) => s.cloudRemindersEnabled);

  const intervalRef = useRef<number | null>(null);

  // Auto-request notification permission when notifications are enabled
  useEffect(() => {
    if (!notificationsEnabled || !isNotificationSupported()) return;
    if (Notification.permission === 'default') {
      requestNotificationPermission();
    }
  }, [notificationsEnabled]);

  // Mirror prefs to IDB immediately whenever any notification setting changes,
  // so the service worker always has fresh prefs for background notifications.
  useEffect(() => {
    void mirrorPrefsToIDB(buildPrefs());
    // Sync to cloud worker too — debounced.
    if (notificationsEnabled && cloudRemindersEnabled) {
      syncPushPrefs(buildPrefs());
    }
  }, [
    notificationsEnabled, dailyReminderTime, quietHoursStart, quietHoursEnd,
    dailyNotificationBudget, dueCardAlerts, dueCardThreshold, streakReminders,
    streakReminderMinDays, weeklyDigest, comebackNudges, slippingWarnings,
    dailyGoalMetCelebration, streakMilestoneAlerts, dailyGoalMinutes, weeklyGoalMinutes,
    cloudRemindersEnabled,
  ]);

  // Cloud subscription lifecycle: subscribe when the master toggle + cloud
  // toggle are both on, unsubscribe when either turns off.
  useEffect(() => {
    if (!isCloudPushConfigured()) return;
    let cancelled = false;
    const run = async () => {
      if (notificationsEnabled && cloudRemindersEnabled) {
        // Wait one tick for permission UI before subscribing.
        await new Promise((r) => setTimeout(r, 250));
        if (cancelled) return;
        if (Notification.permission !== 'granted') return;
        await ensurePushSubscription(buildPrefs());
      } else if (await hasActivePushSubscription()) {
        await disablePush();
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [notificationsEnabled, cloudRemindersEnabled]);

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
      // Fire due notifications from the existing plan BEFORE refreshing,
      // so past-due notifications aren't lost when the plan is replaced.
      await tickInApp(prefs);
      await refreshNotifications(prefs);
    };

    void run();

    intervalRef.current = window.setInterval(run, 5 * 60 * 1000);

    // On visibility change: run when visible, mirror prefs to IDB when hidden
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void run();
        // Re-register periodic sync each time the user comes back. The browser
        // sometimes drops registrations and only re-registering "warm" sites
        // earns wake budget. Cheap no-op when already registered.
        if (supportsPeriodicSync() && prefs.notificationsEnabled) {
          void registerPeriodicSync();
        }
      } else {
        // App going to background — push fresh prefs to IDB so SW has them
        void mirrorPrefsToIDB(buildPrefs());
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Last-chance sync before unload
    const onBeforeUnload = () => {
      void mirrorPrefsToIDB(buildPrefs());
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
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

