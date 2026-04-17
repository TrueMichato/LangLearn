import { db } from '../db/schema';
import { BADGES } from '../data/badges';
import { calculateCurrentStreak } from './streaks';
import { useXPStore } from '../stores/xpStore';
import { useBadgeStore } from '../stores/badgeStore';

export interface BadgeCheckStats {
  totalXP: number;
  currentStreak: number;
  totalReviews: number;
  totalWords: number;
  completedLessons: number;
  masteredKanji: number;
}

export function checkBadges(stats: BadgeCheckStats): string[] {
  const { isUnlocked } = useBadgeStore.getState();

  return BADGES
    .filter((badge) => {
      if (isUnlocked(badge.id)) return false;

      const { type, threshold } = badge.condition;
      switch (type) {
        case 'xp': return stats.totalXP >= threshold;
        case 'streak': return stats.currentStreak >= threshold;
        case 'reviews': return stats.totalReviews >= threshold;
        case 'words': return stats.totalWords >= threshold;
        case 'lessons': return stats.completedLessons >= threshold;
        case 'kanji': return stats.masteredKanji >= threshold;
        default: return false;
      }
    })
    .map((b) => b.id);
}

export async function gatherBadgeStats(): Promise<BadgeCheckStats> {
  const [sessions, words, allReviews, activities, allLessons, characters] =
    await Promise.all([
      db.studySessions.toArray(),
      db.words.count(),
      db.reviews.toArray(),
      db.dailyActivity.toArray(),
      db.lessonProgress.toArray(),
      db.characterProgress.where('mastery').equals('mastered').count(),
    ]);

  const reviews = allReviews.filter((r) => r.repetitions > 0).length;
  const lessons = allLessons.filter((l) => l.completed).length;

  const timeXP = sessions.reduce((sum, s) => sum + s.xpEarned, 0);
  const bonusXP = useXPStore.getState().bonusXP;

  return {
    totalXP: timeXP + bonusXP,
    currentStreak: calculateCurrentStreak(activities),
    totalReviews: reviews,
    totalWords: words,
    completedLessons: lessons,
    masteredKanji: characters,
  };
}
