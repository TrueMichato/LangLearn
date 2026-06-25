import { describe, it, expect } from 'vitest';
import { summarizeWeek, currentWeekKey } from '../lib/weekly-recap';
import type { Word, StudySession, ReviewLogEntry, DailyActivity } from '../db/schema';

const sinceIso = '2026-01-08T00:00:00.000Z';

function word(id: number, createdAt: string, language = 'ja'): Word {
  return {
    id,
    language,
    word: `w${id}`,
    reading: '',
    meaning: `m${id}`,
    contextSentence: '',
    sourceTextId: null,
    tags: [],
    type: 'word',
    createdAt,
  };
}
function session(startTime: string, durationSeconds: number, xpEarned: number): StudySession {
  return { startTime, endTime: null, durationSeconds, xpEarned, activity: 'srs' };
}
function log(date: string, language = 'ja'): ReviewLogEntry {
  return { reviewId: 1, wordId: 1, language, grade: 1, isLapse: true, date };
}
function activity(date: string, studySeconds: number, goalMet = false): DailyActivity {
  return { date, studySeconds, cardsReviewed: 0, wordsAdded: 0, goalMet, challengeComplete: false };
}

describe('summarizeWeek', () => {
  it('counts only items within the week window', () => {
    const recap = summarizeWeek({
      words: [
        word(1, '2026-01-10T00:00:00.000Z'),
        word(2, '2026-01-01T00:00:00.000Z'), // before window
      ],
      sessions: [
        session('2026-01-09T00:00:00.000Z', 600, 20),
        session('2026-01-02T00:00:00.000Z', 600, 20), // before window
      ],
      logs: [log('2026-01-09T00:00:00.000Z'), log('2026-01-05T00:00:00.000Z')],
      activities: [activity('2026-01-09', 600), activity('2026-01-03', 600)],
      topFocus: [],
      sinceIso,
    });

    expect(recap.wordsLearned).toBe(1);
    expect(recap.reviews).toBe(1);
    expect(recap.studyMinutes).toBe(10);
    expect(recap.xp).toBe(20);
    expect(recap.activeDays).toBe(1);
  });

  it('treats goalMet days with zero seconds as active', () => {
    const recap = summarizeWeek({
      words: [],
      sessions: [],
      logs: [],
      activities: [activity('2026-01-10', 0, true)],
      topFocus: [],
      sinceIso,
    });
    expect(recap.activeDays).toBe(1);
  });

  it('passes topFocus through unchanged', () => {
    const focus = [{ word: word(5, sinceIso), review: {} as never }];
    const recap = summarizeWeek({
      words: [],
      sessions: [],
      logs: [],
      activities: [],
      topFocus: focus,
      sinceIso,
    });
    expect(recap.topFocus).toBe(focus);
  });
});

describe('currentWeekKey', () => {
  it('produces a stable YYYY-Www key', () => {
    expect(currentWeekKey(new Date('2026-01-08T12:00:00Z'))).toMatch(/^2026-W\d{2}$/);
  });

  it('returns the same key for days in the same ISO week', () => {
    const mon = currentWeekKey(new Date('2026-06-22T00:00:00Z'));
    const fri = currentWeekKey(new Date('2026-06-26T00:00:00Z'));
    expect(mon).toBe(fri);
  });

  it('changes across ISO week boundaries', () => {
    const sun = currentWeekKey(new Date('2026-06-21T00:00:00Z'));
    const mon = currentWeekKey(new Date('2026-06-22T00:00:00Z'));
    expect(sun).not.toBe(mon);
  });
});
