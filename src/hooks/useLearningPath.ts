import { useEffect, useState } from 'react';
import { LEARNING_PATHS } from '../data/learning-paths';
import { loadLearningPath } from '../lib/learning-path';
import type { LearningPath } from '../types/learning-path';

interface LearningPathState {
  language: string | null;
  path: LearningPath | null;
  error: string;
}

export function useLearningPath(language: string | null | undefined) {
  const [state, setState] = useState<LearningPathState>({
    language: null,
    path: null,
    error: '',
  });
  const supported = language != null && LEARNING_PATHS[language] != null;

  useEffect(() => {
    if (!language || !LEARNING_PATHS[language]) return;
    let cancelled = false;

    loadLearningPath(language)
      .then((path) => {
        if (!cancelled) setState({ language, path, error: '' });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          language,
          path: null,
          error:
            error instanceof Error
              ? error.message
              : 'The learning path could not be loaded.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  return {
    supported,
    loading: supported && state.language !== language,
    path: state.language === language ? state.path : null,
    error: state.language === language ? state.error : '',
  };
}
