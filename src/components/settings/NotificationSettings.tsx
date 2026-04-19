import { useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  requestNotificationPermission,
  getNotificationPermission,
  isNotificationSupported,
} from '../../lib/notifications';

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        checked ? 'gradient-primary' : 'bg-slate-300 dark:bg-slate-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function NotificationSettings() {
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    dailyReminderTime,
    setDailyReminderTime,
    dueCardAlerts,
    setDueCardAlerts,
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
      <section className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-slate-200/60 dark:border-white/10 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
          🔔 Notifications
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Notifications are not supported in this browser.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-slate-200/60 dark:border-white/10 p-4 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
        🔔 Notifications
      </h3>

      {/* Master toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-700 dark:text-slate-200">
            Enable notifications
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {permission === 'denied'
              ? 'Blocked by browser — check site settings'
              : 'Study reminders and due card alerts'}
          </p>
        </div>
        <Toggle
          checked={notificationsEnabled}
          onChange={handleToggle}
          disabled={permission === 'denied'}
        />
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
            <p className="text-sm text-slate-700 dark:text-slate-200 mb-1">
              Daily reminder time
            </p>
            <input
              type="time"
              value={dailyReminderTime}
              onChange={(e) => setDailyReminderTime(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Due card alerts toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-200">
                Due card alerts
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Notify when 10+ cards are due
              </p>
            </div>
            <Toggle
              checked={dueCardAlerts}
              onChange={() => setDueCardAlerts(!dueCardAlerts)}
            />
          </div>
        </>
      )}
    </section>
  );
}
