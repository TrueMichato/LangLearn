import { describe, it, expect } from 'vitest';
import { hasStarted, hasProgress, type DashboardActivity } from '../lib/dashboard-gates';

const blank: DashboardActivity = {
  totalWords: 0,
  totalStudySeconds: 0,
  lessonsTouched: 0,
  bonusXP: 0,
};

describe('dashboard gates', () => {
  it('shows the on-ramp, not the dashboard, to someone who has done nothing', () => {
    expect(hasStarted(blank)).toBe(false);
    expect(hasProgress(blank)).toBe(false);
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

  it('withholds the scoreboard until there is something worth measuring', () => {
    const oneShortSession = { ...blank, lessonsTouched: 5, totalStudySeconds: 40, bonusXP: 25 };
    expect(hasStarted(oneShortSession)).toBe(true);
    expect(hasProgress(oneShortSession)).toBe(false);
  });

  it('opens the scoreboard once a full minute or a first word lands', () => {
    expect(hasProgress({ ...blank, totalStudySeconds: 60 })).toBe(true);
    expect(hasProgress({ ...blank, totalWords: 1 })).toBe(true);
  });

  it('never shows the scoreboard to someone who has not started', () => {
    const cases: DashboardActivity[] = [
      blank,
      { ...blank, lessonsTouched: 3 },
      { ...blank, bonusXP: 50 },
      { ...blank, totalStudySeconds: 59 },
    ];
    for (const c of cases) {
      expect(hasProgress(c) && !hasStarted(c)).toBe(false);
    }
  });
});
