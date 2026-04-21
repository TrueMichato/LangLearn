import { db } from '../db/schema';
import { getDueCount } from '../db/reviews';
import { getTotalWordCount } from '../db/words';
import { getLessonProgress } from '../db/lessons';
import { getCharacterProgress } from '../db/characters';
import { todayStr } from './streaks';

export interface StudySuggestion {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  priority: number;
  reason: string;
}

export async function getStudySuggestions(
  languages: string[],
): Promise<StudySuggestion[]> {
  const suggestions: StudySuggestion[] = [];

  // 1. Due cards — highest priority
  const dueCount = await getDueCount();
  if (dueCount > 0) {
    suggestions.push({
      id: 'due-cards',
      title: 'Review Due Cards',
      description: `${dueCount} card${dueCount === 1 ? '' : 's'} waiting for review`,
      icon: '🃏',
      route: '/review',
      priority: 100,
      reason: `${dueCount} card${dueCount === 1 ? ' is' : 's are'} due now`,
    });
  }

  // 2. No words yet
  const totalWords = await getTotalWordCount();
  if (totalWords === 0) {
    suggestions.push({
      id: 'first-words',
      title: 'Add Your First Words',
      description: 'Start by mining words from a text or adding manually',
      icon: '✨',
      route: '/reader',
      priority: 95,
      reason: 'You have no words yet — get started!',
    });
  }

  // 3. Activity balance — no reading in 3+ days
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const recentReading = await db.studySessions
    .where('activity')
    .equals('reading')
    .filter((s) => new Date(s.startTime) >= threeDaysAgo)
    .count();
  if (recentReading === 0 && totalWords > 0) {
    suggestions.push({
      id: 'read-something',
      title: 'Read Something New',
      description: 'Practice reading and mine new vocabulary',
      icon: '📖',
      route: '/reader',
      priority: 60,
      reason: "You haven't read anything in 3+ days",
    });
  }

  // 4. Grammar progress — find next unfinished lesson
  for (const lang of languages) {
    const progress = await getLessonProgress(lang);
    const completedIds = new Set(
      progress.filter((p) => p.completed).map((p) => p.lessonId),
    );
    // Fetch grammar index to find next lesson
    try {
      const res = await fetch(
        `${import.meta.env.BASE_URL}content/grammar/${lang}/index.json`,
      );
      if (res.ok) {
        const lessons: Array<{ id: string; title: string }> = await res.json();
        const nextLesson = lessons.find((l) => !completedIds.has(l.id));
        if (nextLesson) {
          suggestions.push({
            id: `grammar-${lang}`,
            title: `Continue Grammar`,
            description: nextLesson.title,
            icon: '📝',
            route: '/learn/grammar',
            priority: 50,
            reason: `Next lesson: ${nextLesson.title}`,
          });
          break; // Only suggest one grammar lesson
        }
      }
    } catch {
      // Grammar index unavailable — skip
    }
  }

  // 5. Letter practice — low mastery for JA/RU
  const letterLangs = languages.filter((l) => l === 'ja' || l === 'ru');
  for (const lang of letterLangs) {
    const chars = await getCharacterProgress(lang);
    const mastered = chars.filter((c) => c.mastery === 'mastered').length;
    const total = chars.length;
    if (total === 0 || (total > 0 && mastered / total < 0.5)) {
      suggestions.push({
        id: `letters-${lang}`,
        title: 'Practice Letters',
        description:
          total === 0
            ? 'Start learning the writing system'
            : `${mastered}/${total} characters mastered`,
        icon: '✍️',
        route: `/letters/${lang}`,
        priority: 45,
        reason:
          total === 0
            ? 'Try the writing system!'
            : `Only ${Math.round((mastered / total) * 100)}% mastered`,
      });
      break;
    }
  }

  // 6. Daily challenge — if not done today
  const today = todayStr();
  const todayActivity = await db.dailyActivity.get(today);
  if (!todayActivity?.challengeComplete) {
    suggestions.push({
      id: 'daily-challenge',
      title: 'Daily Challenge',
      description: 'Complete for 1.5× XP bonus!',
      icon: '🎯',
      route: '/daily-challenge',
      priority: 70,
      reason: "Today's challenge is waiting",
    });
  }

  // 7. Weak words — low ease
  const allReviews = await db.reviews.toArray();
  const weakWords = allReviews.filter(
    (r) => r.ease < 1.5 && r.repetitions > 0,
  );
  if (weakWords.length >= 3) {
    suggestions.push({
      id: 'weak-words',
      title: 'Review Difficult Words',
      description: `${weakWords.length} words need extra practice`,
      icon: '💪',
      route: '/review',
      priority: 55,
      reason: `${weakWords.length} words have low retention`,
    });
  }

  // 8. Listening — no recent listening sessions
  const recentListening = await db.studySessions
    .toArray()
    .then((sessions) =>
      sessions.filter(
        (s) =>
          s.activity === 'grammar' && new Date(s.startTime) >= threeDaysAgo,
      ),
    );
  if (recentListening.length === 0 && totalWords >= 10) {
    suggestions.push({
      id: 'listening',
      title: 'Try Listening Practice',
      description: 'Improve comprehension with audio passages',
      icon: '🎧',
      route: '/listening',
      priority: 40,
      reason: 'Build listening skills alongside reading',
    });
  }

  // Sort by priority (highest first) and return top 3
  suggestions.sort((a, b) => b.priority - a.priority);
  return suggestions.slice(0, 3);
}
