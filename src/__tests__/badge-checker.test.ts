import { describe, it, expect, beforeEach } from 'vitest';
import { checkBadges, type BadgeCheckStats } from '../lib/badge-checker';
import { useBadgeStore } from '../stores/badgeStore';

function emptyStats(overrides: Partial<BadgeCheckStats> = {}): BadgeCheckStats {
  return {
    totalXP: 0,
    currentStreak: 0,
    totalReviews: 0,
    totalWords: 0,
    completedLessons: 0,
    masteredKanji: 0,
    masteredLettersJa: 0,
    masteredLettersRu: 0,
    masteredLettersPt: 0,
    completedChallenges: 0,
    savedTexts: 0,
    wordsByLang: {},
    lessonsByLang: {},
    testsPassedByLang: {},
    ...overrides,
  };
}

describe('checkBadges — language gating', () => {
  beforeEach(() => {
    useBadgeStore.setState({ unlockedBadges: {}, lastToast: null });
  });

  it('does not unlock Japanese kanji/kana badges for a Portuguese-only user with stale ja data', () => {
    // Imagine the user briefly studied Japanese, then removed it.
    // Stale characterProgress rows still produce high "mastered" counts.
    const stats = emptyStats({
      masteredKanji: 250,
      masteredLettersJa: 100,
    });
    const unlocked = checkBadges(stats, ['pt']);
    expect(unlocked.some((id) => id.startsWith('kanji-'))).toBe(false);
    expect(unlocked.some((id) => id.startsWith('letters-ja-'))).toBe(false);
  });

  it('does not unlock Russian letter badges for a Japanese-only user', () => {
    const stats = emptyStats({ masteredLettersRu: 50 });
    const unlocked = checkBadges(stats, ['ja']);
    expect(unlocked.some((id) => id.startsWith('letters-ru-'))).toBe(false);
  });

  it('unlocks Japanese kanji badge when ja is active and threshold is met', () => {
    const stats = emptyStats({ masteredKanji: 10 });
    const unlocked = checkBadges(stats, ['ja']);
    expect(unlocked).toContain('kanji-10');
  });

  it('unlocks Portuguese letter badge when pt is active and threshold is met', () => {
    const stats = emptyStats({ masteredLettersPt: 24 });
    const unlocked = checkBadges(stats, ['pt']);
    expect(unlocked).toContain('letters-pt-10');
    expect(unlocked).toContain('letters-pt-24');
  });

  it('does not unlock Portuguese letter badges when pt is inactive', () => {
    const stats = emptyStats({ masteredLettersPt: 24 });
    const unlocked = checkBadges(stats, ['ja', 'ru']);
    expect(unlocked.some((id) => id.startsWith('letters-pt-'))).toBe(false);
  });
});

describe('checkBadges — per-language tracks', () => {
  beforeEach(() => {
    useBadgeStore.setState({ unlockedBadges: {}, lastToast: null });
  });

  it('unlocks per-language vocabulary milestones only for the matching language', () => {
    const stats = emptyStats({
      totalWords: 30,
      wordsByLang: { pt: 30, ja: 0 },
    });
    const unlocked = checkBadges(stats, ['pt', 'ja']);
    expect(unlocked).toContain('words-pt-25');
    expect(unlocked).not.toContain('words-ja-25');
    // Global vocab track still fires at threshold 25.
    expect(unlocked).toContain('words-25');
  });

  it('unlocks per-language lesson and test badges when thresholds are met', () => {
    const stats = emptyStats({
      lessonsByLang: { ru: 5 },
      testsPassedByLang: { ru: 1 },
    });
    const unlocked = checkBadges(stats, ['ru']);
    expect(unlocked).toContain('lessons-ru-5');
    expect(unlocked).toContain('tests-ru-1');
  });

  it('does not unlock per-language badges when their language is inactive', () => {
    const stats = emptyStats({
      wordsByLang: { ja: 500 },
      lessonsByLang: { ja: 20 },
      testsPassedByLang: { ja: 5 },
    });
    const unlocked = checkBadges(stats, ['pt']);
    expect(unlocked.some((id) => id.startsWith('words-ja-'))).toBe(false);
    expect(unlocked.some((id) => id.startsWith('lessons-ja-'))).toBe(false);
    expect(unlocked.some((id) => id.startsWith('tests-ja-'))).toBe(false);
  });
});

describe('checkBadges — global badges remain language-agnostic', () => {
  beforeEach(() => {
    useBadgeStore.setState({ unlockedBadges: {}, lastToast: null });
  });

  it('unlocks XP / streak / reviews / generic words / lessons / texts / challenges regardless of language', () => {
    const stats = emptyStats({
      totalXP: 150,
      currentStreak: 3,
      totalReviews: 10,
      totalWords: 10,
      completedLessons: 5,
      completedChallenges: 1,
      savedTexts: 1,
    });
    const unlocked = checkBadges(stats, ['pt']);
    expect(unlocked).toContain('xp-100');
    expect(unlocked).toContain('streak-3');
    expect(unlocked).toContain('reviews-10');
    expect(unlocked).toContain('words-10');
    expect(unlocked).toContain('lessons-5');
    expect(unlocked).toContain('challenges-1');
    expect(unlocked).toContain('texts-1');
  });
});
