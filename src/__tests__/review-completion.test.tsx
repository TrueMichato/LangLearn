import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReviewSummaryContent } from '../components/srs/ReviewSummary';
import { loadReviewCompletionCounts, reviewCompletionMessage, type ReviewCompletionState } from '../lib/review-completion';
import type { ReviewAttempt } from '../lib/review-session';
import { db } from '../db/schema';
import { addWord, getWordWithReview } from '../db/words';
import { useStudySetsStore } from '../stores/studySetsStore';

const library: ReviewAttempt = { kind: 'scheduled', source: { type: 'library', language: 'es' }, label: 'Spanish' };

beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()));
  useStudySetsStore.setState({ sets: [] });
});

async function seed(word: string, language = 'es', due = false) {
  const id = await addWord({ word, language, reading: '', meaning: word, contextSentence: '', sourceTextId: null, tags: ['focused-topic'], type: 'grammar' });
  const card = (await getWordWithReview(id))!;
  await db.reviews.update(card.review.id!, { nextReviewDate: due ? '2000-01-01T00:00:00.000Z' : '2099-01-01T00:00:00.000Z' });
  return card;
}

describe('completion counts', () => {
  it('uses actual scoped due and practice membership without changing schedules', async () => {
    await seed('uno', 'es', true);
    await seed('dos');
    await seed('три', 'ru', true);
    const before = await db.reviews.toArray();
    expect(await loadReviewCompletionCounts(library.source)).toEqual({ status: 'ready', remaining: 1, available: 2 });
    expect(await db.reviews.toArray()).toEqual(before);
  });

  it('preserves set and language boundaries instead of substituting cards', async () => {
    const due = await seed('uno', 'es', true);
    const future = await seed('dos');
    const russian = await seed('три', 'ru', true);
    await seed('outside-set', 'es', true);
    useStudySetsStore.setState({ sets: [{
      id: 'my-set', name: 'My set', description: '', type: 'custom', selectionMode: 'manual',
      wordIds: [due.word.id!, future.word.id!, russian.word.id!, 999], tags: [], createdAt: '2026-01-01',
    }] });
    expect(await loadReviewCompletionCounts({ type: 'set', setId: 'my-set', language: 'es' }))
      .toEqual({ status: 'ready', remaining: 1, available: 2 });
    await expect(loadReviewCompletionCounts({ type: 'set', setId: 'missing' })).rejects.toThrow();
  });

  it.each(['topic', 'mistakes'] as const)('does not call future-inclusive %s membership “due” or “remaining”', async (type) => {
    const card = await seed('regla');
    await db.reviewLog.add({
      wordId: card.word.id!, reviewId: card.review.id!, language: 'es', grade: 0,
      isLapse: true, date: new Date().toISOString(),
    });
    const attempt: ReviewAttempt = {
      ...library, source: type === 'topic' ? { type, topicId: 'focused-topic', language: 'es' } : { type, language: 'es' },
    };
    const counts = await loadReviewCompletionCounts(attempt.source);
    expect(counts).toEqual({ status: 'ready', remaining: 1, available: 1 });
    const message = reviewCompletionMessage(attempt, counts);
    expect(message).toContain('1 card is available in this focused deck');
    expect(message).not.toContain('remains');
    expect(message).not.toContain('due card');
  });
});

describe('completion stopping point', () => {
  const render = (attempt: ReviewAttempt, counts: ReviewCompletionState, empty = false) => renderToStaticMarkup(
    <ReviewSummaryContent attempt={attempt} cardsReviewed={7} counts={counts} empty={empty}
      onStart={() => {}} onExit={() => {}} onRetry={() => {}} />,
  );
  it('makes stopping primary and more practice secondary, with honest answer counts', () => {
    const html = render(library, { status: 'ready', remaining: 0, available: 2 });
    expect(html).toContain('7 answers given');
    expect(html).not.toContain('7 cards');
    const buttons = html.match(/<button[^>]*>[^<]*<\/button>/g)!;
    expect(buttons[0]).toContain('bg-indigo-600');
    expect(buttons[0]).toContain('Done for now');
    expect(buttons.slice(1).every((button) => !button.includes('bg-indigo-600'))).toBe(true);
    expect(html).toContain('No more reviews are due in this scope right now.');
    expect(html).not.toMatch(/tomorrow|next review|All due reviews done/i);
  });

  it('keeps practice schedule-neutral and does not present due counts as unfinished practice', () => {
    const html = render({ ...library, kind: 'practice' }, { status: 'ready', remaining: 3, available: 4 });
    expect(html).toContain('Practice complete');
    expect(html).toContain('Your review dates are unchanged.');
    expect(html).toContain('4 cards are available for optional practice');
    expect(html).not.toContain('Review remaining');
  });

  it('keeps Done available during count loading or failure without claiming everything is done', () => {
    for (const counts of [{ status: 'loading' }, { status: 'error', message: 'Cannot read this set' }] as const) {
      const html = render(library, counts);
      expect(html).toContain('Done for now');
      expect(html).not.toContain('No more reviews are due');
      expect(html).not.toContain('Practise this source anytime');
    }
    expect(render(library, { status: 'error', message: 'Cannot read this set' })).toContain('Retry loading');
  });

  it('does not congratulate an empty session for answers that were never given', () => {
    const html = render(library, { status: 'ready', remaining: 0, available: 0 }, true);
    expect(html).toContain('No reviews available in this source');
    expect(html).not.toContain('answers given');
    expect(html).toContain('Done for now');
  });
});
