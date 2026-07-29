import { describe, it, expect } from 'vitest';
import {
  resolveCurrentLanguage,
  currentLanguageOf,
  languageStateOnAdd,
  languageStateOnRemove,
} from '../lib/current-language';

/* The regression this whole module exists for: before a current language
   existed, fifteen surfaces each kept a local `useState(activeLanguages[0])`.
   Someone studying Japanese and Russian picked Russian on Grammar, walked to
   Vocab, and was shown Japanese again — every time, on every surface. */

describe('resolveCurrentLanguage', () => {
  it('honours the language the learner chose', () => {
    const r = resolveCurrentLanguage(['ja', 'ru'], 'ru');
    expect(r.language).toBe('ru');
    expect(r.requested).toBe('ru');
    expect(r.isSupported).toBe(true);
  });

  it('falls back to the first active language on installs that predate the field', () => {
    expect(resolveCurrentLanguage(['ru', 'ja'], '').language).toBe('ru');
    expect(resolveCurrentLanguage(['ru', 'ja'], undefined).language).toBe('ru');
  });

  it('ignores a stored language that is no longer active', () => {
    // Studied Japanese, removed it in Settings — the stale code must not win.
    expect(resolveCurrentLanguage(['ru', 'es'], 'ja').language).toBe('ru');
  });

  it('has no language at all when nothing is active', () => {
    const r = resolveCurrentLanguage([], '');
    expect(r.language).toBeUndefined();
    expect(r.isSupported).toBe(false);
  });

  describe('on a surface that supports only some languages', () => {
    it('narrows the options to that subset', () => {
      const r = resolveCurrentLanguage(['ja', 'ro'], 'ja', ['ja', 'ru']);
      expect(r.options).toEqual(['ja']);
    });

    it('reports the gap instead of silently switching', () => {
      // Conjugation drills have no Romanian. Quietly showing Japanese to
      // someone who chose Romanian is the confusion we are removing.
      const r = resolveCurrentLanguage(['ro', 'ja'], 'ro', ['ja', 'ru']);
      expect(r.isSupported).toBe(false);
      expect(r.requested).toBe('ro');
    });

    it('still offers something usable when the choice is unavailable', () => {
      const r = resolveCurrentLanguage(['ro', 'ja'], 'ro', ['ja', 'ru']);
      expect(r.language).toBe('ja');
    });

    it('offers nothing when the surface supports none of your languages', () => {
      const r = resolveCurrentLanguage(['ro'], 'ro', ['ja']);
      expect(r.language).toBeUndefined();
      expect(r.options).toEqual([]);
      expect(r.isSupported).toBe(false);
    });
  });
});

describe('languageStateOnAdd', () => {
  it("makes onboarding's first pick the current language", () => {
    expect(languageStateOnAdd([], '', 'ru')).toEqual({
      activeLanguages: ['ru'],
      currentLanguage: 'ru',
    });
  });

  it('leaves an established choice alone when a second language is added', () => {
    expect(languageStateOnAdd(['ja'], 'ja', 'ru')).toEqual({
      activeLanguages: ['ja', 'ru'],
      currentLanguage: 'ja',
    });
  });

  it('adopts the new language when the stored one was stale', () => {
    expect(languageStateOnAdd(['ja'], 'zz', 'ru').currentLanguage).toBe('ru');
  });

  it('does not duplicate a language that is already active', () => {
    expect(languageStateOnAdd(['ja', 'ru'], 'ru', 'ja').activeLanguages).toEqual([
      'ja',
      'ru',
    ]);
  });
});

describe('languageStateOnRemove', () => {
  it('moves to a remaining language when you remove the one you were studying', () => {
    expect(languageStateOnRemove(['ja', 'ru'], 'ja', 'ja')).toEqual({
      activeLanguages: ['ru'],
      currentLanguage: 'ru',
    });
  });

  it('leaves the current language alone when a different one is removed', () => {
    expect(languageStateOnRemove(['ja', 'ru'], 'ru', 'ja').currentLanguage).toBe('ru');
  });

  it('empties the selection when the last language goes', () => {
    expect(languageStateOnRemove(['ja'], 'ja', 'ja')).toEqual({
      activeLanguages: [],
      currentLanguage: '',
    });
  });
});

describe('currentLanguageOf', () => {
  /* Forms default to what you're studying but must never write back: picking a
     language in Add Word answers "where does this word go?", not "what am I
     studying now?". Reading it once, imperatively, is what enforces that. */
  it('gives forms the language you are studying', () => {
    expect(
      currentLanguageOf({ activeLanguages: ['ja', 'ru'], currentLanguage: 'ru' }),
    ).toBe('ru');
  });

  it('applies the same staleness rules as the hook', () => {
    expect(
      currentLanguageOf({ activeLanguages: ['ru'], currentLanguage: 'ja' }),
    ).toBe('ru');
  });

  it('has no answer before any language is chosen', () => {
    expect(
      currentLanguageOf({ activeLanguages: [], currentLanguage: '' }),
    ).toBeUndefined();
  });
});
