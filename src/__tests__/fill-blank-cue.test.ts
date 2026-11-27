import { describe, expect, it } from 'vitest';
import { fillBlankCue, firstBaseCharacter, firstLetterHint } from '../lib/fill-blank-cue';

describe('fillBlankCue', () => {
  it('prefers the full sentence translation', () => {
    expect(fillBlankCue({ hint: 'Grilled', translation: 'I grilled the fish.' }))
      .toEqual({ text: 'I grilled the fish.', kind: 'translation' });
  });

  it('falls back to the legacy hint when translation is missing or blank', () => {
    expect(fillBlankCue({ hint: 'Grilled' })).toEqual({ text: 'Grilled', kind: 'hint' });
    expect(fillBlankCue({ hint: 'Grilled', translation: '  ' })).toEqual({ text: 'Grilled', kind: 'hint' });
    expect(fillBlankCue({ hint: '' })).toBeNull();
  });
});

describe('firstBaseCharacter', () => {
  it('skips leading Arabic combining marks and tatweel', () => {
    expect(firstBaseCharacter('\u064Eكَتَبَ')).toBe('ك');
    expect(firstBaseCharacter('\u0640\u0651بيت')).toBe('ب');
  });

  it('keeps astral characters intact', () => {
    expect(firstBaseCharacter('𠮷野家')).toBe('𠮷');
  });
});

describe('firstLetterHint', () => {
  it('gives the first letter of the answer', () => {
    expect(firstLetterHint('книга', 'ru')).toBe('Starts with “к”');
  });

  it('uses the lesson reading for a Japanese kanji answer, including conjugated forms', () => {
    const words = [{ word: '焼く', reading: 'やく' }, { word: '料理', reading: 'りょうり' }];
    expect(firstLetterHint('焼き', 'ja', words)).toBe('Starts with the sound “や”');
    expect(firstLetterHint('料理', 'ja', words)).toBe('Starts with the sound “り”');
  });

  it('falls back to the first character when the Japanese reading is ambiguous or absent', () => {
    const words = [{ word: '食べる', reading: 'たべる' }, { word: '食事', reading: 'しょくじ' }];
    expect(firstLetterHint('食べ', 'ja', words)).toBe('Starts with “食”');
    expect(firstLetterHint('', 'ja')).toBeNull();
  });
});
