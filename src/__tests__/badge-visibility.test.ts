import { describe, it, expect } from 'vitest';
import { badgeTally, visibleBadges } from '../lib/badge-visibility';
import { BADGES } from '../data/badges';

describe('badge visibility', () => {
  it('hides badges belonging to languages you are not studying', () => {
    const tally = badgeTally(['ja'], {});
    expect(tally.total).toBeLessThan(BADGES.length);
    expect(tally.unlocked).toBe(0);
  });

  it('counts more badges the more languages you study', () => {
    const one = badgeTally(['ja'], {}).total;
    const two = badgeTally(['ja', 'ru'], {}).total;
    expect(two).toBeGreaterThan(one);
  });

  it('always keeps every language-neutral badge in play', () => {
    const neutral = BADGES.filter((b) => !b.language).length;
    expect(badgeTally([], {}).total).toBe(neutral);
  });

  /* Dropping a language must never delete something you already did. */
  it('keeps an earned badge visible after its language is removed', () => {
    const ptBadge = BADGES.find((b) => b.language === 'pt');
    expect(ptBadge).toBeDefined();
    const ids = visibleBadges(['ja'], { [ptBadge!.id]: true }).map((b) => b.id);
    expect(ids).toContain(ptBadge!.id);
  });

  /* The three surfaces that report a badge count must agree, so they all read
     the same denominator. This asserts the denominator is the visible set and
     not the raw catalogue. */
  it('reports a denominator that matches the visible set', () => {
    const langs = ['ja', 'ru'];
    expect(badgeTally(langs, {}).total).toBe(visibleBadges(langs, {}).length);
  });
});
