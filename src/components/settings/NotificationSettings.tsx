import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  requestNotificationPermission,
  getNotificationPermission,
  isNotificationSupported,
  getBackgroundNotificationStatus,
  getLastSyncWake,
  type BackgroundNotifStatus,
} from '../../lib/notifications';
import { fireTestNotification, fireDelayedTestNotification } from '../../lib/notification-scheduler';
import {
  isCloudPushConfigured,
  hasActivePushSubscription,
  sendTestPush,
  getLastWorkerCheck,
} from '../../lib/push-subscription';
import type { NotificationPreset } from '../../lib/notification-presets';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { SettingRange, SettingToggle } from './SettingControls';

const PRESET_LABELS: Record<NotificationPreset, string> = {
  gentle: 'Gentle',
  balanced: 'Balanced',
  persistent: 'Persistent',
  custom: 'Custom',
};

const PRESET_HELP: Record<NotificationPreset, string> = {
  gentle: 'One reminder a day. Weekly digest. No nags.',
  balanced: 'A daily reminder and gentle check-ins. Up to 3 per day.',
  persistent: 'Maximum support — daily, due-card, streak, milestones. Up to 5/day.',
  custom: 'Your own mix.',
};

export default function NotificationSettings() {
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    dailyReminderTime,
    setDailyReminderTime,
    quietHoursStart,
    setQuietHoursStart,
    quietHoursEnd,
    setQuietHoursEnd,
    notificationPreset,
    setNotificationPreset,
    dailyNotificationBudget,
    setDailyNotificationBudget,
    dueCardAlerts,
    setDueCardAlerts,
    dueCardThreshold,
    setDueCardThreshold,
    streakReminders,
    setStreakReminders,
    streakReminderMinDays,
    setStreakReminderMinDays,
    weeklyDigest,
    setWeeklyDigest,
    comebackNudges,
    setComebackNudges,
    slippingWarnings,
    setSlippingWarnings,
    dailyGoalMetCelebration,
    setDailyGoalMetCelebration,
    streakMilestoneAlerts,
    setStreakMilestoneAlerts,
    cloudRemindersEnabled,
    setCloudRemindersEnabled,
  } = useSettingsStore();
  const [permissionError, setPermissionError] = useState('');
  const [bgStatus, setBgStatus] = useState<BackgroundNotifStatus>('not-supported');
  const [lastSyncWake, setLastSyncWake] = useState<number | null>(null);
  const [testFeedback, setTestFeedback] = useState('');
  const [cloudActive, setCloudActive] = useState(false);
  const [lastWorkerCheck, setLastWorkerCheck] = useState<number | null>(null);
  const { status: pwaStatus, promptInstall } = usePWAInstall();

  const permission = getNotificationPermission();
  const cloudConfigured = isCloudPushConfigured();

  useEffect(() => {
    if (notificationsEnabled) {
      void (async () => {
        const active = await hasActivePushSubscription();
        setCloudActive(active);
        setBgStatus(await getBackgroundNotificationStatus(active));
        setLastSyncWake(await getLastSyncWake());
        setLastWorkerCheck(await getLastWorkerCheck());
      })();
    }
  }, [notificationsEnabled, cloudRemindersEnabled]);

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
        'Notification permission was denied. Enable it in your browser settings.'
      );
    }
  }

  if (!isNotificationSupported()) {
    return (
      <section className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-slate-200/70 dark:border-white/10 p-4">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
          🔔 Notifications
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Notifications are not supported in this browser.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-slate-200/70 dark:border-white/10 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
        🔔 Notifications
      </h3>

      {/* Master toggle */}
      <SettingToggle
        id="settings-notifications"
        label="Enable notifications"
        description={permission === 'denied'
          ? 'Blocked by browser — check site settings'
          : 'Habit-supporting reminders and nudges'}
        checked={notificationsEnabled}
        onChange={handleToggle}
        disabled={permission === 'denied'}
      />

      {permissionError && (
        <p role="alert" className="text-sm text-amber-800 dark:text-amber-300">
          {permissionError}
        </p>
      )}

      {notificationsEnabled && (
        <>
          {/* Background notification status — three-tier */}
          <div className={`text-xs rounded-lg px-3 py-2 space-y-2 ${
            bgStatus === 'cloud-active'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
              : bgStatus === 'triggers-active'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                : bgStatus === 'sync-active'
                  ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                  : bgStatus === 'not-installed'
                    ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300'
          }`}>
            {bgStatus === 'cloud-active' && (
              <>
                <p>✅ Cloud reminders active — works on every browser, even fully closed. Pushed from your own LangLearn worker on a 15-minute cadence.</p>
                {lastWorkerCheck != null && lastWorkerCheck > 0 && (
                  <p>Last server-side check: {new Date(lastWorkerCheck).toLocaleString()}</p>
                )}
                {(lastWorkerCheck == null || lastWorkerCheck === 0) && (
                  <p>Last server-side check: pending — usually arrives within 15 min of subscribing.</p>
                )}
              </>
            )}
            {bgStatus === 'triggers-active' && (
              <p>✅ Pre-scheduled background notifications active — your browser will fire upcoming reminders even with LangLearn closed.</p>
            )}
            {bgStatus === 'sync-active' && (
              <>
                <p>📶 Best-effort background sync registered. Your OS decides when to wake the app — usually every few hours, sometimes not at all on mobile. Reminders also fire whenever you open LangLearn.</p>
                {lastSyncWake && (
                  <p>Last background wake: {new Date(lastSyncWake).toLocaleString()}</p>
                )}
                {!lastSyncWake && (
                  <p>Last background wake: never recorded yet — keep using the app to build OS engagement.</p>
                )}
              </>
            )}
            {bgStatus === 'not-installed' && (
              <>
                <p>📲 Install LangLearn as an app to unlock background reminders on this browser.</p>
                {pwaStatus === 'installable' && (
                  <button
                    onClick={async () => {
                      const accepted = await promptInstall();
                      if (accepted) {
                        const s = await getBackgroundNotificationStatus();
                        setBgStatus(s);
                      }
                    }}
                    className="mt-1 min-h-[44px] fill-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg press-feedback"
                  >
                    Install LangLearn
                  </button>
                )}
              </>
            )}
            {bgStatus === 'not-registered' && (
              <p>⏳ Background sync available but not yet registered. It will activate shortly — try reopening LangLearn.</p>
            )}
            {bgStatus === 'not-supported' && (
              <>
                <p>ℹ️ This browser can't fire reminders while LangLearn is closed.</p>
                <p>
                  Real "while-closed" notifications need either Chromium with{' '}
                  <a
                    href="chrome://flags/#enable-experimental-web-platform-features"
                    onClick={(e) => e.preventDefault()}
                    className="underline cursor-default"
                    title="Open chrome://flags and enable 'Experimental Web Platform features' (paste the URL into your address bar)"
                  >
                    Notification Triggers enabled
                  </a>{' '}
                  or configured cloud reminders. Firefox and iOS Safari don't currently support periodic background sync.
                </p>
                <p>
                  In the meantime: reminders fire while LangLearn is open, and missed important ones surface as in-app nudges next time you visit.
                </p>
              </>
            )}
          </div>

          {/* Cloud reminders sub-toggle */}
          {cloudConfigured && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 space-y-2">
              <SettingToggle
                id="settings-cloud-reminders"
                label="Use cloud reminders"
                description={<>The only way to get reliable notifications when LangLearn is fully closed.
                  Your subscription, reminder preferences, and limited progress (streak, due count, today&apos;s
                  minutes) are stored on the LangLearn push worker. <strong>No vocabulary,
                  no answers, no review history</strong> ever leaves the device.</>}
                checked={cloudRemindersEnabled}
                onChange={() => setCloudRemindersEnabled(!cloudRemindersEnabled)}
              />
            </div>
          )}
          {!cloudConfigured && (
            <details>
              <summary className="min-h-[44px] cursor-pointer py-3 rounded-lg text-xs text-slate-500 dark:text-slate-400">
                Cloud reminders are not configured for this build
              </summary>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                For self-hosting: deploy <code className="font-mono">infra/push-worker</code> and set
                {' '}<code className="font-mono">VITE_VAPID_PUBLIC</code>{' '}/
                {' '}<code className="font-mono">VITE_PUSH_API_URL</code> to enable them.
              </p>
            </details>
          )}

          {/* Daily anchor time */}
          <div>
            <label htmlFor="settings-reminder-time" className="block text-sm text-slate-700 dark:text-slate-200 mb-1">
              Daily reminder time
            </label>
            <p id="settings-reminder-time-help" className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Choose a time that fits your day.
            </p>
            <input
              type="time"
              id="settings-reminder-time"
              name="dailyReminderTime"
              aria-describedby="settings-reminder-time-help"
              value={dailyReminderTime}
              onChange={(e) => setDailyReminderTime(e.target.value)}
              className="min-h-[44px] max-w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Intensity preset */}
          <div>
            <p id="settings-notification-preset-label" className="text-sm text-slate-700 dark:text-slate-200 mb-1">
              Reminder frequency
            </p>
            <div role="group" aria-labelledby="settings-notification-preset-label" className="flex gap-2 flex-wrap">
              {(['gentle', 'balanced', 'persistent', 'custom'] as NotificationPreset[]).map((p) => (
                <button
                  key={p}
                  id={`settings-notification-preset-${p}`}
                  name="notificationPreset"
                  type="button"
                  value={p}
                  onClick={() => setNotificationPreset(p)}
                  className={`px-3 py-1.5 min-h-[44px] rounded-full text-sm font-medium transition-colors ${
                    notificationPreset === p
                      ? 'fill-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                  aria-pressed={notificationPreset === p}
                >
                  {PRESET_LABELS[p]}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {PRESET_HELP[notificationPreset]}
            </p>
          </div>

          {/* Quiet hours */}
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-200 mb-1">
              Quiet hours
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              No notifications during this window.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="min-w-0">
                <label htmlFor="settings-quiet-start" className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Quiet hours start
                </label>
                <input
                  id="settings-quiet-start"
                  name="quietHoursStart"
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                  className="min-h-[44px] max-w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="min-w-0">
                <label htmlFor="settings-quiet-end" className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Quiet hours end
                </label>
                <input
                  id="settings-quiet-end"
                  name="quietHoursEnd"
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                  className="min-h-[44px] max-w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Daily budget */}
          <SettingRange
            id="settings-notification-budget"
            label="Maximum notifications per day"
            min={1}
            max={5}
            step={1}
            value={dailyNotificationBudget}
            valueText={`${dailyNotificationBudget} notification${dailyNotificationBudget === 1 ? '' : 's'} per day`}
            onChange={setDailyNotificationBudget}
          />

          {/* Test buttons */}
          <div className="space-y-2">
            <button
              onClick={() => {
                setTestFeedback('');
                fireTestNotification();
              }}
              className="w-full min-h-[44px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 py-2 rounded-xl font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors press-feedback"
            >
              🔔 Send test notification (now)
            </button>
            {cloudConfigured && cloudRemindersEnabled && (
              <button
                onClick={async () => {
                  setTestFeedback('Sending…');
                  const result = await sendTestPush();
                  setTestFeedback(result.message);
                  if (result.ok) {
                    // Worker likely just ticked — refresh diagnostic.
                    setLastWorkerCheck(await getLastWorkerCheck());
                  }
                }}
                disabled={!cloudActive}
                className="w-full min-h-[44px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 py-2 rounded-xl font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors press-feedback disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ☁ Send a test push from the server
              </button>
            )}
            <button
              onClick={async () => {
                const result = await fireDelayedTestNotification();
                if (result === 'triggered') {
                  setTestFeedback('Scheduled for 60 s from now via TimestampTrigger. Close the tab/app to verify it fires while closed.');
                } else if (result === 'fallback') {
                  setTestFeedback('This browser does not support background scheduling — the test will only fire if you keep LangLearn open.');
                } else {
                  setTestFeedback('Notifications are not granted on this device.');
                }
              }}
              className="w-full min-h-[44px] bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 py-2 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors press-feedback"
            >
              ⏱ Schedule test for 60 s (verify while-closed)
            </button>
            {testFeedback && (
              <p role="status" className="text-xs text-slate-500 dark:text-slate-400 px-1">{testFeedback}</p>
            )}
          </div>

          {/* Advanced */}
          <details>
            <summary className="min-h-[44px] cursor-pointer py-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50">
              Advanced notification categories
            </summary>
            <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
              {/* Cards due */}
              <SettingToggle
                id="settings-due-card-alerts"
                label="Due-card alerts"
                description="A midday reminder when reviews reach your chosen threshold."
                checked={dueCardAlerts}
                onChange={() => setDueCardAlerts(!dueCardAlerts)}
              />
              {dueCardAlerts && (
                <div>
                  <p id="settings-due-threshold-label" className="text-sm text-slate-700 dark:text-slate-200 mb-1">Alert threshold</p>
                  <div role="group" aria-labelledby="settings-due-threshold-label" className="flex flex-wrap gap-2">
                    {[5, 10, 25, 50].map((n) => (
                      <button
                        key={n}
                        id={`settings-due-threshold-${n}`}
                        name="dueCardThreshold"
                        type="button"
                        value={n}
                        aria-pressed={dueCardThreshold === n}
                        onClick={() => setDueCardThreshold(n)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                          dueCardThreshold === n
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {n}+ cards
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Streak protection */}
              <SettingToggle
                id="settings-streak-reminders"
                label="Streak reminders"
                description="An evening reminder if you have not studied today."
                checked={streakReminders}
                onChange={() => setStreakReminders(!streakReminders)}
              />
              {streakReminders && (
                <div>
                  <p id="settings-streak-length-label" className="text-sm text-slate-700 dark:text-slate-200 mb-1">Minimum streak for reminders</p>
                  <div role="group" aria-labelledby="settings-streak-length-label" className="flex flex-wrap gap-2">
                    {[1, 3, 7].map((n) => (
                      <button
                        key={n}
                        id={`settings-streak-length-${n}`}
                        name="streakReminderMinDays"
                        type="button"
                        value={n}
                        aria-pressed={streakReminderMinDays === n}
                        onClick={() => setStreakReminderMinDays(n)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                          streakReminderMinDays === n
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {n}+ day{n > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comeback */}
              <SettingToggle
                id="settings-comeback-nudges"
                label="Comeback nudges"
                description="A warm welcome after 2+ days away (in-app)."
                checked={comebackNudges}
                onChange={() => setComebackNudges(!comebackNudges)}
              />

              {/* Slipping */}
              <SettingToggle
                id="settings-weekly-checkin"
                label="Midweek goal check-in"
                description="A Wednesday check-in if you are behind on your weekly goal."
                checked={slippingWarnings}
                onChange={() => setSlippingWarnings(!slippingWarnings)}
              />

              {/* Goal met */}
              <SettingToggle
                id="settings-goal-celebration"
                label="Daily goal celebration"
                description="A small ✅ when you reach today's target."
                checked={dailyGoalMetCelebration}
                onChange={() => setDailyGoalMetCelebration(!dailyGoalMetCelebration)}
              />

              {/* Milestones */}
              <SettingToggle
                id="settings-streak-milestones"
                label="Streak milestones"
                description="3 / 7 / 14 / 30 / 60 / 100-day celebrations."
                checked={streakMilestoneAlerts}
                onChange={() => setStreakMilestoneAlerts(!streakMilestoneAlerts)}
              />

              {/* Weekly digest */}
              <SettingToggle
                id="settings-weekly-summary"
                label="Weekly summary"
                description="A Sunday-evening recap of your week."
                checked={weeklyDigest}
                onChange={() => setWeeklyDigest(!weeklyDigest)}
              />
            </div>
          </details>
        </>
      )}
    </section>
  );
}
