import { describe, it, expect } from 'vitest';
import { summarizeTopics, topicIdFromTags } from '../lib/grammar-topics';
import type { Word, Review } from '../db/schema';

function gword(id: number, lang: string, tags: string[]): Word {
  return {
    id,
    language: lang,
    word: `w${id}`,
    reading: '',
    meaning: 'm',
    contextSentence: '',
    sourceTextId: null,
    tags,
    type: 'grammar',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function review(wordId: number, ease: number, repetitions: number): Review {
  return {
    wordId,
    ease,
    interval: 1,
    repetitions,
    nextReviewDate: '2026-01-02T00:00:00.000Z',
    lastReviewDate: '2026-01-01T00:00:00.000Z',
  };
}

describe('topicIdFromTags', () => {
  it('returns the non-marker tag', () => {
    expect(topicIdFromTags(['grammar', 'particles'])).toBe('particles');
  });
  it('ignores the sentence marker', () => {
    expect(topicIdFromTags(['grammar', 'sentence'])).toBeNull();
  });
  it('returns null when only markers present', () => {
    expect(topicIdFromTags(['grammar'])).toBeNull();
  });
});

describe('summarizeTopics', () => {
  it('groups grammar cards by topic and computes retention', () => {
    const words = [
      gword(1, 'ja', ['grammar', 'particles']),
      gword(2, 'ja', ['grammar', 'particles']),
      gword(3, 'ja', ['grammar', 'verbs']),
    ];
    const reviews = new Map<number, Review>([
      [1, review(1, 2.6, 2)], // strong
      [2, review(2, 2.0, 1)], // weak
      [3, review(3, 2.8, 3)], // strong
    ]);
    const lapses = new Map<number, number>([[2, 3]]);

    const result = summarizeTopics(words, reviews, lapses);
    const particles = result.find((t) => t.topicId === 'particles')!;
    const verbs = result.find((t) => t.topicId === 'verbs')!;

    expect(particles.cardCount).toBe(2);
    expect(particles.strongCount).toBe(1);
    expect(particles.retentionPercent).toBe(50);
    expect(particles.lapses).toBe(3);
    expect(verbs.retentionPercent).toBe(100);
  });

  it('sorts weakest topic first', () => {
    const words = [
      gword(1, 'ja', ['grammar', 'weak']),
      gword(2, 'ja', ['grammar', 'strong']),
    ];
    const reviews = new Map<number, Review>([
      [1, review(1, 1.5, 1)],
      [2, review(2, 2.9, 4)],
    ]);
    const result = summarizeTopics(words, reviews, new Map());
    expect(result[0].topicId).toBe('weak');
  });

  it('ignores non-grammar words', () => {
    const w = gword(1, 'ja', ['grammar', 'particles']);
    const plain: Word = { ...gword(2, 'ja', ['core']), type: 'word' };
    const result = summarizeTopics(
      [w, plain],
      new Map([[1, review(1, 2.6, 2)]]),
      new Map()
    );
    expect(result).toHaveLength(1);
    expect(result[0].topicId).toBe('particles');
  });
});
