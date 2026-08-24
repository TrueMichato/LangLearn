import { db, type GuidedActivityProgress } from './schema';
import type { LearningPathActivityKind } from '../types/learning-path';

export function guidedActivityProgressId(
  language: string,
  milestoneId: string,
): string {
  return `${language}/${milestoneId}`;
}

export async function loadGuidedActivityProgress(
  language: string,
): Promise<GuidedActivityProgress[]> {
  return db.guidedActivityProgress.where('language').equals(language).toArray();
}

export async function recordGuidedActivityAttempt(input: {
  language: string;
  milestoneId: string;
  activity: LearningPathActivityKind;
  itemsCompleted: number;
  score?: number;
}): Promise<GuidedActivityProgress> {
  const id = guidedActivityProgressId(input.language, input.milestoneId);
  return db.transaction('rw', db.guidedActivityProgress, async () => {
    const existing = await db.guidedActivityProgress.get(id);
    const row: GuidedActivityProgress = {
      id,
      language: input.language,
      milestoneId: input.milestoneId,
      activity: input.activity,
      completedAt: existing?.completedAt ?? null,
      attempts: (existing?.attempts ?? 0) + 1,
      itemsCompleted: Math.max(
        existing?.itemsCompleted ?? 0,
        Math.max(0, input.itemsCompleted),
      ),
      bestScore:
        input.score == null
          ? existing?.bestScore
          : Math.max(existing?.bestScore ?? input.score, input.score),
    };
    await db.guidedActivityProgress.put(row);
    return row;
  });
}

export async function completeGuidedActivityMilestone(input: {
  language: string;
  milestoneId: string;
  activity: LearningPathActivityKind;
  itemsCompleted: number;
  score?: number;
  completedAt?: string;
}): Promise<GuidedActivityProgress> {
  const id = guidedActivityProgressId(input.language, input.milestoneId);
  return db.transaction('rw', db.guidedActivityProgress, async () => {
    const existing = await db.guidedActivityProgress.get(id);
    const row: GuidedActivityProgress = {
      id,
      language: input.language,
      milestoneId: input.milestoneId,
      activity: input.activity,
      completedAt:
        existing?.completedAt ?? input.completedAt ?? new Date().toISOString(),
      attempts: existing?.attempts ?? 0,
      itemsCompleted: Math.max(
        existing?.itemsCompleted ?? 0,
        Math.max(0, input.itemsCompleted),
      ),
      bestScore:
        input.score == null
          ? existing?.bestScore
          : Math.max(existing?.bestScore ?? input.score, input.score),
    };
    await db.guidedActivityProgress.put(row);
    return row;
  });
}
