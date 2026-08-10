import { describe, it, expect } from 'vitest';

/**
 * Every `quiz` block shipped in the repository, checked for the defects an audit
 * of all 1,600 of them actually turned up:
 *
 * - the same option offered twice, so one of the four choices is dead weight and
 *   the question is easier than it looks;
 * - a `❌`-prefixed option — the source material's "this is wrong" marker — used
 *   as the answer key, which teaches the learner the incorrect sentence;
 * - the identical quiz block pasted twice into one lesson.
 *
 * None of these are visible while authoring, and all of them survive a render.
 */

const LESSONS = import.meta.glob('../../public/content/grammar/*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

interface Quiz {
  source: string;
  /** The raw JSON payload, used to spot a block pasted twice. */
  raw: string;
  question: string;
  options: string[];
  answer: number;
}

const QUIZ_RE = /<!--\s*quiz:\s*(.*?)\s*-->/g;

function allQuizzes(): Quiz[] {
  const quizzes: Quiz[] = [];
  for (const [path, markdown] of Object.entries(LESSONS)) {
    const source = path.split('/').slice(-2).join('/');
    QUIZ_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = QUIZ_RE.exec(markdown))) {
      const parsed = JSON.parse(match[1]) as Omit<Quiz, 'source' | 'raw'>;
      quizzes.push({
        ...parsed,
        options: (parsed.options ?? []).map((option) => String(option)),
        source,
        raw: match[1],
      });
    }
  }
  return quizzes;
}

const QUIZZES = allQuizzes();

describe('shipped quiz blocks', () => {
  it('exist in quantity', () => {
    expect(QUIZZES.length).toBeGreaterThan(1500);
  });

  it('never offer the same option twice', () => {
    const failures = QUIZZES.filter((quiz) => {
      const options = quiz.options.map((option) => option.trim());
      return new Set(options).size !== options.length;
    }).map((quiz) => `${quiz.source}: ${quiz.question}`);
    expect(failures).toEqual([]);
  });

  it('point at an option that exists', () => {
    const failures = QUIZZES.filter(
      (quiz) =>
        typeof quiz.answer !== 'number' || quiz.answer < 0 || quiz.answer >= quiz.options.length,
    ).map((quiz) => `${quiz.source}: ${quiz.question}`);
    expect(failures).toEqual([]);
  });

  it('never mark a counter-example as correct', () => {
    const failures = QUIZZES.filter((quiz) => /[❌✗]/.test(quiz.options[quiz.answer] ?? '')).map(
      (quiz) => `${quiz.source}: ${quiz.question} -> ${quiz.options[quiz.answer]}`,
    );
    expect(failures).toEqual([]);
  });

  it('are not pasted twice into the same lesson', () => {
    const seen = new Set<string>();
    const failures: string[] = [];
    for (const quiz of QUIZZES) {
      const key = `${quiz.source}\u0000${quiz.raw}`;
      if (seen.has(key)) failures.push(`${quiz.source}: ${quiz.question}`);
      seen.add(key);
    }
    expect(failures).toEqual([]);
  });
});
