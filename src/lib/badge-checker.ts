import { db } from '../db/schema';
import { BADGES, TEST_PASS_SCORE, type BadgeDefinition } from '../data/badges';
import { calculateCurrentStreak } from './streaks';
import { useXPStore } from '../stores/xpStore';
import { useBadgeStore } from '../stores/badgeStore';
import { useSettingsStore } from '../stores/settingsStore';

export interface BadgeCheckStats {
  totalXP: number;
  currentStreak: number;
  totalReviews: number;
  totalWords: number;
  completedLessons: number;
  masteredKanji: number;
  masteredLettersJa: number;
  masteredLettersRu: number;
  masteredLettersPt: number;
  completedChallenges: number;
  savedTexts: number;
  /** Word counts keyed by language code (only languages with words present). */
  wordsByLang: Record<string, number>;
  /** Completed lesson counts keyed by language code. */
  lessonsByLang: Record<string, number>;
  /** Passing test counts (score >= TEST_PASS_SCORE) keyed by language code. */
  testsPassedByLang: Record<string, number>;
}

export function checkBadges(
  stats: BadgeCheckStats,
  activeLanguages: string[],
): string[] {
  const { isUnlocked } = useBadgeStore.getState();
  const activeSet = new Set(activeLanguages);

  return BADGES.filter((badge) => {
    if (isUnlocked(badge.id)) return false;
    if (badge.language && !activeSet.has(badge.language)) return false;
    return meetsThreshold(badge, stats);
  }).map((b) => b.id);
}

function meetsThreshold(badge: BadgeDefinition, stats: BadgeCheckStats): boolean {
  const { type, threshold } = badge.condition;
  switch (type) {
    case 'xp': return stats.totalXP >= threshold;
    case 'streak': return stats.currentStreak >= threshold;
    case 'reviews': return stats.totalReviews >= threshold;
    case 'words': return stats.totalWords >= threshold;
    case 'lessons': return stats.completedLessons >= threshold;
    case 'kanji': return stats.masteredKanji >= threshold;
    case 'letters-ja': return stats.masteredLettersJa >= threshold;
    case 'letters-ru': return stats.masteredLettersRu >= threshold;
    case 'letters-pt': return stats.masteredLettersPt >= threshold;
    case 'challenges': return stats.completedChallenges >= threshold;
    case 'texts': return stats.savedTexts >= threshold;
    case 'words-lang':
      return !!badge.language && (stats.wordsByLang[badge.language] ?? 0) >= threshold;
    case 'lessons-lang':
      return !!badge.language && (stats.lessonsByLang[badge.language] ?? 0) >= threshold;
    case 'tests-lang':
      return !!badge.language && (stats.testsPassedByLang[badge.language] ?? 0) >= threshold;
    default: return false;
  }
}

export async function gatherBadgeStats(): Promise<BadgeCheckStats> {
  const [sessions, allWords, allReviews, activities, allLessons, masteredChars, texts, tests] =
    await Promise.all([
      db.studySessions.toArray(),
      db.words.toArray(),
      db.reviews.toArray(),
      db.dailyActivity.toArray(),
      db.lessonProgress.toArray(),
      db.characterProgress.where('mastery').equals('mastered').toArray(),
      db.texts.count(),
      db.testHistory.toArray(),
    ]);

  const reviews = allReviews.filter((r) => r.repetitions > 0).length;
  const completedLessonRows = allLessons.filter((l) => l.completed);
  const challenges = activities.filter((a) => a.challengeComplete).length;

  // Mastered characters per language/alphabet.
  const masteredKanji = masteredChars.filter((c) => c.id.startsWith('ja/Kanji')).length;
  const masteredLettersJa = masteredChars.filter(
    (c) => c.id.startsWith('ja/') && !c.id.startsWith('ja/Kanji'),
  ).length;
  const masteredLettersRu = masteredChars.filter((c) => c.id.startsWith('ru/')).length;
  const masteredLettersPt = masteredChars.filter((c) => c.id.startsWith('pt/')).length;

  // Per-language tallies.
  const wordsByLang: Record<string, number> = {};
  for (const w of allWords) wordsByLang[w.language] = (wordsByLang[w.language] ?? 0) + 1;

  const lessonsByLang: Record<string, number> = {};
  for (const l of completedLessonRows) {
    lessonsByLang[l.language] = (lessonsByLang[l.language] ?? 0) + 1;
  }

  const testsPassedByLang: Record<string, number> = {};
  for (const t of tests) {
    if (t.score >= TEST_PASS_SCORE) {
      testsPassedByLang[t.language] = (testsPassedByLang[t.language] ?? 0) + 1;
    }
  }

  const timeXP = sessions.reduce((sum, s) => sum + s.xpEarned, 0);
  const bonusXP = useXPStore.getState().bonusXP;

  return {
    totalXP: timeXP + bonusXP,
    currentStreak: calculateCurrentStreak(activities),
    totalReviews: reviews,
    totalWords: allWords.length,
    completedLessons: completedLessonRows.length,
    masteredKanji,
    masteredLettersJa,
    masteredLettersRu,
    masteredLettersPt,
    completedChallenges: challenges,
    savedTexts: texts,
    wordsByLang,
    lessonsByLang,
    testsPassedByLang,
  };
}

/** Convenience accessor that pulls the active language list from settings. */
export function getActiveLanguages(): string[] {
  return useSettingsStore.getState().activeLanguages;
}
