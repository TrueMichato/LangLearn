import type {
  LearningPathActivityKind,
  LearningPathActivityRef,
  LearningPathLessonRef,
  LearningPathManifest,
  LearningPathMilestoneRef,
  LearningPathRequirement,
  LearningPathSessionBounds,
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
): LearningPathMilestoneRef[] {
  return unit.strands
    ? unit.strands.flatMap((strand) => strand.lessons)
    : unit.lessons;
}

export function activityMilestoneId(
  kind: LearningPathActivityKind,
  id: string,
): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error(`Activity milestone id must be kebab-case: ${id}`);
  }
  return `${kind}:${id}`;
}

export function activity(
  kind: LearningPathActivityKind,
  id: string,
  title: string,
  route: string,
  session: LearningPathSessionBounds,
  requirement: LearningPathRequirement = 'required',
): LearningPathActivityRef {
  if (
    session.minItems < 1 ||
    session.minItems > session.targetItems ||
    session.targetItems > session.maxItems
  ) {
    throw new Error(`Invalid session bounds for ${kind}:${id}`);
  }
  const milestoneId = activityMilestoneId(kind, id);
  return {
    kind,
    milestoneId,
    lessonId: milestoneId,
    title,
    route,
    session,
    requirement,
  };
}

export function defineLearningPath(
  manifest: LearningPathManifest,
): LearningPathManifest {
  const unitIds = new Set<string>();
  const lessonIds = new Set<string>();
  const registerMilestone = (milestone: LearningPathMilestoneRef) => {
    const milestoneKey =
      'milestoneId' in milestone
        ? milestone.milestoneId
        : `${milestone.kind}:${milestone.lessonId}`;
    if (lessonIds.has(milestoneKey)) {
      const itemLabel =
        'milestoneId' in milestone ? 'milestone' : 'lesson';
      throw new Error(
        `Learning path ${manifest.language} repeats ${itemLabel} ${milestoneKey}`,
      );
    }
    lessonIds.add(milestoneKey);
  };

  for (const lesson of manifest.letterUnitLessons ?? []) {
    registerMilestone(lesson);
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

    for (const milestone of unitLessons(unit)) registerMilestone(milestone);
  }

  return manifest;
}
