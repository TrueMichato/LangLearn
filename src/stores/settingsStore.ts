import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PRESETS, type NotificationPreset } from '../lib/notification-presets';

const MAX_STREAK_FREEZES = 3;

interface SettingsState {
  weeklyGoalMinutes: number;
  dailyGoalMinutes: number;
  activeLanguages: string[];
  showStressMarks: boolean;
  darkMode: boolean;
  fontSize: number;
  ttsRate: number;
  reviewBatchSize: number;
  onboardingComplete: boolean;
  notificationsEnabled: boolean;
  dailyReminderTime: string;
  dueCardAlerts: boolean;
  dueCardThreshold: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  streakReminders: boolean;
  streakReminderMinDays: number;
  weeklyDigest: boolean;
  showContextOnCards: boolean;
  streakFreezes: number;
  lastFreezeGrantMilestone: number;
  lastRecapShownWeek: string;
  weeklyWordGoal: number;
  weeklyReviewGoal: number;
  weeklyLessonGoal: number;
  adaptiveReview: boolean;
  scheduler: 'sm2' | 'fsrs';
  fsrsRequestRetention: number;
  // Arabic dialect overlay — MSA is the shared core; a chosen dialect + optional
  // colloquial focus surface dialect-tagged content on top of it.
  arabicDialect: 'msa' | 'egyptian' | 'levantine' | 'gulf' | 'iraqi' | 'maghrebi';
  arabicColloquialFocus: boolean;
  // New notification-system fields
  notificationPreset: NotificationPreset;
  dailyNotificationBudget: number;
  comebackNudges: boolean;
  slippingWarnings: boolean;
  dailyGoalMetCelebration: boolean;
  streakMilestoneAlerts: boolean;
  cloudRemindersEnabled: boolean;
  setWeeklyGoal: (minutes: number) => void;
  setDailyGoal: (minutes: number) => void;
  addLanguage: (lang: string) => void;
  removeLanguage: (lang: string) => void;
  toggleStressMarks: () => void;
  toggleDarkMode: () => void;
  setFontSize: (size: number) => void;
  setTtsRate: (rate: number) => void;
  setReviewBatchSize: (size: number) => void;
  completeOnboarding: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setDailyReminderTime: (time: string) => void;
  setDueCardAlerts: (enabled: boolean) => void;
  setDueCardThreshold: (threshold: number) => void;
  setQuietHoursStart: (time: string) => void;
  setQuietHoursEnd: (time: string) => void;
  setStreakReminders: (enabled: boolean) => void;
  setStreakReminderMinDays: (n: number) => void;
  setWeeklyDigest: (enabled: boolean) => void;
  setShowContextOnCards: (enabled: boolean) => void;
  setStreakFreezes: (n: number) => void;
  consumeStreakFreezes: (n: number) => void;
  grantStreakFreeze: (milestone: number) => void;
  setLastRecapShownWeek: (week: string) => void;
  setWeeklyWordGoal: (n: number) => void;
  setWeeklyReviewGoal: (n: number) => void;
  setWeeklyLessonGoal: (n: number) => void;
  toggleAdaptiveReview: () => void;
  setScheduler: (scheduler: 'sm2' | 'fsrs') => void;
  setFsrsRequestRetention: (retention: number) => void;
  setArabicDialect: (dialect: 'msa' | 'egyptian' | 'levantine' | 'gulf' | 'iraqi' | 'maghrebi') => void;
  setArabicColloquialFocus: (enabled: boolean) => void;
  setNotificationPreset: (preset: NotificationPreset) => void;
  setDailyNotificationBudget: (n: number) => void;
  setComebackNudges: (enabled: boolean) => void;
  setSlippingWarnings: (enabled: boolean) => void;
  setDailyGoalMetCelebration: (enabled: boolean) => void;
  setStreakMilestoneAlerts: (enabled: boolean) => void;
  setCloudRemindersEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      weeklyGoalMinutes: 60,
      dailyGoalMinutes: 5,
      activeLanguages: [],
      showStressMarks: true,
      darkMode: false,
      fontSize: 18,
      ttsRate: 0.9,
      reviewBatchSize: 25,
      onboardingComplete: false,
      notificationsEnabled: false,
      dailyReminderTime: '09:00',
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      showContextOnCards: true,
      streakFreezes: 2,
      lastFreezeGrantMilestone: 0,
      lastRecapShownWeek: '',
      weeklyWordGoal: 20,
      weeklyReviewGoal: 50,
      weeklyLessonGoal: 2,
      adaptiveReview: true,
      scheduler: 'sm2',
      fsrsRequestRetention: 0.9,
      arabicDialect: 'msa',
      arabicColloquialFocus: false,
      notificationPreset: 'balanced' as NotificationPreset,
      ...PRESETS.balanced,
      cloudRemindersEnabled: true,

      setWeeklyGoal: (minutes) => set({ weeklyGoalMinutes: minutes }),
      setDailyGoal: (minutes) => set({ dailyGoalMinutes: minutes }),

      addLanguage: (lang) =>
        set((s) => ({
          activeLanguages: s.activeLanguages.includes(lang)
            ? s.activeLanguages
            : [...s.activeLanguages, lang],
        })),

      removeLanguage: (lang) =>
        set((s) => ({
          activeLanguages: s.activeLanguages.filter((l) => l !== lang),
        })),

      toggleStressMarks: () =>
        set((s) => ({ showStressMarks: !s.showStressMarks })),

      toggleDarkMode: () =>
        set((s) => {
          const newMode = !s.darkMode;
          document.documentElement.classList.toggle('dark', newMode);
          return { darkMode: newMode };
        }),

      setFontSize: (size) => set({ fontSize: size }),
      setTtsRate: (rate) => set({ ttsRate: rate }),
      setReviewBatchSize: (size) => set({ reviewBatchSize: size }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setDailyReminderTime: (time) => set({ dailyReminderTime: time }),
      setDueCardAlerts: (enabled) => set({ dueCardAlerts: enabled, notificationPreset: 'custom' }),
      setDueCardThreshold: (threshold) => set({ dueCardThreshold: threshold, notificationPreset: 'custom' }),
      setQuietHoursStart: (time) => set({ quietHoursStart: time }),
      setQuietHoursEnd: (time) => set({ quietHoursEnd: time }),
      setStreakReminders: (enabled) => set({ streakReminders: enabled, notificationPreset: 'custom' }),
      setStreakReminderMinDays: (n) => set({ streakReminderMinDays: n, notificationPreset: 'custom' }),
      setWeeklyDigest: (enabled) => set({ weeklyDigest: enabled, notificationPreset: 'custom' }),
      setShowContextOnCards: (enabled) => set({ showContextOnCards: enabled }),
      setStreakFreezes: (n) => set({ streakFreezes: Math.max(0, Math.min(MAX_STREAK_FREEZES, n)) }),
      consumeStreakFreezes: (n) =>
        set((s) => ({ streakFreezes: Math.max(0, s.streakFreezes - n) })),
      grantStreakFreeze: (milestone) =>
        set((s) =>
          milestone > s.lastFreezeGrantMilestone
            ? {
                streakFreezes: Math.min(MAX_STREAK_FREEZES, s.streakFreezes + 1),
                lastFreezeGrantMilestone: milestone,
              }
            : {}
        ),
      setLastRecapShownWeek: (week) => set({ lastRecapShownWeek: week }),
      setWeeklyWordGoal: (n) => set({ weeklyWordGoal: n }),
      setWeeklyReviewGoal: (n) => set({ weeklyReviewGoal: n }),
      setWeeklyLessonGoal: (n) => set({ weeklyLessonGoal: n }),
      toggleAdaptiveReview: () => set((s) => ({ adaptiveReview: !s.adaptiveReview })),
      setScheduler: (scheduler) => set({ scheduler }),
      setFsrsRequestRetention: (fsrsRequestRetention) => set({ fsrsRequestRetention }),
      setArabicDialect: (arabicDialect) => set({ arabicDialect }),
      setArabicColloquialFocus: (arabicColloquialFocus) => set({ arabicColloquialFocus }),
      setNotificationPreset: (preset) => {
        if (preset === 'custom') {
          set({ notificationPreset: 'custom' });
        } else {
          set({ notificationPreset: preset, ...PRESETS[preset] });
        }
      },
      setDailyNotificationBudget: (n) => set({ dailyNotificationBudget: n, notificationPreset: 'custom' }),
      setComebackNudges: (enabled) => set({ comebackNudges: enabled, notificationPreset: 'custom' }),
      setSlippingWarnings: (enabled) => set({ slippingWarnings: enabled, notificationPreset: 'custom' }),
      setDailyGoalMetCelebration: (enabled) => set({ dailyGoalMetCelebration: enabled, notificationPreset: 'custom' }),
      setStreakMilestoneAlerts: (enabled) => set({ streakMilestoneAlerts: enabled, notificationPreset: 'custom' }),
      setCloudRemindersEnabled: (enabled) => set({ cloudRemindersEnabled: enabled }),
    }),
    {
      name: 'langlearn-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
