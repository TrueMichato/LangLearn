import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { getStartingPoints } from '../lib/starting-points';
import { LANGUAGES } from '../lib/languages';
import { getAlphabetsForLanguage } from '../data/alphabets';
import { LEARNING_PATHS } from '../data/learning-paths';
import { unitLessons } from '../data/learning-paths/shared';
import { resolveLearningPath } from '../lib/learning-path';
import { guidedLettersRoute, isKnownRoute, NEXT_GUIDED_GROUP, vocabLessonRoute } from '../lib/routes';

const SCRIPT_LANGUAGES = ['ja', 'ru', 'ar'];
const LATIN_LANGUAGES = ['es', 'pt', 'ro'];
const INDEXES = import.meta.glob('../../public/content/{grammar,vocab}/*/index.json', {
  eager: true, import: 'default',
}) as Record<string, { id: string; title: string }[]>;
const stored = new Map<string, string>();

beforeEach(() => {
  stored.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('getStartingPoints', () => {
  it.each(Object.keys(LANGUAGES))(
    'gives %s exactly one recommendation',
    (lang) => {
      const points = getStartingPoints(lang);
      expect(points.filter((p) => p.recommended)).toHaveLength(1);
    },
  );

  it.each(Object.keys(LANGUAGES))('puts %s\'s recommendation first', (lang) => {
    expect(getStartingPoints(lang)[0].recommended).toBe(true);
  });

  it.each(Object.keys(LANGUAGES))('routes %s everywhere valid', (lang) => {
    for (const point of getStartingPoints(lang)) {
      expect(isKnownRoute(point.route)).toBe(true);
    }
  });

  it.each(SCRIPT_LANGUAGES)('starts %s with the letters', (lang) => {
    const points = getStartingPoints(lang);
    expect(points[0].id).toBe('letters');
    expect(points[0].route).toBe(guidedLettersRoute(
      lang, LEARNING_PATHS[lang].letterPrerequisites[0], NEXT_GUIDED_GROUP,
    ));
  });

  it.each(LATIN_LANGUAGES)('starts %s with words, not letters', (lang) => {
    const points = getStartingPoints(lang);
    expect(points[0].id).toBe('words');
    expect(points.find((p) => p.id === 'letters')?.recommended).not.toBe(true);
  });

  it.each(Object.keys(LANGUAGES))('opens %s\'s canonical authored vocabulary lesson, not its catalog', (lang) => {
    const manifest = LEARNING_PATHS[lang];
    const first = manifest.units.flatMap(unitLessons).find((node) => node.kind === 'vocab')!;
    const point = getStartingPoints(lang).find((item) => item.id === 'words')!;
    expect(point.route).toBe(vocabLessonRoute(first.lessonId));
    expect(INDEXES[`../../public/content/vocab/${lang}/index.json`].some((item) => item.id === first.lessonId)).toBe(true);
    expect(point.sublabel).not.toMatch(/two minutes|short lesson/i);
  });

  it.each(Object.entries(LEARNING_PATHS))('agrees with %s\'s fresh Learn path', (language, manifest) => {
    const path = resolveLearningPath(manifest, {
      grammar: INDEXES[`../../public/content/grammar/${language}/index.json`],
      vocab: INDEXES[`../../public/content/vocab/${language}/index.json`],
    }, { progress: [], completedLetters: new Set() });
    const first = path.units.flatMap((unit) => unit.nodes).find((node) => node.id === path.recommendedNodeId);
    expect(getStartingPoints(language)[0].route).toBe(first?.route);
  });

  it('continues at the next canonical alphabet without changing completion', () => {
    const hiragana = getAlphabetsForLanguage('ja')[0];
    const groups = [...new Set(hiragana.characters.map((character) => character.group))];
    localStorage.setItem('langlearn-guided-ja-Hiragana', JSON.stringify(groups));
    expect(getStartingPoints('ja')[0].route).toBe(guidedLettersRoute('ja', 'Katakana', NEXT_GUIDED_GROUP));
    expect(stored.size).toBe(1);
    expect(JSON.parse(localStorage.getItem('langlearn-guided-ja-Hiragana')!)).toEqual(groups);
  });

  it('never offers lessons that do not exist for a custom language', () => {
    const points = getStartingPoints('klingon');
    expect(points.map((p) => p.id)).toEqual(['import', 'words']);
    expect(points.filter((p) => p.recommended)).toHaveLength(1);
    for (const point of points) {
      expect(isKnownRoute(point.route)).toBe(true);
    }
  });

  it('writes plain labels with no jargon', () => {
    const jargon = /SM-2|SRS|algorithm|mining/i;
    for (const lang of Object.keys(LANGUAGES)) {
      for (const point of getStartingPoints(lang)) {
        expect(point.label).not.toMatch(jargon);
        expect(point.sublabel).not.toMatch(jargon);
      }
    }
  });
});
