import 'fake-indexeddb/auto';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/schema';
import {
  createVocabAttempt, fetchVocabLesson, isVocabAttempt, parseVocabAttempt,
  readVocabAttempt, saveVocabAttempt,
} from '../lib/vocab-lesson-attempt';
import { VocabLessonSession } from '../lib/vocab-lesson-session';
import {
  initialVocabExerciseState, isVocabLesson, normalizeVocabLesson,
} from '../lib/vocab-lesson-state';
import VocabQuiz from '../components/vocab/VocabQuiz';
import type { VocabWord } from '../types/vocab';

interface AuthoredLesson {
  id: string;
  words: VocabWord[];
  exercises: Array<{ type: string; items?: unknown[]; [key: string]: unknown }>;
}

const sources = import.meta.glob('../../public/content/vocab/**/*.json', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

function sourceJSON(language: string, id: string): string {
  const source = sources[`../../public/content/vocab/${language}/${id}.json`];
  if (source === undefined) throw new Error(`Missing authored asset: ${language}/${id}`);
  return source;
}

function authoredLesson(language: string, id: string): AuthoredLesson {
  return JSON.parse(sourceJSON(language, id)) as AuthoredLesson;
}

const paths = Object.keys(sources);
const inventory = [...new Set(paths.map((path) => path.split('/').at(-2)!))]
  .sort()
  .map((language) => {
    const ids = paths.filter((path) => path.startsWith(`../../public/content/vocab/${language}/`) &&
      !path.endsWith('/index.json')).map((path) => path.split('/').at(-1)!.slice(0, -5));
    const legacyCount = ids.filter((id) => authoredLesson(language, id).exercises.some((exercise) =>
      exercise.type === 'multiple-choice' && !Object.hasOwn(exercise, 'items'))).length;
    return { language, ids, fileCount: ids.length, legacyCount };
  });

beforeEach(async () => {
  await db.settings.clear();
  vi.stubGlobal('fetch', vi.fn(async (input: string) => {
    const match = input.match(/content\/vocab\/([^/]+)\/([^/]+)\.json$/);
    if (!match) throw new Error(`Unexpected lesson URL: ${input}`);
    return { ok: true, status: 200, json: async () => authoredLesson(match[1], match[2]) };
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe('authored vocabulary loader compatibility', () => {
  it.each(inventory)('$language: loads and serializes all $fileCount assets ($legacyCount singleton lessons)', async ({ language, ids }) => {
    const index = JSON.parse(sourceJSON(language, 'index')) as Array<{ id: string }>;
    expect(index.map((entry) => entry.id).sort()).toEqual([...ids].sort());
    for (const id of ids) {
      const original = authoredLesson(language, id);
      const loaded = await fetchVocabLesson(language, id);
      expect(loaded.words, `${language}/${id}: words`).toEqual(original.words);
      expect(loaded.exercises.map((exercise) => exercise.type), `${language}/${id}: stages`)
        .toEqual(original.exercises.map((exercise) => exercise.type));
      original.exercises.forEach((exercise, index) => {
        const { type, ...item } = exercise;
        expect(loaded.exercises[index], `${language}/${id}: exercise ${index + 1}`).toEqual(
          type === 'multiple-choice' && !Object.hasOwn(exercise, 'items')
            ? { type, items: [item] } : exercise,
        );
      });
      const attempt = createVocabAttempt(language, id, loaded);
      expect(isVocabAttempt(attempt), `${language}/${id}: frozen attempt`).toBe(true);
      expect(parseVocabAttempt(JSON.stringify(attempt), language, id).kind, `${language}/${id}: serialized attempt`)
        .toBe('saved');
    }
  });

  it.each(['astronomy-space', 'egyptian-phone-texting'])('renders the complete legacy singleton from the actual ar/%s asset', async (id) => {
    const original = authoredLesson('ar', id);
    const sourceBytes = JSON.stringify(original);
    expect(isVocabLesson(original)).toBe(false);
    const normalized = normalizeVocabLesson(original)!;
    const legacyIndex = original.exercises.findIndex((exercise) =>
      exercise.type === 'multiple-choice' && !Object.hasOwn(exercise, 'items'));
    const quiz = normalized.exercises[legacyIndex];
    if (quiz.type !== 'multiple-choice') throw new Error('Expected the authored multiple-choice stage');
    const { type, ...item } = original.exercises[legacyIndex];
    expect(type).toBe('multiple-choice');
    expect(quiz.items).toEqual([item]);
    expect(normalized.words).toBe(original.words);
    expect(JSON.stringify(original)).toBe(sourceBytes);
    expect(normalizeVocabLesson(normalized)).toBe(normalized);

    const state = initialVocabExerciseState(quiz);
    if (state.kind !== 'items') throw new Error('Expected item state');
    const html = renderToStaticMarkup(createElement(VocabQuiz, {
      items: quiz.items, state, onChange: () => {}, onComplete: () => {},
    }));
    expect(html).toContain(quiz.items[0].question);
    quiz.items[0].options.forEach((option) => expect(html).toContain(option));
    expect(html).toContain('Quiz (1/1)');
    expect(await fetchVocabLesson('ar', id)).toEqual(normalized);
  });

  it('resumes a real legacy lesson at its selected quiz answer without treating normalization as a content change', async () => {
    const id = 'astronomy-space';
    const lesson = await fetchVocabLesson('ar', id);
    const attempt = createVocabAttempt('ar', id, lesson, 'Astronomy & space');
    const match = attempt.exercises[0];
    const fill = attempt.exercises[1];
    const quiz = attempt.exercises[2];
    if (match.type !== 'match' || fill.type !== 'fill-blank' || quiz.type !== 'multiple-choice') {
      throw new Error('Expected the actual authored matching, fill-blank and quiz sequence');
    }
    attempt.wordIndex = lesson.words.length - 1;
    attempt.step = 'exercise';
    attempt.exerciseIndex = 2;
    attempt.states[0] = {
      kind: 'match', matched: match.words.map((_, index) => index), selectedWord: null, wrongMeaning: null,
    };
    attempt.states[1] = {
      kind: 'items', index: fill.items.length - 1, input: fill.items.at(-1)!.answer,
      showHint: false, selected: null, answers: fill.items.map(() => true),
    };
    attempt.states[2] = {
      kind: 'items', index: 0, input: '', showHint: false, selected: quiz.items[0].answer, answers: [true],
    };
    const saved = await saveVocabAttempt(attempt, null);
    const session = new VocabLessonSession('ar', id);
    await session.load(); await session.settled();
    expect(session.getSnapshot()).toMatchObject({
      phase: 'ready', resumed: true, saveStatus: 'saved', attempt: saved,
    });
    expect(await readVocabAttempt('ar', id)).toMatchObject({ kind: 'saved', attempt: saved });
    expect(session.getSnapshot().attempt!.exercises.map((exercise) => exercise.type)).toEqual([
      'match', 'fill-blank', 'multiple-choice', 'typing', 'listening',
    ]);
  });

  it('does not replace malformed canonical stages or invent missing singleton question data', async () => {
    const original = authoredLesson('ar', 'astronomy-space');
    const index = original.exercises.findIndex((exercise) => exercise.type === 'multiple-choice');
    const singleton = original.exercises[index];
    for (const invalid of [
      { ...singleton, question: undefined },
      { ...singleton, options: [] },
      { ...singleton, answer: 999 },
      { ...singleton, items: [] },
      { ...singleton, type: 'unknown-exercise' },
    ]) {
      const lesson = structuredClone(original);
      lesson.exercises[index] = invalid;
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => lesson } as Response);
      expect(normalizeVocabLesson(lesson)).toBeNull();
      await expect(fetchVocabLesson('ar', 'astronomy-space')).rejects.toMatchObject({ kind: 'invalid' });
    }
  });
});

describe('authored fill-blank cues', () => {
  it('gives every fill-blank item an English translation of the completed sentence', () => {
    const missing: string[] = [];
    for (const [path, source] of Object.entries(sources)) {
      if (path.endsWith('/index.json')) continue;
      const lesson = JSON.parse(source) as AuthoredLesson;
      for (const exercise of lesson.exercises ?? []) {
        if (exercise.type !== 'fill-blank') continue;
        (exercise.items as Array<{ sentence: string; translation?: string }>).forEach((item, index) => {
          if (!item.translation?.trim()) missing.push(`${path}#${index}: ${item.sentence}`);
        });
      }
    }
    expect(missing).toEqual([]);
  });
});
