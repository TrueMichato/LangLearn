import type { LearningPathManifest } from '../../types/learning-path';
import { AR_LEARNING_PATH } from './ar';
import { ES_LEARNING_PATH } from './es';
import { JA_LEARNING_PATH } from './ja';
import { PT_LEARNING_PATH } from './pt';
import { RO_LEARNING_PATH } from './ro';
import { RU_LEARNING_PATH } from './ru';

export const LEARNING_PATHS: Record<string, LearningPathManifest> = {
  ar: AR_LEARNING_PATH,
  es: ES_LEARNING_PATH,
  ja: JA_LEARNING_PATH,
  pt: PT_LEARNING_PATH,
  ro: RO_LEARNING_PATH,
  ru: RU_LEARNING_PATH,
};

export function getLearningPathManifest(
  language: string,
): LearningPathManifest | null {
  return LEARNING_PATHS[language] ?? null;
}
