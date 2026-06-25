import { db } from '../db/schema';
import type { Word, ReviewLogEntry, LessonProgress } from '../db/schema';

export interface GoalProgress {
  id: 'words' | 'reviews' | 'lessons';
  label: string;
  icon: string;
  current: number;
  target: number;
  done: boolean;
}

export interface GoalTargets {
  words: number;
  reviews: number;
  lessons: number;
}

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Pure helper: compute weekly goal progress from already-fetched data. */
export function computeGoals(input: {
  words: Word[];
  logs: ReviewLogEntry[];
  lessons: LessonProgress[];
  targets: GoalTargets;
  sinceIso: string;
}): GoalProgress[] {
  const { words, logs, lessons, targets, sinceIso } = input;

  const wordsLearned = words.filter((w) => w.createdAt >= sinceIso).length;
  const reviews = logs.filter((l) => l.date >= sinceIso).length;
  const lessonsDone = lessons.filter(
    (l) => l.completed && l.completedAt >= sinceIso
  ).length;

  const make = (
    id: GoalProgress['id'],
    label: string,
    icon: string,
    current: number,
    target: number
  ): GoalProgress => ({
    id,
    label,
    icon,
    current,
    target,
    done: target > 0 && current >= target,
  });

  return [
    make('words', 'New words', '📚', wordsLearned, targets.words),
    make('reviews', 'Reviews', '🃏', reviews, targets.reviews),
    make('lessons', 'Lessons finished', '🎓', lessonsDone, targets.lessons),
  ];
}

/** Aggregate weekly goal progress over the last 7 days. */
export async function getWeeklyGoals(
  targets: GoalTargets,
  languages?: string[]
): Promise<GoalProgress[]> {
  const sinceIso = isoDaysAgo(7);

  const [words, logs, lessons] = await Promise.all([
    db.words.toArray(),
    db.reviewLog.toArray(),
    db.lessonProgress.toArray(),
  ]);

  const langSet = languages && languages.length > 0 ? new Set(languages) : null;

  return computeGoals({
    words: langSet ? words.filter((w) => langSet.has(w.language)) : words,
    logs: langSet ? logs.filter((l) => langSet.has(l.language)) : logs,
    lessons: langSet ? lessons.filter((l) => langSet.has(l.language)) : lessons,
    targets,
    sinceIso,
  });
}
