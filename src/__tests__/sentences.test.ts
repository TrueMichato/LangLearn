import { describe, it, expect } from 'vitest';
import { splitSentences, findSentenceAt } from '../lib/sentences';

describe('splitSentences', () => {
  it('splits Japanese text by 。', () => {
    const result = splitSentences('猫が好きです。犬も好きです。');
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('猫が好きです。');
    expect(result[1].text).toBe('犬も好きです。');
  });

  it('splits Russian text by .', () => {
    const result = splitSentences('Я люблю кошек. А ещё собак.');
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('Я люблю кошек.');
    expect(result[1].text).toBe('А ещё собак.');
  });

  it('splits with mixed delimiters (! ? newline)', () => {
    const result = splitSentences('Hello! How are you?\nI am fine.');
    expect(result).toHaveLength(3);
    expect(result[0].text).toBe('Hello!');
    expect(result[1].text).toBe('How are you?');
    expect(result[2].text).toBe('I am fine.');
  });

  it('handles empty text', () => {
    expect(splitSentences('')).toEqual([]);
  });

  it('handles single sentence without trailing delimiter', () => {
    const result = splitSentences('Hello world');
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Hello world');
  });

  it('handles trailing delimiter', () => {
    const result = splitSentences('Only one sentence.');
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Only one sentence.');
  });
});

describe('findSentenceAt', () => {
  it('returns the correct sentence for a given position', () => {
    const sentences = splitSentences('猫が好きです。犬も好きです。');
    // Position 0 is in first sentence
    expect(findSentenceAt(sentences, 0)).toBe('猫が好きです。');
    // Position 7 is in second sentence
    expect(findSentenceAt(sentences, 7)).toBe('犬も好きです。');
  });

  it('returns empty string for out-of-range position', () => {
    const sentences = splitSentences('Hello.');
    expect(findSentenceAt(sentences, 100)).toBe('');
  });
});
