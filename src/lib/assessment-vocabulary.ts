import type { Question } from './test-questions';

export interface AssessmentCaptureWord {
  word: string;
  reading?: string;
  meaning?: string;
}

/** Read existing prompt metadata after results, without changing generation/scoring. */
export function assessmentVocabulary(questions: readonly Question[]): AssessmentCaptureWord[] {
  const words: AssessmentCaptureWord[] = [];
  for (const question of questions) {
    const answer = question.options[question.correctIndex];
    if (!answer) continue;
    const forward = /^What does "(.+)" \((.*)\) mean\?$/u.exec(question.question);
    const reverse = /^Which word means "(.+)"\?$/u.exec(question.question);
    if (question.category === 'vocabulary' && forward) {
      words.push({ word: forward[1], reading: forward[2], meaning: answer });
    } else if (question.category === 'vocabulary' && reverse) {
      words.push({ word: answer, meaning: reverse[1] });
    } else if (question.targetOptionIndices?.includes(question.correctIndex)) {
      // No meaning is inferred for an authored target-language option.
      words.push({ word: answer });
    }
  }
  return [...new Map(words.map((word) => [word.word, word])).values()];
}
