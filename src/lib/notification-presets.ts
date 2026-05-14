export type NotificationPreset = 'gentle' | 'balanced' | 'persistent' | 'custom';

export interface NotificationPrefs {
  notificationsEnabled: boolean;
  dailyReminderTime: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  dailyNotificationBudget: number;

  dueCardAlerts: boolean;
  dueCardThreshold: number;

  streakReminders: boolean;
  streakReminderMinDays: number;

  weeklyDigest: boolean;
  comebackNudges: boolean;
  slippingWarnings: boolean;
  dailyGoalMetCelebration: boolean;
  streakMilestoneAlerts: boolean;

  /**
   * IANA timezone (e.g. "Asia/Jerusalem"). Optional — when missing the planner
   * falls back to the runtime's TZ. The client always populates it via
   * Intl.DateTimeFormat().resolvedOptions().timeZone so the worker (which is
   * UTC) schedules at the correct local wall-clock.
   */
  timezone?: string;
}

export type PresetFields = Omit<
  NotificationPrefs,
  'notificationsEnabled' | 'dailyReminderTime' | 'quietHoursStart' | 'quietHoursEnd'
>;

export const PRESETS: Record<Exclude<NotificationPreset, 'custom'>, PresetFields> = {
  gentle: {
    dailyNotificationBudget: 1,
    dueCardAlerts: false,
    dueCardThreshold: 50,
    streakReminders: false,
    streakReminderMinDays: 7,
    weeklyDigest: true,
    comebackNudges: true,
    slippingWarnings: false,
    dailyGoalMetCelebration: false,
    streakMilestoneAlerts: true,
  },
  balanced: {
    dailyNotificationBudget: 3,
    dueCardAlerts: true,
    dueCardThreshold: 25,
    streakReminders: true,
    streakReminderMinDays: 3,
    weeklyDigest: true,
    comebackNudges: true,
    slippingWarnings: true,
    dailyGoalMetCelebration: false,
    streakMilestoneAlerts: true,
  },
  persistent: {
    dailyNotificationBudget: 5,
    dueCardAlerts: true,
    dueCardThreshold: 10,
    streakReminders: true,
    streakReminderMinDays: 1,
    weeklyDigest: true,
    comebackNudges: true,
    slippingWarnings: true,
    dailyGoalMetCelebration: true,
    streakMilestoneAlerts: true,
  },
};

/** Returns true if the prefs match the given preset's category settings. */
export function matchesPreset(
  prefs: NotificationPrefs,
  preset: Exclude<NotificationPreset, 'custom'>
): boolean {
  const target = PRESETS[preset];
  return (Object.keys(target) as (keyof PresetFields)[]).every(
    (k) => prefs[k] === target[k]
  );
}

export function detectPreset(prefs: NotificationPrefs): NotificationPreset {
  for (const name of ['gentle', 'balanced', 'persistent'] as const) {
    if (matchesPreset(prefs, name)) return name;
  }
  return 'custom';
}
