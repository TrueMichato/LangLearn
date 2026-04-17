export interface TestLevel {
  level: string;
  jlpt: string;
  cefr: string;
  label: string;
}

export function getTestLevel(scorePercent: number): TestLevel {
  if (scorePercent >= 80) return { level: 'advanced', jlpt: 'N2', cefr: 'B2', label: 'Advanced' };
  if (scorePercent >= 60) return { level: 'intermediate', jlpt: 'N3', cefr: 'B1', label: 'Intermediate' };
  if (scorePercent >= 40) return { level: 'elementary', jlpt: 'N4', cefr: 'A2', label: 'Elementary' };
  return { level: 'beginner', jlpt: 'N5', cefr: 'A1', label: 'Beginner' };
}

export function calculateXP(correctAnswers: number): number {
  return 30 + correctAnswers * 3;
}
