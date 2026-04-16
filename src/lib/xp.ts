const XP_PER_5_MINUTES = 10;
const XP_PER_REVIEW = 2;
const XP_PER_WORD_ADDED = 5;
export const XP_PER_CHARACTER_PRACTICE = 5;
export const XP_PER_QUIZ_CORRECT = 3;

export function calculateTimeXP(durationSeconds: number): number {
  const fiveMinBlocks = Math.floor(durationSeconds / 300);
  return fiveMinBlocks * XP_PER_5_MINUTES;
}

export function calculateReviewXP(cardsReviewed: number): number {
  return cardsReviewed * XP_PER_REVIEW;
}

export function calculateWordAddedXP(wordsAdded: number): number {
  return wordsAdded * XP_PER_WORD_ADDED;
}

export function formatStudyTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function calculateLetterXP(practiced: number, quizCorrect: number): number {
  return practiced * XP_PER_CHARACTER_PRACTICE + quizCorrect * XP_PER_QUIZ_CORRECT;
}
