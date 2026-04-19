import { useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  requestNotificationPermission,
  getNotificationPermission,
  isNotificationSupported,
} from '../../lib/notifications';

export default function NotificationSettings() {
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    dailyReminderTime,
    setDailyReminderTime,
    dueCardAlerts,
    setDueCardAlerts,
    dueCardThreshold,
    setDueCardThreshold,
    quietHoursStart,
    setQuietHoursStart,
    quietHoursEnd,
    setQuietHoursEnd,
    streakReminders,
    setStreakReminders,
    weeklyDigest,
    setWeeklyDigest,
  } = useSettingsStore();
  const [permissionError, setPermissionError] = useState('');

  const permission = getNotificationPermission();

  async function handleToggle() {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      return;
    }

    setPermissionError('');
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationsEnabled(true);
    } else {
      setPermissionError(
        'Notification permission was denied. Please enable it in your browser settings.'
      );
    }
  }

  if (!isNotificationSupported()) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
          Notifications
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Notifications are not supported in this browser.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 space-y-4">
      <h3 className="font-semibold text-gray-700 dark:text-gray-200">
        Notifications
      </h3>

      {/* Master toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-200">
            Enable notifications
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {permission === 'denied'
              ? 'Blocked by browser — check site settings'
              : 'Study reminders and due card alerts'}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={permission === 'denied'}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            notificationsEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
          } ${permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
          role="switch"
          aria-checked={notificationsEnabled}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {permissionError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {permissionError}
        </p>
      )}

      {notificationsEnabled && (
        <>
          {/* Daily reminder time */}
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-200 mb-1">
              Daily reminder time
            </p>
            <input
              type="time"
              value={dailyReminderTime}
              onChange={(e) => setDailyReminderTime(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quiet hours */}
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-200 mb-1">
              Quiet hours
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              No notifications during this window
            </p>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={quietHoursStart}
                onChange={(e) => setQuietHoursStart(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">to</span>
              <input
                type="time"
                value={quietHoursEnd}
                onChange={(e) => setQuietHoursEnd(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Due card alerts toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-200">
                Due card alerts
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Notify when cards pile up
              </p>
            </div>
            <button
              onClick={() => setDueCardAlerts(!dueCardAlerts)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                dueCardAlerts ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              role="switch"
              aria-checked={dueCardAlerts}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  dueCardAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Due card threshold */}
          {dueCardAlerts && (
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                Alert threshold
              </p>
              <div className="flex gap-2">
                {[5, 10, 25, 50].map((n) => (
                  <button
                    key={n}
                    onClick={() => setDueCardThreshold(n)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[36px] ${
                      dueCardThreshold === n
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {n}+ cards
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Streak reminders */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-200">
                Streak protection
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Evening reminder if you haven't studied today
              </p>
            </div>
            <button
              onClick={() => setStreakReminders(!streakReminders)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                streakReminders ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              role="switch"
              aria-checked={streakReminders}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  streakReminders ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Weekly digest */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-200">
                Weekly summary
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Progress summary on Sunday evenings
              </p>
            </div>
            <button
              onClick={() => setWeeklyDigest(!weeklyDigest)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                weeklyDigest ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              role="switch"
              aria-checked={weeklyDigest}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  weeklyDigest ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
