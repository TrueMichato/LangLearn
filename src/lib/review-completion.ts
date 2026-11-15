import { getReviewCandidates, type ReviewAttempt } from './review-session';

export type ReviewCompletionState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; remaining: number; available: number };

export async function loadReviewCompletionCounts(source: ReviewAttempt['source']): Promise<ReviewCompletionState> {
  const [remaining, available] = await Promise.all([
    getReviewCandidates('scheduled', source),
    getReviewCandidates('practice', source),
  ]);
  return { status: 'ready', remaining: remaining.length, available: available.length };
}

export function reviewCompletionMessage(attempt: ReviewAttempt, counts: ReviewCompletionState): string | null {
  if (counts.status !== 'ready') return null;
  const curated = attempt.source.type === 'mistakes' || attempt.source.type === 'topic';
  if (attempt.kind === 'practice') {
    return `${counts.available} ${counts.available === 1 ? 'card is' : 'cards are'} available for optional practice in this source.`;
  }
  if (curated) {
    return `${counts.remaining} ${counts.remaining === 1 ? 'card is' : 'cards are'} available in this focused deck. Focused reviews can include cards that aren't due.`;
  }
  return counts.remaining
    ? `${counts.remaining} due ${counts.remaining === 1 ? 'card remains' : 'cards remain'} in this scope.`
    : 'No more reviews are due in this scope right now.';
}
