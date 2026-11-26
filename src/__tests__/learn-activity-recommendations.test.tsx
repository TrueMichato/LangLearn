import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { getInputRecommendation, getPathRecommendations } from '../lib/learn-activity-recommendations';
import { guidedActivityRoute, parseGuidedPracticeQuery } from '../lib/guided-practice';
import { activity } from '../data/learning-paths/shared';
import InputActivityLink from '../components/learn/InputActivityLink';
import { getLanguageLabel } from '../lib/languages';
import type { LearningPath } from '../types/learning-path';

const route = guidedActivityRoute({
  ...activity('reading', 'sample-reading', 'Self-introduction', '/reader',
    { minItems: 1, targetItems: 1, maxItems: 1 }),
  scope: { itemIds: ['self-intro'], difficulty: 'easy' },
}, 'ja');
const path: LearningPath = {
  language: 'ja', recommendedNodeId: 'vocab:greetings',
  completedCount: 0, totalCount: 2, completedAheadCount: 0, testOutOptions: [],
  units: [{
    id: 'first', title: 'First steps', description: '', strands: [], checkpoints: [],
    nodes: [
      { id: 'vocab:greetings', kind: 'vocab', lessonId: 'greetings', title: 'Greetings',
        route: '/vocab-lessons?lesson=greetings', state: 'available', unitId: 'first' },
      { id: 'reading:sample-reading', kind: 'reading', lessonId: 'reading:sample-reading', title: 'Read a self-introduction',
        route, state: 'available', unitId: 'first' },
    ],
  }],
};

describe('input alternatives', () => {
  it('preserves an existing accessible unit destination and its real content scope', () => {
    const suggestion = getInputRecommendation('ja', path);
    expect(suggestion).toMatchObject({ to: route, title: 'Read a self-introduction' });
    expect(parseGuidedPracticeQuery(suggestion!.to.split('?')[1], 'reading')).toMatchObject({
      kind: 'guided', descriptor: { language: 'ja', scope: { itemIds: ['self-intro'], difficulty: 'easy' } },
    });
    expect(suggestion?.subtitle).toContain('not a match to your lesson vocabulary');
    expect(getPathRecommendations(path).map((item) => item.to)).toEqual([
      '/vocab-lessons?lesson=greetings', '/sentence-builder', route,
    ]);
  });

  it('does not send learners to locked, foreign-language, or malformed unit routes', () => {
    const reading = path.units[0].nodes[1];
    for (const change of [
      { state: 'locked' as const },
      { route: route.replace('guidedLanguage=ja', 'guidedLanguage=ar') },
      { route: '/reader?guided=reading:missing-parameters' },
      { route: route.replace('/reader?', '/listening?') },
    ]) {
      const changed = { ...path, units: [{ ...path.units[0], nodes: [path.units[0].nodes[0], { ...reading, ...change }] }] };
      expect(getInputRecommendation('ja', changed)).toMatchObject({ to: '/listening' });
    }
    expect(getPathRecommendations(path, 'ar')).toEqual([]);
    expect(getInputRecommendation('ar', path)).toMatchObject({ to: '/listening', title: `Try listening in ${getLanguageLabel('ar')}` });
  });

  it.each(['ja', 'ru', 'pt', 'es', 'ar', 'ro'])('keeps %s fallback honest and routes to supported current-language surfaces', (language) => {
    expect(getInputRecommendation(language)).toMatchObject({
      to: '/listening', subtitle: expect.stringContaining('choose Easy on Listening'),
    });
    expect(getInputRecommendation(language, null, 'listening')).toMatchObject({
      to: '/reader', subtitle: expect.stringContaining('choose an Easy text in Library'),
    });
  });

  it('offers no invented content for an unsupported or unselected language', () => {
    expect(getInputRecommendation('xx')).toBeNull();
    expect(getInputRecommendation(undefined)).toBeNull();
  });

  it('makes completion input a secondary link rather than a new scored activity', () => {
    const html = renderToStaticMarkup(<MemoryRouter><InputActivityLink language="ar" after="listening" /></MemoryRouter>);
    expect(html).toContain('href="/reader"');
    expect(html).toContain(`Read in ${getLanguageLabel('ar')}`);
    expect(html).toContain('or continue your reading');
    expect(html).not.toContain('bg-indigo-600');
    expect(renderToStaticMarkup(<MemoryRouter><InputActivityLink language="xx" /></MemoryRouter>)).toBe('');
  });
});
