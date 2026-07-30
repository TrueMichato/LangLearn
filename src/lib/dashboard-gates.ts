/**
 * What the Dashboard is allowed to show, and when.
 *
 * The dashboard has three layers and they must not share a gate:
 *
 * - The **action layer** (Today's Plan, Suggested Next, Daily Challenge) tells
 *   the learner what to do next.
 * - The **scoreboard layer** (stat cards, XP total, streak, achievements) tells
 *   them what they have earned.
 * - The **trend layer** (weekly goal rings, review forecast, heat map) tells
 *   them how they are doing *over time*.
 *
 * Only the trend layer needs a strict gate. A chart of one day is noise, and a
 * 0% goal ring on day one reads as failure — which this app does not do.
 *
 * The scoreboard is different, and getting that wrong cost us a real bug: XP
 * and badges accrue from letters, lessons, quizzes and drills, none of which
 * create a word or necessarily run the study timer. Gating the scoreboard on
 * words-or-a-minute meant a learner could earn 400 XP, watch an "Achievement
 * Unlocked!" toast fire, and then find no screen anywhere in the app that would
 * show it to them. If we are willing to congratulate someone for it, we are
 * obliged to let them go look at it.
 */
export interface DashboardActivity {
  totalWords: number;
  totalStudySeconds: number;
  /** Letter columns and lessons opened — real work that produces no words. */
  lessonsTouched: number;
  /** XP awarded outside the study timer (quizzes, drills, challenges). */
  bonusXP: number;
}

/**
 * Any evidence at all that this learner has begun.
 * Drives the action layer *and* the scoreboard.
 */
export function hasStarted(a: DashboardActivity): boolean {
  return (
    a.totalWords > 0 ||
    a.totalStudySeconds > 0 ||
    a.lessonsTouched > 0 ||
    a.bonusXP > 0
  );
}

/**
 * Enough history that a chart, a forecast or a goal ring says something true.
 * Deliberately stricter than {@link hasStarted} — and deliberately *not* used
 * for anything the learner has earned.
 */
export function hasHistory(a: DashboardActivity): boolean {
  return a.totalWords > 0 || a.totalStudySeconds >= 60;
}
