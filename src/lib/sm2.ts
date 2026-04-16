export type SM2Grade = 0 | 1 | 2 | 3 | 4 | 5;

export interface SM2State {
  ease: number;
  interval: number;
  repetitions: number;
}

/**
 * SuperMemo-2 algorithm.
 *
 * Grade scale:
 *   0 = complete blackout
 *   1 = wrong, but recognized after seeing answer
 *   2 = wrong, but answer felt easy to recall once seen
 *   3 = correct, but with serious difficulty
 *   4 = correct, with some hesitation
 *   5 = perfect recall
 *
 * Grades 0-2 reset the card; grades 3-5 advance the interval.
 */
export function sm2(prev: SM2State, grade: SM2Grade): SM2State {
  let { ease, interval, repetitions } = prev;

  // Clamp ease factor to minimum 1.3
  const newEase = Math.max(
    1.3,
    ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  );

  if (grade < 3) {
    // Failed — reset repetitions, show again soon
    return { ease: newEase, interval: 0, repetitions: 0 };
  }

  // Passed
  repetitions += 1;

  if (repetitions === 1) {
    interval = 1;
  } else if (repetitions === 2) {
    interval = 6;
  } else {
    interval = Math.round(interval * newEase);
  }

  return { ease: newEase, interval, repetitions };
}
