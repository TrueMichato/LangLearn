/**
 * What the Dashboard is allowed to show, and when.
 *
 * The primary action never waits for a telemetry gate. Early progress stays
 * compact, and earned XP/badges remain reachable after any effort. A larger
 * collection or study block can support more dashboard detail; trends also
 * need more than one active day.
 */
export interface DashboardActivity {
  totalWords: number;
  totalStudySeconds: number;
  /** Letter columns and lessons opened — real work that produces no words. */
  lessonsTouched: number;
  /** XP awarded outside the study timer (quizzes, drills, challenges). */
  bonusXP: number;
  earnedBadges?: number;
  activeDays?: number;
}

/**
 * Any evidence at all that this learner has begun.
 * Opens compact progress and rewards, not the mature dashboard.
 */
export function hasStarted(a: DashboardActivity): boolean {
  return (
    a.totalWords > 0 ||
    a.totalStudySeconds > 0 ||
    a.lessonsTouched > 0 ||
    a.bonusXP > 0 ||
    (a.earnedBadges ?? 0) > 0
  );
}

/**
 * A small collection or one five-minute study block warrants more detail.
 * Saving one word or studying for a few seconds must not unlock a wall of zeros.
 */
export function hasMatureDashboard(a: DashboardActivity): boolean {
  return a.totalWords >= 10 || a.totalStudySeconds >= 300;
}

/** Multi-day instrumentation is separate from access to earned rewards. */
export function hasHistory(a: DashboardActivity): boolean {
  return hasMatureDashboard(a) && (a.activeDays ?? 0) >= 2;
}
