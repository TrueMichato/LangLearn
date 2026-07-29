import { describe, it, expect } from 'vitest';
import { getStartingPoints } from '../lib/starting-points';
import { LANGUAGES } from '../lib/languages';
import { isKnownRoute } from '../lib/routes';

const SCRIPT_LANGUAGES = ['ja', 'ru', 'ar'];
const LATIN_LANGUAGES = ['es', 'pt', 'ro'];

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
    expect(points[0].route).toBe(`/letters/${lang}`);
  });

  it.each(LATIN_LANGUAGES)('starts %s with words, not letters', (lang) => {
    const points = getStartingPoints(lang);
    expect(points[0].id).toBe('words');
    expect(points.find((p) => p.id === 'letters')?.recommended).not.toBe(true);
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
