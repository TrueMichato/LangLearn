import { describe, it, expect } from 'vitest';
import { hasStarted, hasHistory, type DashboardActivity } from '../lib/dashboard-gates';

const blank: DashboardActivity = {
  totalWords: 0,
  totalStudySeconds: 0,
  lessonsTouched: 0,
  bonusXP: 0,
};

describe('dashboard gates', () => {
  it('shows the on-ramp, not the dashboard, to someone who has done nothing', () => {
    expect(hasStarted(blank)).toBe(false);
    expect(hasHistory(blank)).toBe(false);
  });

  /* This is the regression that mattered: the on-ramp's top recommendation for
     ja/ru/ar is a letter column, which writes characterProgress but no words.
     Gating the dashboard on words alone meant the app greeted these learners on
     day two as though they had never opened it. */
  it('remembers a learner whose only activity produced no words', () => {
    const lettersOnly = { ...blank, lessonsTouched: 5, bonusXP: 25 };
    expect(hasStarted(lettersOnly)).toBe(true);
  });

  it.each([
    ['a word', { ...blank, totalWords: 1 }],
    ['study time', { ...blank, totalStudySeconds: 1 }],
    ['a lesson', { ...blank, lessonsTouched: 1 }],
    ['bonus XP', { ...blank, bonusXP: 1 }],
  ])('counts %s as having started', (_label, activity) => {
    expect(hasStarted(activity)).toBe(true);
  });

  it('withholds trends until there is something worth charting', () => {
    const oneShortSession = { ...blank, lessonsTouched: 5, totalStudySeconds: 40, bonusXP: 25 };
    expect(hasStarted(oneShortSession)).toBe(true);
    expect(hasHistory(oneShortSession)).toBe(false);
  });

  it('opens the scoreboard once a full minute or a first word lands', () => {
    expect(hasHistory({ ...blank, totalStudySeconds: 60 })).toBe(true);
    expect(hasHistory({ ...blank, totalWords: 1 })).toBe(true);
  });

  /* The bug this file exists to prevent, second edition. Badges unlock from XP
     and letters, and the app fires an "Achievement Unlocked!" toast when they
     do. Gating the *earned* layer on hasHistory meant a learner with 420 XP and
     an unlocked badge had no screen anywhere that would show it to them. The
     scoreboard follows hasStarted; only trends wait for hasHistory. */
  it('lets someone who has only earned XP reach their achievements', () => {
    const lettersAndDrills = { ...blank, lessonsTouched: 12, bonusXP: 420 };
    expect(hasStarted(lettersAndDrills)).toBe(true);
    expect(hasHistory(lettersAndDrills)).toBe(false);
  });

  it('never shows trends to someone who has not started', () => {
    const cases: DashboardActivity[] = [
      blank,
      { ...blank, lessonsTouched: 3 },
      { ...blank, bonusXP: 50 },
      { ...blank, totalStudySeconds: 59 },
    ];
    for (const c of cases) {
      expect(hasHistory(c) && !hasStarted(c)).toBe(false);
    }
  });
});
