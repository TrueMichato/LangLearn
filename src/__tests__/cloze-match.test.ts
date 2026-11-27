import { describe, expect, it } from 'vitest';
import { findClozeSpan } from '../lib/cloze-match';

function blank(sentence: string, target: string, language: string) {
  const span = findClozeSpan(sentence, target, language);
  return span && { word: sentence.slice(span.start, span.end), before: sentence.slice(0, span.start), after: sentence.slice(span.end) };
}

describe('findClozeSpan', () => {
  it('matches a capitalized sentence start case-insensitively', () => {
    expect(blank('Завтра будет воскресенье', 'завтра', 'ru')).toEqual({ word: 'Завтра', before: '', after: ' будет воскресенье' });
  });

  it('requires word boundaries in spaced languages', () => {
    expect(blank('Este libro es mío', 'es', 'es')).toEqual({ word: 'es', before: 'Este libro ', after: ' mío' });
    expect(findClozeSpan('Este libro', 'es', 'es')).toBeNull();
    expect(blank('¿Dónde está?', 'dónde', 'es')?.word).toBe('Dónde');
  });

  it('matches Arabic with or without harakat and keeps trailing marks in the span', () => {
    expect(blank('هذا كِتَابٌ جميل', 'كتاب', 'ar')).toEqual({ word: 'كِتَابٌ', before: 'هذا ', after: ' جميل' });
    expect(blank('هذا كتاب جميل', 'كِتَابٌ', 'ar')?.word).toBe('كتاب');
    expect(findClozeSpan('الكتاب', 'كتاب', 'ar')).toBeNull();
  });

  it('uses plain substring matching for Japanese', () => {
    expect(blank('私は水を飲みます', '水', 'ja')).toEqual({ word: '水', before: '私は', after: 'を飲みます' });
  });

  it('maps back to the original string across NFD input', () => {
    const sentence = 'Me\u0301xico es grande';
    expect(blank(sentence, 'México', 'es')?.word).toBe('Me\u0301xico');
  });

  it('returns null for no match or empty target', () => {
    expect(findClozeSpan('Я читаю книгу', 'книга', 'ru')).toBeNull();
    expect(findClozeSpan('Я читаю книгу', '  ', 'ru')).toBeNull();
  });
});
