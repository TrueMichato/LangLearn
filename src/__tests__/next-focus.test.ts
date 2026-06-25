import { describe, it, expect } from 'vitest';
import { pickNextFocus } from '../lib/next-focus';

describe('pickNextFocus', () => {
  it('prioritizes mistakes above everything', () => {
    const cta = pickNextFocus({
      mistakeCount: 3,
      weakestTopic: { topicId: 'particles', retentionPercent: 20, cardCount: 5 },
      weakestWordCount: 5,
    });
    expect(cta?.id).toBe('mistakes');
    expect(cta?.route).toBe('/review?deck=mistakes');
  });

  it('suggests a weak topic when no mistakes', () => {
    const cta = pickNextFocus({
      mistakeCount: 0,
      weakestTopic: { topicId: 'particles', retentionPercent: 40, cardCount: 6 },
      weakestWordCount: 5,
    });
    expect(cta?.id).toBe('topic');
    expect(cta?.route).toContain('deck=topic');
    expect(cta?.route).toContain('particles');
  });

  it('ignores strong or tiny topics', () => {
    const strong = pickNextFocus({
      mistakeCount: 0,
      weakestTopic: { topicId: 'particles', retentionPercent: 90, cardCount: 6 },
      weakestWordCount: 4,
    });
    expect(strong?.id).toBe('weak-words');

    const tiny = pickNextFocus({
      mistakeCount: 0,
      weakestTopic: { topicId: 'particles', retentionPercent: 10, cardCount: 1 },
      weakestWordCount: 4,
    });
    expect(tiny?.id).toBe('weak-words');
  });

  it('falls back to weak words', () => {
    const cta = pickNextFocus({ mistakeCount: 0, weakestWordCount: 2 });
    expect(cta?.id).toBe('weak-words');
  });

  it('returns null when nothing is pressing', () => {
    const cta = pickNextFocus({ mistakeCount: 0, weakestWordCount: 0 });
    expect(cta).toBeNull();
  });

  it('encodes topic ids safely', () => {
    const cta = pickNextFocus({
      mistakeCount: 0,
      weakestTopic: { topicId: 'te form', retentionPercent: 30, cardCount: 4 },
      weakestWordCount: 0,
    });
    expect(cta?.route).toBe('/review?deck=topic&topic=te%20form');
  });
});
