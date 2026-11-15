import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsPage from '../pages/Settings';
import Flashcard from '../components/srs/Flashcard';
import { useSettingsStore } from '../stores/settingsStore';
import { getNotificationPermission, isNotificationSupported } from '../lib/notifications';
import { getLanguageLabel } from '../lib/languages';

type SettingsState = ReturnType<typeof useSettingsStore.getState>;
let settings: SettingsState;

vi.mock('../stores/settingsStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../stores/settingsStore')>();
  return {
    useSettingsStore: Object.assign(
      (selector?: (state: SettingsState) => unknown) => selector ? selector(settings) : settings,
      {
        getState: () => settings,
        getInitialState: actual.useSettingsStore.getInitialState,
      },
    ),
  };
});

vi.mock('../hooks/database-boot-context', () => ({
  useDatabaseBootContext: () => ({ persistence: 'unsupported' }),
}));

vi.mock('../lib/notifications', async (importOriginal) => ({
  ...await importOriginal<typeof import('../lib/notifications')>(),
  isNotificationSupported: vi.fn(() => true),
  getNotificationPermission: vi.fn(() => 'granted'),
}));

vi.mock('../lib/push-subscription', async (importOriginal) => ({
  ...await importOriginal<typeof import('../lib/push-subscription')>(),
  isCloudPushConfigured: () => true,
}));

function tagById(html: string, id: string): string {
  const tag = html.match(new RegExp(`<[^>]+\\bid="${id}"[^>]*>`))?.[0];
  expect(tag, `control ${id}`).toBeDefined();
  return tag!;
}

function expectNamedRangesAndSwitches(html: string) {
  const controls = [...html.matchAll(/<(?:input|button)\b[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => tag.includes('type="range"') || tag.includes('role="switch"'));
  expect(controls.length).toBeGreaterThan(0);
  for (const tag of controls) {
    const id = tag.match(/\bid="([^"]+)"/)?.[1];
    expect(id, tag).toBeTruthy();
    expect(tag).toContain(`name="${id}"`);
    expect(html).toMatch(new RegExp(`<label\\b[^>]*for="${id}"[^>]*>[^<]+</label>`));
    if (tag.includes('type="range"')) {
      expect(tag).toMatch(/aria-valuetext="[^"]+"/);
      expect(html).toContain(`<output for="${id}"`);
    } else {
      expect(tag).toContain(`aria-labelledby="${id}-label"`);
      expect(tag).toMatch(/aria-checked="(?:true|false)"/);
    }
  }
}

beforeEach(() => {
  settings = { ...useSettingsStore.getInitialState() };
  vi.mocked(isNotificationSupported).mockReturnValue(true);
  vi.mocked(getNotificationPermission).mockReturnValue('granted');
});

describe('Settings clarity', () => {
  it('names the default controls, keeps scheduling choices reachable, and puts backups before optional ideas', () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    expectNamedRangesAndSwitches(html);
    for (const [id, value, valueText] of [
      ['settings-daily-goal', '5', '5 minutes per day'],
      ['settings-weekly-goal', '60', '60 minutes per week'],
      ['settings-font-size', '18', '18 pixels'],
      ['settings-speech-speed', '0.9', '0.9 times normal speed'],
    ]) {
      const tag = tagById(html, id);
      expect(tag).toContain(`value="${value}"`);
      expect(tag).toContain(`aria-valuetext="${valueText}"`);
    }
    expect(tagById(html, 'settings-batch-25')).toContain('aria-pressed="true"');
    expect(tagById(html, 'settings-adaptive-review')).toContain('aria-checked="true"');
    expect(tagById(html, 'settings-dark-mode')).toContain('aria-checked="false"');
    expect(tagById(html, 'settings-notifications')).toContain('aria-checked="false"');
    const schedulingDisclosure = html.match(/<details[^>]*><summary[^>]*>Advanced scheduling<\/summary>/)?.[0];
    expect(schedulingDisclosure).toBeDefined();
    expect(schedulingDisclosure).not.toContain(' open');
    expect(tagById(html, 'settings-scheduler-sm2')).toContain('aria-pressed="true"');
    expect(html).not.toContain('id="settings-retention"');

    const sections = ['Languages', 'Study goals', 'Reviews and scheduling',
      'Display, audio and accessibility', 'Data and privacy', 'Optional study ideas'];
    const positions = sections.map((label) => html.indexOf(label));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    for (const action of ['Export all data', 'Import from file', 'Local recovery copy', 'Update snapshots', 'Save now']) {
      expect(html.indexOf(action)).toBeGreaterThan(positions[4]);
      expect(html.indexOf(action)).toBeLessThan(positions[5]);
    }
    expect(html).toContain('cannot survive clearing all site');
    expect(html).toContain('exported backups are still');
    expect(html).toContain('<option value="merge" selected="">');
    for (const id of ['settings-export-language', 'settings-export-name', 'settings-export-tag']) {
      expect(html).toContain(`for="${id}"`);
      expect(tagById(html, id)).toMatch(/name="[^"]+"/);
    }
  });

  it('reflects saved FSRS, language-specific and display choices without substituting defaults', () => {
    settings = { ...settings, activeLanguages: ['ru', 'ar'], currentLanguage: 'ar',
      scheduler: 'fsrs', fsrsRequestRetention: 0.94, dailyGoalMinutes: 12, weeklyGoalMinutes: 135,
      reviewBatchSize: 0, fontSize: 24, ttsRate: 1.4, darkMode: true, adaptiveReview: false,
      showStressMarks: false, arabicDialect: 'egyptian', arabicColloquialFocus: true };
    const html = renderToStaticMarkup(<SettingsPage />);

    expectNamedRangesAndSwitches(html);
    expect(tagById(html, 'settings-scheduler-fsrs')).toContain('aria-pressed="true"');
    expect(tagById(html, 'settings-scheduler-sm2')).toContain('aria-pressed="false"');
    const retention = tagById(html, 'settings-retention');
    expect(retention).toContain('value="0.94"');
    expect(retention).toContain('aria-valuetext="94% target recall"');
    expect(retention).toContain('min="0.8" max="0.97" step="0.01"');
    expect(html).toContain('12 minutes per day');
    expect(html).toContain('135 minutes per week');
    expect(html).toContain('24 pixels');
    expect(html).toContain('1.4 times normal speed');
    expect(tagById(html, 'settings-batch-0')).toContain('aria-pressed="true"');
    expect(tagById(html, 'settings-dark-mode')).toContain('aria-checked="true"');
    expect(tagById(html, 'settings-adaptive-review')).toContain('aria-checked="false"');
    expect(tagById(html, 'settings-stress-marks')).toContain('aria-checked="false"');
    expect(tagById(html, 'settings-colloquial-focus')).toContain('aria-checked="true"');
    expect(tagById(html, 'settings-dialect-egyptian')).toContain('aria-pressed="true"');
    expect(tagById(html, 'settings-language-ar')).toContain('aria-pressed="true"');
    expect(tagById(html, 'settings-language-ja')).toContain('aria-pressed="false"');
    expect(html).toContain(`${getLanguageLabel('ru')} options`);
    expect(html).toContain(`${getLanguageLabel('ar')} options`);
    expect(html).toMatch(/<span[^>]*dir="rtl">[^<]+<\/span>/);
  });

  it('retains named notification categories and their conditions inside a native advanced disclosure', () => {
    settings = { ...settings, notificationsEnabled: true, dueCardAlerts: true,
      dueCardThreshold: 25, streakReminders: true, streakReminderMinDays: 7 };
    const html = renderToStaticMarkup(<SettingsPage />);

    expectNamedRangesAndSwitches(html);
    expect(html).toMatch(/<details><summary[^>]*>Advanced notification categories<\/summary>/);
    expect(tagById(html, 'settings-notifications')).toContain('aria-checked="true"');
    expect(tagById(html, 'settings-cloud-reminders')).toContain('aria-checked="true"');
    expect(tagById(html, 'settings-notification-budget')).toContain('aria-valuetext="3 notifications per day"');
    expect(tagById(html, 'settings-notification-preset-balanced')).toContain('aria-pressed="true"');
    expect(tagById(html, 'settings-due-threshold-25')).toContain('aria-pressed="true"');
    expect(tagById(html, 'settings-streak-length-7')).toContain('aria-pressed="true"');
    for (const [id, value] of [
      ['settings-reminder-time', '09:00'],
      ['settings-quiet-start', '22:00'],
      ['settings-quiet-end', '07:00'],
    ]) {
      expect(html).toContain(`for="${id}"`);
      expect(tagById(html, id)).toContain(`value="${value}"`);
      expect(tagById(html, id)).toMatch(/name="[^"]+"/);
    }
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    expect(text).toContain('No vocabulary, no answers, no review history');
    expect(text).toContain('ever leaves the device');
    for (const id of ['settings-comeback-nudges', 'settings-weekly-checkin', 'settings-goal-celebration',
      'settings-streak-milestones', 'settings-weekly-summary']) {
      expect(tagById(html, id)).toContain('role="switch"');
    }

    settings = { ...settings, dueCardAlerts: false, streakReminders: false };
    const disabledCategories = renderToStaticMarkup(<SettingsPage />);
    expect(tagById(disabledCategories, 'settings-due-card-alerts')).toContain('aria-checked="false"');
    expect(disabledCategories).not.toContain('name="dueCardThreshold"');
    expect(disabledCategories).not.toContain('name="streakReminderMinDays"');
  });

  it('keeps blocked notification controls named and disabled, and reports unsupported browsers honestly', () => {
    vi.mocked(getNotificationPermission).mockReturnValue('denied');
    const blocked = renderToStaticMarkup(<SettingsPage />);
    expect(tagById(blocked, 'settings-notifications')).toContain('disabled=""');
    expect(blocked).toContain('Blocked by browser');
    expect(blocked).not.toContain('id="settings-notification-budget"');

    vi.mocked(isNotificationSupported).mockReturnValue(false);
    const unsupported = renderToStaticMarkup(<SettingsPage />);
    expect(unsupported).toContain('Notifications are not supported in this browser.');
    expect(unsupported).not.toContain('id="settings-notifications"');
  });

  it('shows the full language name on a review card and retains the target text direction', () => {
    const word = { id: 1, language: 'ar', word: 'كتاب', reading: '', meaning: 'book',
      contextSentence: '', sourceTextId: null, tags: ['mature', 'custom-tag'], type: 'word' as const,
      createdAt: '2026-01-01' };
    const html = renderToStaticMarkup(<Flashcard word={word} isFlipped={false} onFlip={() => {}} />);
    expect(html).toContain(getLanguageLabel('ar'));
    expect(html).toMatch(/dir="rtl">كتاب<\/p>/);
  });
});
