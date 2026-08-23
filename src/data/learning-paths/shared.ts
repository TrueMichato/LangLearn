import type {
  LearningPathLessonRef,
  LearningPathManifest,
} from '../../types/learning-path';

export const grammar = (lessonId: string): LearningPathLessonRef => ({
  kind: 'grammar',
  lessonId,
});

export const vocab = (lessonId: string): LearningPathLessonRef => ({
  kind: 'vocab',
  lessonId,
});

export function defineLearningPath(
  manifest: LearningPathManifest,
): LearningPathManifest {
  return manifest;
}
