/**
 * What the Dashboard is allowed to show, and when.
 *
 * The dashboard has two independent layers and they must not share a gate:
 *
 * - The **action layer** (Today's Plan, Suggested Next, Daily Challenge) tells
 *   the learner what to do next.
 * - The **scoreboard layer** (stat cards, weekly goals, milestones, badges,
 *   heat map) tells them how they're doing.
 *
 * Gating both on "do we have words?" produced two opposite failures at once.
 * A learner who finished a letter column — exactly what the on-ramp told them
 * to do — creates no words, so the dashboard greeted them the next day as if
 * they'd never opened the app. And the moment the gate did open, it opened all
 * the way, handing someone with one short session a screen of 0% rings.
 *
 * So: `hasStarted` is generous and drives the action layer. `hasProgress` is
 * strict and drives the scoreboard. Until there is something to measure,
 * measurement is just noise.
 */
export interface DashboardActivity {
  totalWords: number;
  totalStudySeconds: number;
  /** Letter columns and lessons opened — real work that produces no words. */
  lessonsTouched: number;
  /** XP awarded outside the study timer (quizzes, drills, challenges). */
  bonusXP: number;
}

/** Any evidence at all that this learner has begun. Drives the action layer. */
export function hasStarted(a: DashboardActivity): boolean {
  return (
    a.totalWords > 0 ||
    a.totalStudySeconds > 0 ||
    a.lessonsTouched > 0 ||
    a.bonusXP > 0
  );
}

/**
 * Enough history that a chart or a goal ring says something true.
 * Deliberately stricter than {@link hasStarted}.
 */
export function hasProgress(a: DashboardActivity): boolean {
  return a.totalWords > 0 || a.totalStudySeconds >= 60;
}
