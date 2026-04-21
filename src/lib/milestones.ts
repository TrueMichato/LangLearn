import { db } from '../db/schema';
import { calculateCurrentStreak } from './streaks';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'vocabulary' | 'review' | 'lessons' | 'streak' | 'characters';
  target: number;
  getCurrent: () => Promise<number>;
}

export type ResolvedMilestone = Milestone & {
  current: number;
  completed: boolean;
};

async function getWordCount(): Promise<number> {
  return db.words.count();
}

async function getTotalReviews(): Promise<number> {
  const reviews = await db.reviews.toArray();
  return reviews.reduce((sum, r) => sum + r.repetitions, 0);
}

async function getCompletedLessons(): Promise<number> {
  const all = await db.lessonProgress.toArray();
  return all.filter((l) => l.completed).length;
}

async function getCurrentStreak(): Promise<number> {
  const activities = await db.dailyActivity.toArray();
  return calculateCurrentStreak(activities);
}

async function getMasteredCharacters(): Promise<number> {
  const chars = await db.characterProgress
    .where('mastery')
    .equals('mastered')
    .count();
  return chars;
}

const MILESTONES: Milestone[] = [
  // Vocabulary
  ...[50, 100, 250, 500, 1000, 2000].map(
    (n): Milestone => ({
      id: `vocab-${n}`,
      title: `${n} Words`,
      description: `Learn ${n} vocabulary words`,
      icon: '📚',
      category: 'vocabulary',
      target: n,
      getCurrent: getWordCount,
    }),
  ),
  // Reviews
  ...[100, 500, 1000, 2500].map(
    (n): Milestone => ({
      id: `reviews-${n}`,
      title: `${n} Reviews`,
      description: `Complete ${n} total reviews`,
      icon: '🃏',
      category: 'review',
      target: n,
      getCurrent: getTotalReviews,
    }),
  ),
  // Lessons
  ...[5, 10, 25, 50].map(
    (n): Milestone => ({
      id: `lessons-${n}`,
      title: `${n} Lessons`,
      description: `Complete ${n} lessons`,
      icon: '📖',
      category: 'lessons',
      target: n,
      getCurrent: getCompletedLessons,
    }),
  ),
  // Streak
  ...[7, 30, 60, 100].map(
    (n): Milestone => ({
      id: `streak-${n}`,
      title: `${n}-Day Streak`,
      description: `Maintain a ${n}-day study streak`,
      icon: '🔥',
      category: 'streak',
      target: n,
      getCurrent: getCurrentStreak,
    }),
  ),
  // Characters
  ...[50, 100, 200].map(
    (n): Milestone => ({
      id: `chars-${n}`,
      title: `${n} Characters`,
      description: `Master ${n} characters`,
      icon: '✍️',
      category: 'characters',
      target: n,
      getCurrent: getMasteredCharacters,
    }),
  ),
];

export async function getMilestones(): Promise<ResolvedMilestone[]> {
  // Group by category
  const byCategory = new Map<string, Milestone[]>();
  for (const m of MILESTONES) {
    const list = byCategory.get(m.category) ?? [];
    list.push(m);
    byCategory.set(m.category, list);
  }

  const result: ResolvedMilestone[] = [];

  for (const [, milestones] of byCategory) {
    // All milestones in a category share the same getCurrent
    const current = await milestones[0].getCurrent();

    // Find the next uncompleted milestone
    const sorted = milestones.sort((a, b) => a.target - b.target);
    const nextUncompleted = sorted.find((m) => current < m.target);

    if (nextUncompleted) {
      result.push({ ...nextUncompleted, current, completed: false });
    }

    // Include the most recently completed milestone (highest target that's met)
    const completedOnes = sorted.filter((m) => current >= m.target);
    if (completedOnes.length > 0) {
      const latest = completedOnes[completedOnes.length - 1];
      // Avoid duplicate if next uncompleted is already in results
      if (!nextUncompleted || latest.id !== nextUncompleted.id) {
        result.push({ ...latest, current, completed: true });
      }
    }
  }

  // Sort: uncompleted first (by progress %), then completed
  result.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (!a.completed && !b.completed) {
      return b.current / b.target - a.current / a.target;
    }
    return 0;
  });

  return result.slice(0, 4);
}
