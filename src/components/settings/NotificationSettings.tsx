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

const PRESET_LABELS: Record<NotificationPreset, string> = {
  gentle: 'Gentle',
  balanced: 'Balanced',
  persistent: 'Persistent',
  custom: 'Custom',
};

const PRESET_HELP: Record<NotificationPreset, string> = {
  gentle: 'One reminder a day. Weekly digest. No nags.',
  balanced: 'Daily anchor + smart nudges when slipping. Up to 3/day.',
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
  const [showAdvanced, setShowAdvanced] = useState(false);
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
              : 'Habit-supporting reminders & nudges'}
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
                  <p className="opacity-80">Last server-side check: {new Date(lastWorkerCheck).toLocaleString()}</p>
                )}
                {(lastWorkerCheck == null || lastWorkerCheck === 0) && (
                  <p className="opacity-80">Last server-side check: pending — usually arrives within 15 min of subscribing.</p>
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
                  <p className="opacity-80">Last background wake: {new Date(lastSyncWake).toLocaleString()}</p>
                )}
                {!lastSyncWake && (
                  <p className="opacity-80">Last background wake: never recorded yet — keep using the app to build OS engagement.</p>
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
                    className="mt-1 gradient-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg press-feedback"
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
                <p className="opacity-80">
                  Real "while-closed" notifications need either Chromium with{' '}
                  <a
                    href="chrome://flags/#enable-experimental-web-platform-features"
                    onClick={(e) => e.preventDefault()}
                    className="underline cursor-default"
                    title="Open chrome://flags and enable 'Experimental Web Platform features' (paste the URL into your address bar)"
                  >
                    Notification Triggers enabled
                  </a>{' '}
                  or a Web Push backend (not yet built). Firefox and iOS Safari don't currently support periodic background sync.
                </p>
                <p className="opacity-80">
                  In the meantime: reminders fire while LangLearn is open, and missed important ones surface as in-app nudges next time you visit.
                </p>
              </>
            )}
          </div>

          {/* Cloud reminders sub-toggle */}
          {cloudConfigured && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 space-y-2">
              <div className="flex items-center justify-between">
                <div className="pr-3">
                  <p className="text-sm text-slate-700 dark:text-slate-200">Use cloud reminders</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    The only way to get reliable notifications when LangLearn is fully closed.
                    Your subscription, prefs, and a tiny progress blob (streak, due count, today's
                    minutes) are stored on the LangLearn push worker. <strong>No vocabulary,
                    no answers, no review history</strong> ever leaves the device.
                  </p>
                </div>
                <Toggle
                  checked={cloudRemindersEnabled}
                  onChange={() => setCloudRemindersEnabled(!cloudRemindersEnabled)}
                />
              </div>
            </div>
          )}
          {!cloudConfigured && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cloud reminders aren't configured for this build. Deploy
              {' '}<code className="font-mono">infra/push-worker</code>{' '}and set
              {' '}<code className="font-mono">VITE_VAPID_PUBLIC</code>{' '}/
              {' '}<code className="font-mono">VITE_PUSH_API_URL</code>{' '}
              to enable them.
            </p>
          )}

          {/* Daily anchor time */}
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-200 mb-1">
              Daily anchor time
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Same time every day builds the habit fastest.
            </p>
            <input
              type="time"
              value={dailyReminderTime}
              onChange={(e) => setDailyReminderTime(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Intensity preset */}
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-200 mb-1">
              Intensity
            </p>
            <div className="flex gap-2 flex-wrap">
              {(['gentle', 'balanced', 'persistent', 'custom'] as NotificationPreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setNotificationPreset(p)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[36px] ${
                    notificationPreset === p
                      ? 'gradient-primary text-white'
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
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={quietHoursStart}
                onChange={(e) => setQuietHoursStart(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-500 dark:text-slate-400">to</span>
              <input
                type="time"
                value={quietHoursEnd}
                onChange={(e) => setQuietHoursEnd(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Daily budget */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-slate-700 dark:text-slate-200">Max notifications per day</p>
              <span className="text-sm font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 rounded-lg px-2 py-0.5">
                {dailyNotificationBudget}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={dailyNotificationBudget}
              onChange={(e) => setDailyNotificationBudget(Number(e.target.value))}
              className="w-full accent-indigo-600 dark:accent-indigo-400"
            />
          </div>

          {/* Test buttons */}
          <div className="space-y-2">
            <button
              onClick={() => {
                setTestFeedback('');
                fireTestNotification();
              }}
              className="w-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 py-2 rounded-xl font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors press-feedback"
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
                className="w-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 py-2 rounded-xl font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors press-feedback disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 py-2 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors press-feedback"
            >
              ⏱ Schedule test for 60 s (verify while-closed)
            </button>
            {testFeedback && (
              <p className="text-xs text-slate-500 dark:text-slate-400 px-1">{testFeedback}</p>
            )}
          </div>

          {/* Advanced */}
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full text-left text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 flex items-center justify-between py-1"
          >
            <span>Advanced — fine-tune categories</span>
            <span>{showAdvanced ? '▾' : '▸'}</span>
          </button>

          {showAdvanced && (
            <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
              {/* Cards due */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-200">Due-card alerts</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    A mid-day pulse when reviews pile up.
                  </p>
                </div>
                <Toggle checked={dueCardAlerts} onChange={() => setDueCardAlerts(!dueCardAlerts)} />
              </div>
              {dueCardAlerts && (
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-200 mb-1">Alert threshold</p>
                  <div className="flex gap-2">
                    {[5, 10, 25, 50].map((n) => (
                      <button
                        key={n}
                        onClick={() => setDueCardThreshold(n)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[36px] ${
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-200">Streak protection</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Evening reminder when your streak is at risk.
                  </p>
                </div>
                <Toggle checked={streakReminders} onChange={() => setStreakReminders(!streakReminders)} />
              </div>
              {streakReminders && (
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-200 mb-1">Min streak length to protect</p>
                  <div className="flex gap-2">
                    {[1, 3, 7].map((n) => (
                      <button
                        key={n}
                        onClick={() => setStreakReminderMinDays(n)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[36px] ${
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-200">Comeback nudges</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Warm welcome after 2+ days away (in-app).
                  </p>
                </div>
                <Toggle checked={comebackNudges} onChange={() => setComebackNudges(!comebackNudges)} />
              </div>

              {/* Slipping */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-200">Mid-week slipping warning</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Wednesday check-in if behind on weekly goal.
                  </p>
                </div>
                <Toggle checked={slippingWarnings} onChange={() => setSlippingWarnings(!slippingWarnings)} />
              </div>

              {/* Goal met */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-200">Daily goal celebration</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    A small ✅ when you hit today's target.
                  </p>
                </div>
                <Toggle
                  checked={dailyGoalMetCelebration}
                  onChange={() => setDailyGoalMetCelebration(!dailyGoalMetCelebration)}
                />
              </div>

              {/* Milestones */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-200">Streak milestones</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    3 / 7 / 14 / 30 / 60 / 100-day celebrations.
                  </p>
                </div>
                <Toggle
                  checked={streakMilestoneAlerts}
                  onChange={() => setStreakMilestoneAlerts(!streakMilestoneAlerts)}
                />
              </div>

              {/* Weekly digest */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-200">Weekly summary</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sunday-evening recap of your week.
                  </p>
                </div>
                <Toggle checked={weeklyDigest} onChange={() => setWeeklyDigest(!weeklyDigest)} />
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
