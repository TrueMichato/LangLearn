import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { getDueCount } from '../db/reviews';
import { showNotification, isNotificationSupported } from '../lib/notifications';

const LAST_REMINDER_KEY = 'langlearn-last-daily-reminder';
const LAST_DUE_ALERT_KEY = 'langlearn-last-due-alert';
const LAST_STREAK_ALERT_KEY = 'langlearn-last-streak-alert';
const LAST_WEEKLY_DIGEST_KEY = 'langlearn-last-weekly-digest';

const DAILY_MESSAGES = [
  'Time to study! 📚',
  'Ready to learn something new? 🌱',
  'Your vocabulary awaits! 🎓',
  'A little practice goes a long way! ✨',
  'Let\'s keep the momentum going! 🚀',
];

const DUE_CARD_MESSAGES = [
  'Your vocabulary cards are piling up — a quick review session would help!',
  'A short review now keeps forgetting away!',
  'Just a few minutes of review can make a big difference!',
  'Stay on top of your reviews — your future self will thank you!',
];

const STREAK_MESSAGES = [
  'Don\'t lose your streak! A quick session keeps it alive 🔥',
  'Your streak is at risk — even 5 minutes counts! ⏰',
  'Keep the fire going! Study today to protect your streak 🔥',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isInQuietHours(now: Date, start: string, end: string): boolean {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    // Same day range (e.g., 08:00 - 12:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Overnight range (e.g., 22:00 - 07:00)
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export function useNotificationScheduler() {
  const enabled = useSettingsStore((s) => s.notificationsEnabled);
  const reminderTime = useSettingsStore((s) => s.dailyReminderTime);
  const dueAlerts = useSettingsStore((s) => s.dueCardAlerts);
  const dueCardThreshold = useSettingsStore((s) => s.dueCardThreshold);
  const quietHoursStart = useSettingsStore((s) => s.quietHoursStart);
  const quietHoursEnd = useSettingsStore((s) => s.quietHoursEnd);
  const streakReminders = useSettingsStore((s) => s.streakReminders);
  const weeklyDigest = useSettingsStore((s) => s.weeklyDigest);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !isNotificationSupported()) return;

    const check = async () => {
      const now = new Date();

      // Respect quiet hours
      if (isInQuietHours(now, quietHoursStart, quietHoursEnd)) return;

      const todayKey = now.toISOString().slice(0, 10);

      // Daily reminder check
      const [reminderH, reminderM] = reminderTime.split(':').map(Number);
      const lastReminder = localStorage.getItem(LAST_REMINDER_KEY);
      if (
        lastReminder !== todayKey &&
        now.getHours() >= reminderH &&
        now.getMinutes() >= reminderM
      ) {
        localStorage.setItem(LAST_REMINDER_KEY, todayKey);
        const dueCount = await getDueCount();
        const title = pickRandom(DAILY_MESSAGES);
        showNotification(title, {
          body:
            dueCount > 0
              ? `You have ${dueCount} cards waiting for review!`
              : 'Keep your streak going — practice makes perfect!',
          tag: 'daily-reminder',
        });
      }

      // Due card alert check (configurable threshold and 2-hour cooldown)
      if (dueAlerts) {
        const lastDueAlert = localStorage.getItem(LAST_DUE_ALERT_KEY);
        const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
        if (!lastDueAlert || Number(lastDueAlert) < twoHoursAgo) {
          const dueCount = await getDueCount();
          if (dueCount > dueCardThreshold) {
            localStorage.setItem(LAST_DUE_ALERT_KEY, String(Date.now()));
            showNotification(`${dueCount} cards due! 🃏`, {
              body: pickRandom(DUE_CARD_MESSAGES),
              tag: 'due-cards',
            });
          }
        }
      }

      // Streak protection reminder (evening, once per day)
      if (streakReminders) {
        const lastStreakAlert = localStorage.getItem(LAST_STREAK_ALERT_KEY);
        const isEvening = now.getHours() >= 19 && now.getHours() < 22;
        if (lastStreakAlert !== todayKey && isEvening) {
          // Check if user has studied today by looking at dailyActivity
          const { db } = await import('../db/schema');
          const todayActivity = await db.dailyActivity.get(todayKey);
          if (!todayActivity || (todayActivity.studySeconds ?? 0) === 0) {
            localStorage.setItem(LAST_STREAK_ALERT_KEY, todayKey);
            showNotification(pickRandom(STREAK_MESSAGES), {
              body: 'Open LangLearn and practice for a few minutes.',
              tag: 'streak-reminder',
            });
          }
        }
      }

      // Weekly digest (Sunday evening)
      if (weeklyDigest) {
        const lastWeeklyDigest = localStorage.getItem(LAST_WEEKLY_DIGEST_KEY);
        const isSunday = now.getDay() === 0;
        const isDigestTime = now.getHours() >= 18 && now.getHours() < 21;
        const weekKey = `${now.getFullYear()}-W${Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 604800000)}`;
        if (isSunday && isDigestTime && lastWeeklyDigest !== weekKey) {
          localStorage.setItem(LAST_WEEKLY_DIGEST_KEY, weekKey);
          const dueCount = await getDueCount();
          showNotification('Weekly Summary 📊', {
            body: dueCount > 0
              ? `Great week! You have ${dueCount} cards ready for review. Keep it up!`
              : 'Amazing week! All caught up on reviews. 🎉',
            tag: 'weekly-digest',
          });
        }
      }
    };

    check();
    intervalRef.current = window.setInterval(check, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, reminderTime, dueAlerts, dueCardThreshold, quietHoursStart, quietHoursEnd, streakReminders, weeklyDigest]);
}
