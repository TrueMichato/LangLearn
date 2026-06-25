import { describe, it, expect } from 'vitest';
import { computeGoals } from '../lib/goals';
import type { Word, ReviewLogEntry, LessonProgress } from '../db/schema';

const sinceIso = '2026-01-08T00:00:00.000Z';
const targets = { words: 3, reviews: 2, lessons: 1 };

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
function log(date: string, language = 'ja'): ReviewLogEntry {
  return { reviewId: 1, wordId: 1, language, grade: 1, isLapse: true, date };
}
function lesson(
  lessonId: string,
  completed: boolean,
  completedAt: string,
  language = 'ja'
): LessonProgress {
  return {
    id: `${language}/${lessonId}`,
    language,
    lessonId,
    completed,
    quizScore: 100,
    completedAt,
    attempts: 1,
  };
}

describe('computeGoals', () => {
  it('counts only items within the week window', () => {
    const goals = computeGoals({
      words: [
        word(1, '2026-01-09T00:00:00.000Z'),
        word(2, '2026-01-01T00:00:00.000Z'), // before window
      ],
      logs: [log('2026-01-09T00:00:00.000Z'), log('2026-01-02T00:00:00.000Z')],
      lessons: [
        lesson('a', true, '2026-01-09T00:00:00.000Z'),
        lesson('b', true, '2026-01-01T00:00:00.000Z'), // before window
      ],
      targets,
      sinceIso,
    });

    expect(goals.find((g) => g.id === 'words')!.current).toBe(1);
    expect(goals.find((g) => g.id === 'reviews')!.current).toBe(1);
    expect(goals.find((g) => g.id === 'lessons')!.current).toBe(1);
  });

  it('ignores incomplete lessons', () => {
    const goals = computeGoals({
      words: [],
      logs: [],
      lessons: [lesson('a', false, '2026-01-09T00:00:00.000Z')],
      targets,
      sinceIso,
    });
    expect(goals.find((g) => g.id === 'lessons')!.current).toBe(0);
  });

  it('marks a goal done when current meets target', () => {
    const goals = computeGoals({
      words: [
        word(1, '2026-01-09T00:00:00.000Z'),
        word(2, '2026-01-09T00:00:00.000Z'),
        word(3, '2026-01-09T00:00:00.000Z'),
      ],
      logs: [],
      lessons: [],
      targets,
      sinceIso,
    });
    const wordsGoal = goals.find((g) => g.id === 'words')!;
    expect(wordsGoal.current).toBe(3);
    expect(wordsGoal.done).toBe(true);
    expect(goals.find((g) => g.id === 'reviews')!.done).toBe(false);
  });
});
