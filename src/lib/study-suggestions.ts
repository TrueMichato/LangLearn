import { db } from '../db/schema';
import { getDueCount } from '../db/reviews';
import { getTotalWordCount } from '../db/words';
import { getLessonProgress } from '../db/lessons';
import { getCharacterProgress } from '../db/characters';
import { ROUTES, lettersRoute, guidedLettersRoute } from './routes';

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
      route: ROUTES.review,
      priority: 100,
      reason: `${dueCount} card${dueCount === 1 ? ' is' : 's are'} due now`,
    });
  }

  // 2. No words yet
  const totalWords = await getTotalWordCount();
  if (totalWords === 0) {
    suggestions.push({
      id: 'first-words',
      title: 'Learn your first words',
      description: 'A short themed lesson — no word list needed',
      icon: '✨',
      route: ROUTES.vocabLessons,
      priority: 95,
      reason: 'Start here — it takes about two minutes',
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
      route: ROUTES.reader,
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
            route: ROUTES.grammar,
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
  const letterLangs = languages.filter((l) => l === 'ja' || l === 'ru' || l === 'pt' || l === 'es' || l === 'ar' || l === 'ro');
  for (const lang of letterLangs) {
    const chars = await getCharacterProgress(lang);
    const mastered = chars.filter((c) => c.mastery === 'mastered').length;
    const total = chars.length;
    if (total === 0 || (total > 0 && mastered / total < 0.5)) {
      /* "Only 0% mastered" is the first thing a learner saw after finishing
         their very first letter column — a deflating way to describe real
         work. Count what they've started, not what they're missing. */
      suggestions.push({
        id: `letters-${lang}`,
        title: total === 0 ? 'Practice Letters' : 'Keep going with the letters',
        description:
          total === 0
            ? 'Start learning the writing system'
            : `${mastered} of ${total} characters mastered so far`,
        icon: '✍️',
        route: total === 0 ? guidedLettersRoute(lang) : lettersRoute(lang),
        priority: 45,
        reason:
          total === 0
            ? 'Try the writing system!'
            : `You've started ${total} — a few more each day adds up`,
      });
      break;
    }
  }

  // 6. Daily challenge is owned by DailyChallengeCard on the dashboard, which
  // also renders the completed state. Duplicating it here showed the same
  // prompt twice on one screen.

  // 7. Weak words — low ease (SM-2) or high difficulty (FSRS)
  const allReviews = await db.reviews.toArray();
  const weakWords = allReviews.filter(
    (r) =>
      r.repetitions > 0 &&
      (r.difficulty != null ? r.difficulty >= 7 : r.ease < 1.5),
  );
  if (weakWords.length >= 3) {
    suggestions.push({
      id: 'weak-words',
      title: 'Review Difficult Words',
      description: `${weakWords.length} words need extra practice`,
      icon: '💪',
      route: ROUTES.review,
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
          s.activity === 'listening' && new Date(s.startTime) >= threeDaysAgo,
      ),
    );
  if (recentListening.length === 0 && totalWords >= 10) {
    suggestions.push({
      id: 'listening',
      title: 'Try Listening Practice',
      description: 'Improve comprehension with audio passages',
      icon: '🎧',
      route: ROUTES.listening,
      priority: 40,
      reason: 'Build listening skills alongside reading',
    });
  }

  // Sort by priority (highest first) and return top 3
  suggestions.sort((a, b) => b.priority - a.priority);
  return suggestions.slice(0, 3);
}
