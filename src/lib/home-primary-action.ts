import { loadLearningPath } from './learning-path';
import { getLanguageLabel } from './languages';
import { ROUTES } from './routes';
import { getStartingPoints } from './starting-points';
import { loadLatestVocabAttemptSummary, type VocabAttemptSummary } from './vocab-lesson-attempt';
import type { LearningPath } from '../types/learning-path';

export type HomeLearningState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; attempt: VocabAttemptSummary | null; path: LearningPath | null };

export interface HomePrimaryAction {
  kind: 'due' | 'resume' | 'path' | 'loading' | 'error' | 'complete' | 'unavailable' | 'setup';
  title: string;
  description: string;
  route?: string;
  label?: string;
}

export async function loadHomeLearningState(language: string): Promise<HomeLearningState> {
  const attempt = await loadLatestVocabAttemptSummary(language);
  return {
    status: 'ready',
    attempt,
    path: attempt ? null : await loadLearningPath(language),
  };
}

export function resolveHomePrimaryAction({
  dueCards, language, learning,
}: {
  dueCards: number;
  language: string | undefined;
  learning: HomeLearningState;
}): HomePrimaryAction {
  if (dueCards > 0) {
    return {
      kind: 'due',
      title: `${dueCards} card${dueCards === 1 ? '' : 's'} ready for review`,
      description: 'Due cards across your saved languages. Choose your usual language or deck on Review.',
      route: ROUTES.review,
      label: 'Open due reviews',
    };
  }
  if (!language) {
    return {
      kind: 'setup', title: 'Choose a language to begin',
      description: "Pick what you're learning and we'll suggest where to start.",
      route: ROUTES.settings, label: 'Choose a language',
    };
  }
  if (learning.status === 'error') {
    return {
      kind: 'error', title: "We couldn't check your next step",
      description: 'Your saved place or learning path could not be read. Retry before starting something new.',
    };
  }
  if (learning.status === 'loading' ||
    (learning.attempt && learning.attempt.language !== language) ||
    (learning.path && learning.path.language !== language)) {
    return { kind: 'loading', title: 'Finding your place…', description: 'Checking your saved lesson and next learning step.' };
  }
  const label = getLanguageLabel(language);
  if (learning.attempt) {
    const attempt = learning.attempt;
    const finishing = attempt.stage === 'Finishing lesson';
    return {
      kind: 'resume',
      title: `${finishing ? 'Finish' : 'Continue'} ${attempt.title}`,
      description: finishing
        ? `${label} · Your lesson is waiting for its completion to be confirmed.`
        : `${label} · ${attempt.stage} · ${attempt.position} of ${attempt.itemCount}`,
      route: attempt.route,
      label: finishing ? 'Finish lesson' : 'Resume lesson',
    };
  }
  if (!learning.path) {
    const point = getStartingPoints(language).find((item) => item.recommended);
    return {
      kind: 'unavailable', title: `No guided lessons for ${label} yet`,
      description: 'You can still read your own text and choose words to save for review.',
      route: point?.route, label: point?.label,
    };
  }
  const path = learning.path;
  const next = path.units.flatMap((unit) => unit.nodes)
    .find((node) => node.id === path.recommendedNodeId && node.state === 'available');
  if (next) {
    return {
      kind: 'path', title: `Next: ${next.title}`, description: `${label} · Your next guided learning step`,
      route: next.route, label: 'Start this step',
    };
  }
  if (path.recommendedNodeId || path.completedCount < path.totalCount) {
    return { kind: 'error', title: "We couldn't check your next step", description: 'Your learning path could not be resolved. Please retry.' };
  }
  return {
    kind: 'complete', title: 'Your guided path is complete',
    description: `${label} · Your progress is saved. Revisit a lesson or choose optional practice whenever you like.`,
    route: ROUTES.learn, label: 'Explore learning',
  };
}
