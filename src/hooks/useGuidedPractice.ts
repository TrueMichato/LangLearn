import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  completeGuidedActivityMilestone,
  guidedActivityProgressId,
  recordGuidedActivityAttempt,
} from '../db/guided-activities';
import { db } from '../db/schema';
import {
  parseGuidedPracticeQuery,
  validateGuidedCompletion,
  type GuidedPracticeDescriptor,
} from '../lib/guided-practice';
import type { LearningPathActivityKind } from '../types/learning-path';

interface GuidedCompletion {
  itemsCompleted: number;
  score?: number;
}

export function useGuidedPractice(
  activity: LearningPathActivityKind,
  currentLanguage: string,
) {
  const location = useLocation();
  const query = useMemo(
    () => parseGuidedPracticeQuery(location.search, activity),
    [activity, location.search],
  );
  const descriptor =
    query.kind === 'guided' ? query.descriptor : null;
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [completedNow, setCompletedNow] = useState(false);
  const [isCompletionPending, setIsCompletionPending] = useState(false);
  const [completionError, setCompletionError] = useState('');
  const completionInFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setCompletedNow(false);
    setIsCompletionPending(false);
    setCompletionError('');
    completionInFlight.current = false;
    if (!descriptor) {
      setAlreadyCompleted(false);
      return;
    }
    db.guidedActivityProgress
      .get(
        guidedActivityProgressId(
          descriptor.language,
          descriptor.milestoneId,
        ),
      )
      .then((progress) => {
        if (!cancelled) setAlreadyCompleted(progress?.completedAt != null);
      });
    return () => {
      cancelled = true;
    };
  }, [descriptor]);

  const complete = useCallback(
    async ({ itemsCompleted, score }: GuidedCompletion) => {
      if (
        !descriptor ||
        alreadyCompleted ||
        completedNow ||
        completionInFlight.current
      ) {
        return;
      }
      const validationError = validateGuidedCompletion(
        descriptor,
        itemsCompleted,
        score,
      );
      if (validationError) {
        setCompletionError(validationError);
        return;
      }
      completionInFlight.current = true;
      setIsCompletionPending(true);
      setCompletionError('');
      try {
        await recordGuidedActivityAttempt({
          language: descriptor.language,
          milestoneId: descriptor.milestoneId,
          activity: descriptor.activity,
          itemsCompleted,
          score,
        });
        await completeGuidedActivityMilestone({
          language: descriptor.language,
          milestoneId: descriptor.milestoneId,
          activity: descriptor.activity,
          itemsCompleted,
          score,
        });
        setCompletedNow(true);
      } catch {
        setCompletionError(
          'Your path progress could not be saved. Check your connection and finish the session again.',
        );
      } finally {
        completionInFlight.current = false;
        setIsCompletionPending(false);
      }
    },
    [alreadyCompleted, completedNow, descriptor],
  );

  const languageMismatch =
    descriptor != null && descriptor.language !== currentLanguage;
  const invalidMessage =
    query.kind === 'invalid'
      ? query.message
      : languageMismatch
        ? 'This guided step belongs to a different language. Return to your learning path and open it again.'
        : '';

  return {
    descriptor: languageMismatch ? null : descriptor,
    isGuided: descriptor != null && !languageMismatch,
    invalidMessage,
    alreadyCompleted,
    completedNow,
    completionPending: isCompletionPending,
    completionError,
    complete,
  };
}

export type GuidedPracticeState = ReturnType<typeof useGuidedPractice>;
export type { GuidedPracticeDescriptor };
