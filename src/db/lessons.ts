import { db, type LessonProgress } from './schema';

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
