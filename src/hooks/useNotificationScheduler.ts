import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { getDueCount } from '../db/reviews';
import { showNotification, isNotificationSupported } from '../lib/notifications';

const LAST_REMINDER_KEY = 'langlearn-last-daily-reminder';
const LAST_DUE_ALERT_KEY = 'langlearn-last-due-alert';

export function useNotificationScheduler() {
  const enabled = useSettingsStore((s) => s.notificationsEnabled);
  const reminderTime = useSettingsStore((s) => s.dailyReminderTime);
  const dueAlerts = useSettingsStore((s) => s.dueCardAlerts);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !isNotificationSupported()) return;

    const check = async () => {
      const now = new Date();
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
        showNotification('Time to study! 📚', {
          body:
            dueCount > 0
              ? `You have ${dueCount} cards waiting for review!`
              : 'Keep your streak going — practice makes perfect!',
          tag: 'daily-reminder',
        });
      }

      // Due card alert check (every 2 hours, only if > 10 cards due)
      if (dueAlerts) {
        const lastDueAlert = localStorage.getItem(LAST_DUE_ALERT_KEY);
        const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
        if (!lastDueAlert || Number(lastDueAlert) < twoHoursAgo) {
          const dueCount = await getDueCount();
          if (dueCount > 10) {
            localStorage.setItem(LAST_DUE_ALERT_KEY, String(Date.now()));
            showNotification(`${dueCount} cards due! 🃏`, {
              body: 'Your vocabulary cards are piling up — a quick review session would help!',
              tag: 'due-cards',
            });
          }
        }
      }
    };

    check();
    intervalRef.current = window.setInterval(check, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, reminderTime, dueAlerts]);
}
