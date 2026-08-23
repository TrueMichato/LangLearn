import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assessmentDraftId,
  deleteAssessmentDraft,
  listAssessmentDrafts,
  readAssessmentDraft,
  saveAssessmentDraft,
} from '../lib/lesson-assessment-draft';
import type { Question } from '../lib/test-questions';

const identity = {
  language: 'ar',
  kind: 'vocab' as const,
  lessonIds: ['greetings', 'family'],
};

const questions: Question[] = [
  {
    id: 0,
    category: 'vocabulary',
    question: 'Which word means "family"?',
    options: ['عائلة', 'كتاب', 'بيت', 'قلم'],
    correctIndex: 0,
    lessonId: 'family',
    targetOptionIndices: [0, 1, 2, 3],
  },
];

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

describe('assessment draft storage', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: memoryStorage(),
    });
    vi.restoreAllMocks();
  });

  afterAll(() => {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  });

  it('uses the ordered range as part of a stable identity', () => {
    expect(assessmentDraftId(identity)).toBe('ar/vocab/greetings|family');
    expect(
      assessmentDraftId({ ...identity, lessonIds: [...identity.lessonIds].reverse() }),
    ).not.toBe(assessmentDraftId(identity));
  });

  it('round-trips generated questions and exact answer state', () => {
    expect(
      saveAssessmentDraft(
        identity,
        {
          questions,
          index: 0,
          correctCount: 0,
          selectedIndex: 0,
        },
        1_000,
      ),
    ).toBe(true);

    expect(readAssessmentDraft(identity, 1_001)).toMatchObject({
      id: 'ar/vocab/greetings|family',
      selectedIndex: 0,
      savedAt: 1_000,
      questions,
    });
  });

  it('keeps only the three most recent drafts', () => {
    for (let index = 0; index < 4; index += 1) {
      saveAssessmentDraft(
        {
          language: 'ja',
          kind: 'grammar',
          lessonIds: [`lesson-${index}`],
        },
        {
          questions,
          index: 0,
          correctCount: 0,
          selectedIndex: null,
        },
        index + 1,
      );
    }

    expect(listAssessmentDrafts(undefined, 10)).toHaveLength(3);
    expect(listAssessmentDrafts(undefined, 10)[0].lessonIds).toEqual([
      'lesson-3',
    ]);
  });

  it('expires drafts after seven days', () => {
    saveAssessmentDraft(
      identity,
      {
        questions,
        index: 0,
        correctCount: 0,
        selectedIndex: null,
      },
      1,
    );

    expect(readAssessmentDraft(identity, 8 * 24 * 60 * 60 * 1000)).toBeNull();
  });

  it('rejects malformed localStorage instead of hydrating partial state', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem(
      'langlearn-assessment-drafts',
      JSON.stringify({ version: 1, drafts: [{ id: 'broken' }] }),
    );

    expect(readAssessmentDraft(identity)).toBeNull();
    expect(warn).toHaveBeenCalled();
    expect(localStorage.getItem('langlearn-assessment-drafts')).toBeNull();
  });

  it('deletes only the matching assessment', () => {
    saveAssessmentDraft(identity, {
      questions,
      index: 0,
      correctCount: 0,
      selectedIndex: null,
    });
    const other = {
      language: 'ja',
      kind: 'grammar' as const,
      lessonIds: ['particles'],
    };
    saveAssessmentDraft(other, {
      questions,
      index: 0,
      correctCount: 0,
      selectedIndex: null,
    });

    expect(deleteAssessmentDraft(identity)).toBe(true);
    expect(readAssessmentDraft(identity)).toBeNull();
    expect(readAssessmentDraft(other)).not.toBeNull();
  });
});
