import type { LearningPathUnitPresentation } from '../types/learning-path';

export function shouldCompactContinuationUnit(
  showFullPath: boolean,
  presentation: LearningPathUnitPresentation | undefined,
  isLandmark: boolean,
): boolean {
  return showFullPath && presentation === 'continuation' && !isLandmark;
}
