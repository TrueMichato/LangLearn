import { db, type LessonProgress } from './schema';

export type CompletionMethod = NonNullable<LessonProgress['completionMethod']>;

export async function getLessonProgress(language: string): Promise<LessonProgress[]> {
  return db.lessonProgress.where('language').equals(language).toArray();
}

export async function markLessonComplete(
  language: string,
  lessonId: string,
  quizScore: number,
): Promise<void> {
  const id = `${language}/${lessonId}`;
  const existing = await db.lessonProgress.get(id);
  await db.lessonProgress.put({
    id,
    language,
    lessonId,
    completed: true,
    quizScore,
    completedAt: new Date().toISOString(),
    attempts: existing?.attempts ?? 1,
    completionMethod: 'lesson',
  });
}

/**
 * Marks several lessons complete in one atomic write — the outcome of
 * testing out of a lesson range. Either every lesson in `lessonIds` ends up
 * completed, or (on error) none of them do: a learner who tests out of five
 * lessons must never end up with the first three marked complete and the
 * rest silently missing because a write mid-batch failed.
 *
 * `lessonIds` are bare lesson ids for the given `kind` — the `vocab/`
 * progress-id prefix is applied here, the same way `VocabLessonView` applies
 * it for a normal completion, so callers never have to know about it.
 */
export async function markLessonsComplete(
  language: string,
  kind: 'grammar' | 'vocab',
  lessonIds: readonly string[],
  quizScore: number,
  completionMethod: CompletionMethod = 'tested-out',
): Promise<void> {
  if (lessonIds.length === 0) return;
  const now = new Date().toISOString();

  await db.transaction('rw', db.lessonProgress, async () => {
    for (const lessonId of lessonIds) {
      const progressLessonId = kind === 'vocab' ? `vocab/${lessonId}` : lessonId;
      const id = `${language}/${progressLessonId}`;
      const existing = await db.lessonProgress.get(id);
      await db.lessonProgress.put({
        id,
        language,
        lessonId: progressLessonId,
        completed: true,
        quizScore,
        completedAt: now,
        attempts: existing?.attempts ?? 1,
        completionMethod,
      });
    }
  });
}

export async function incrementAttempts(
  language: string,
  lessonId: string,
): Promise<void> {
  const id = `${language}/${lessonId}`;
  const existing = await db.lessonProgress.get(id);
  if (existing) {
    await db.lessonProgress.update(id, { attempts: existing.attempts + 1 });
  } else {
    await db.lessonProgress.put({
      id,
      language,
      lessonId,
      completed: false,
      quizScore: 0,
      completedAt: '',
      attempts: 1,
    });
  }
}
