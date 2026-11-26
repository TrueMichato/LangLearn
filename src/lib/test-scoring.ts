import type { Question } from './test-questions';

// The existing string field preserves backup compatibility without rewriting
// historic derived labels. This marker is not a learner level.
export const PRACTICE_RESULT_MARKER = 'practice-check-v1';

export function summarizePracticeResult(
  questions: readonly Question[],
  answers: readonly (number | null)[],
) {
  const categories: {
    category: Question['category'];
    sampled: number;
    attempted: number;
    correct: number;
  }[] = [];
  for (const category of ['vocabulary', 'grammar'] as const) {
    let sampled = 0;
    let attempted = 0;
    let correct = 0;
    questions.forEach((question, index) => {
      if (question.category !== category) return;
      sampled++;
      const answer = answers[index];
      if (answer == null || !Number.isInteger(answer) || answer < 0 || answer >= question.options.length) return;
      attempted++;
      if (answer === question.correctIndex) correct++;
    });
    if (sampled > 0) categories.push({ category, sampled, attempted, correct });
  }
  const correctAnswers = categories.reduce((sum, category) => sum + category.correct, 0);
  const attemptedQuestions = categories.reduce((sum, category) => sum + category.attempted, 0);
  const totalQuestions = questions.length;
  return {
    totalQuestions,
    attemptedQuestions,
    correctAnswers,
    unansweredQuestions: totalQuestions - attemptedQuestions,
    // Keep the sampled-set denominator for stored scores and existing badges.
    score: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
    categories,
  };
}

export function calculateXP(correctAnswers: number): number {
  return 30 + correctAnswers * 3;
}
