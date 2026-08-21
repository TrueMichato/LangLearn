import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AddAllWordsButton from '../components/vocab/AddAllWordsButton';

describe('AddAllWordsButton', () => {
  it('invites the action when idle', () => {
    const html = renderToStaticMarkup(
      <AddAllWordsButton status="idle" result={null} onClick={() => {}} />,
    );
    expect(html).toContain('Add all to Words');
    // Tailwind's `disabled:` variant prefix would otherwise false-positive a
    // plain substring check, so assert on the actual boolean HTML attribute.
    expect(html).not.toContain('disabled=""');
  });

  it('disables itself and reports progress while saving', () => {
    const html = renderToStaticMarkup(
      <AddAllWordsButton status="saving" result={null} onClick={() => {}} />,
    );
    expect(html).toContain('Adding words');
    expect(html).toContain('disabled=""');
  });

  it('gives encouraging, honest feedback for a partial overlap', () => {
    // The kind-learning rule: a mix of new and already-known words is framed
    // as progress on both counts, never as "3 failed to save".
    const html = renderToStaticMarkup(
      <AddAllWordsButton status="done" result={{ added: 3, alreadySaved: 2 }} onClick={() => {}} />,
    );
    expect(html).toContain('3 new, 2 already saved');
  });

  it('celebrates a clean save when nothing already existed', () => {
    const html = renderToStaticMarkup(
      <AddAllWordsButton status="done" result={{ added: 5, alreadySaved: 0 }} onClick={() => {}} />,
    );
    expect(html).toContain('5 words added');
  });

  it('still reassures the learner when every word was already saved', () => {
    const html = renderToStaticMarkup(
      <AddAllWordsButton status="done" result={{ added: 0, alreadySaved: 4 }} onClick={() => {}} />,
    );
    expect(html).toContain('Already in your vocabulary');
  });

  it('is a secondary/outline control per DESIGN.md, not a second loud primary', () => {
    const html = renderToStaticMarkup(
      <AddAllWordsButton status="idle" result={null} onClick={() => {}} />,
    );
    expect(html).toContain('border-slate-300');
    expect(html).toContain('dark:border-slate-600');
    // Never the primary indigo fill — that stays reserved for the one loud
    // action per screen (Save to flashcards / Start Exercises).
    expect(html).not.toContain('bg-indigo-600');
  });

  it('meets the minimum touch target and ships dark-mode twins', () => {
    const html = renderToStaticMarkup(
      <AddAllWordsButton status="idle" result={null} onClick={() => {}} />,
    );
    expect(html).toContain('min-h-[44px]');
    expect(html).toContain('dark:text-slate-200');
  });

  it('carries dark twins for the done state too', () => {
    const html = renderToStaticMarkup(
      <AddAllWordsButton status="done" result={{ added: 1, alreadySaved: 0 }} onClick={() => {}} />,
    );
    expect(html).toContain('dark:bg-green-900/20');
    expect(html).toContain('dark:text-green-300');
  });

  it('has an accessible label for its icon-first copy', () => {
    const html = renderToStaticMarkup(
      <AddAllWordsButton status="idle" result={null} onClick={() => {}} />,
    );
    expect(html).toContain('aria-label="Add all lesson words to your vocabulary"');
  });
});
