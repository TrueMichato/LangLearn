import { afterAll, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import LessonAssessment from '../components/assessment/LessonAssessment';
import { saveAssessmentDraft } from '../lib/lesson-assessment-draft';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe('LessonAssessment saved attempt', () => {
  it('offers to resume the exact saved question state', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: memoryStorage(),
    });
    saveAssessmentDraft(
      {
        language: 'ja',
        kind: 'grammar',
        lessonIds: ['particles'],
      },
      {
        questions: [
          {
            id: 0,
            category: 'grammar',
            question: 'Which particle marks the topic?',
            options: ['は', 'が'],
            correctIndex: 0,
            lessonId: 'particles',
          },
        ],
        index: 0,
        correctCount: 0,
        selectedIndex: 1,
      },
    );

    const html = renderToStaticMarkup(
      <LessonAssessment
        lang="ja"
        kind="grammar"
        lessons={[{ id: 'particles', title: 'Basic Particles' }]}
        onExit={() => {}}
      />,
    );

    expect(html).toContain('Your saved check is ready');
    expect(html).toContain('question 1 of 1');
    expect(html).toContain('Resume check');
    expect(html).toContain('Start over');
  });

  it('preserves a mid-question saved answer (a selected but not yet advanced index) in the resume summary', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: memoryStorage(),
    });
    saveAssessmentDraft(
      {
        language: 'ja',
        kind: 'grammar',
        lessonIds: ['particles', 'verbs'],
      },
      {
        questions: [
          {
            id: 0,
            category: 'grammar',
            question: 'Which particle marks the topic?',
            options: ['は', 'が'],
            correctIndex: 0,
            lessonId: 'particles',
          },
          {
            id: 1,
            category: 'grammar',
            question: 'Which is the polite form?',
            options: ['食べる', '食べます'],
            correctIndex: 1,
            lessonId: 'verbs',
          },
        ],
        index: 1,
        correctCount: 1,
        selectedIndex: 1,
      },
    );

    const html = renderToStaticMarkup(
      <LessonAssessment
        lang="ja"
        kind="grammar"
        lessons={[
          { id: 'particles', title: 'Basic Particles' },
          { id: 'verbs', title: 'Verb Forms' },
        ]}
        onExit={() => {}}
      />,
    );

    // The intro-phase resume banner reports the saved question position —
    // the answered-but-not-yet-advanced index is not lost or reset.
    expect(html).toContain('question 2 of 2');
    expect(html).toContain('Resume check');
    // Nothing from the (unreached, effect-driven) active phase — such as the
    // progress bar or the quiz itself — leaks into the intro-phase markup.
    expect(html).not.toContain('role="progressbar"');
    expect(html).not.toContain('sr-only');
  });

  afterAll(() => {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  });
});
