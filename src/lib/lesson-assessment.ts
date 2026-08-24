/**
 * Pure logic for "testing out" of a run of Grammar or Vocabulary lessons —
 * scoring a short assessment lets a learner skip lessons they already know
 * instead of clicking through content and quizzes they've outgrown.
 *
 * Everything here is DOM-free and framework-free on purpose: the range
 * computation and scoring rules are exactly the part that must never drift
 * between the two lesson browsers (Grammar, Vocabulary) or from the tests
 * that pin the 80% boundary.
 */

import { MAX_TEST_OUT_LESSONS } from './lesson-assessment-limits';

export type AssessmentTrack = 'grammar' | 'vocab';

/** Minimum score (inclusive) a test-out attempt must reach to pass. */
export const PASS_THRESHOLD_PERCENT = 80;

export interface OrderedLessonRef {
  id: string;
}

function supportedRange(lessonIds: string[]): string[] | null {
  return lessonIds.length <= MAX_TEST_OUT_LESSONS ? lessonIds : null;
}

/**
 * The lesson ids a learner can test out of when they ask to test out
 * "through" `uptoLessonId`: the next lesson they haven't completed yet,
 * through `uptoLessonId`, inclusive — all within `lessons`, which must
 * already be the single track (Grammar *or* Vocabulary) the learner picked.
 *
 * The range intentionally starts at the first incomplete lesson rather than
 * at `uptoLessonId` itself, and it can include lessons the learner has never
 * unlocked — passing the assessment grants their prerequisites too, so nodes
 * that were locked because an earlier lesson wasn't done yet become
 * available in the same pass.
 *
 * Returns `null` when there is nothing to test out of:
 * - `uptoLessonId` isn't in `lessons` at all,
 * - every lesson is already completed, or
 * - `uptoLessonId` comes before the first incomplete lesson (it's already
 *   done, so there is no "next lesson through here" to skip).
 *
 * A guided path may supply `requestedLessonIds` when its curriculum order is
 * not contiguous in the global content index (for example, parallel strands).
 * Those IDs are validated against the current lesson catalog and used in path
 * order, so the assessment cannot silently pull in lessons from another unit.
 */
export function computeTestOutRange(
  lessons: readonly OrderedLessonRef[],
  completedIds: ReadonlySet<string>,
  uptoLessonId: string,
  requestedLessonIds: readonly string[] = [],
): string[] | null {
  if (requestedLessonIds.length > 0) {
    const indexById = new Map(
      lessons.map((lesson, index) => [lesson.id, index]),
    );
    const seen = new Set<string>();
    for (const lessonId of requestedLessonIds) {
      const index = indexById.get(lessonId);
      if (index === undefined || seen.has(lessonId)) {
        return null;
      }
      seen.add(lessonId);
    }
    if (requestedLessonIds[requestedLessonIds.length - 1] !== uptoLessonId) {
      return null;
    }
    const fromIndex = requestedLessonIds.findIndex(
      (lessonId) => !completedIds.has(lessonId),
    );
    return fromIndex === -1
      ? null
      : supportedRange(requestedLessonIds.slice(fromIndex));
  }

  const uptoIndex = lessons.findIndex((lesson) => lesson.id === uptoLessonId);
  if (uptoIndex === -1) return null;

  const fromIndex = lessons.findIndex((lesson) => !completedIds.has(lesson.id));
  if (fromIndex === -1) return null;
  if (uptoIndex < fromIndex) return null;

  return supportedRange(
    lessons.slice(fromIndex, uptoIndex + 1).map((lesson) => lesson.id),
  );
}

/** Round a raw correct/total tally to the nearest whole percent. */
export function scorePercent(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

/** Whether a score clears the test-out bar. Exactly 80% passes. */
export function passesAssessment(scorePct: number): boolean {
  return scorePct >= PASS_THRESHOLD_PERCENT;
}
