import type {
  LearningPathLessonRef,
  LearningPathManifest,
  LearningPathUnitManifest,
} from '../../types/learning-path';

export const grammar = (lessonId: string): LearningPathLessonRef => ({
  kind: 'grammar',
  lessonId,
});

export const vocab = (lessonId: string): LearningPathLessonRef => ({
  kind: 'vocab',
  lessonId,
});

export function unitLessons(
  unit: LearningPathUnitManifest,
): LearningPathLessonRef[] {
  return unit.strands
    ? unit.strands.flatMap((strand) => strand.lessons)
    : unit.lessons;
}

export function defineLearningPath(
  manifest: LearningPathManifest,
): LearningPathManifest {
  const unitIds = new Set<string>();
  const lessonIds = new Set<string>();
  const registerLesson = (lesson: LearningPathLessonRef) => {
    const lessonKey = `${lesson.kind}:${lesson.lessonId}`;
    if (lessonIds.has(lessonKey)) {
      throw new Error(
        `Learning path ${manifest.language} repeats lesson ${lessonKey}`,
      );
    }
    lessonIds.add(lessonKey);
  };

  for (const lesson of manifest.letterUnitLessons ?? []) {
    registerLesson(lesson);
  }

  for (const unit of manifest.units) {
    if (unit.id === 'letters') {
      throw new Error(
        `Learning path ${manifest.language} reserves unit ID letters`,
      );
    }
    if (unitIds.has(unit.id)) {
      throw new Error(
        `Learning path ${manifest.language} repeats unit ${unit.id}`,
      );
    }
    unitIds.add(unit.id);

    if (unit.strands) {
      if (unit.strands.length < 2) {
        throw new Error(
          `Parallel unit ${unit.id} must contain at least two strands`,
        );
      }
      const strandIds = new Set<string>();
      for (const strand of unit.strands) {
        if (strandIds.has(strand.id)) {
          throw new Error(
            `Parallel unit ${unit.id} repeats strand ${strand.id}`,
          );
        }
        if (strand.lessons.length === 0) {
          throw new Error(
            `Parallel unit ${unit.id} has an empty strand ${strand.id}`,
          );
        }
        strandIds.add(strand.id);
      }
    } else if (unit.lessons.length === 0) {
      throw new Error(`Learning path unit ${unit.id} has no lessons`);
    }

    for (const lesson of unitLessons(unit)) registerLesson(lesson);
  }

  return manifest;
}
