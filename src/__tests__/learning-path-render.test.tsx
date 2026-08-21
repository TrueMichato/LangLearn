import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import LearningPath from '../components/learn/LearningPath';
import type { LearningPath as LearningPathModel } from '../types/learning-path';

const PATH: LearningPathModel = {
  language: 'ja',
  completedCount: 1,
  totalCount: 3,
  units: [
    {
      id: 'first-steps',
      title: 'First steps',
      description: 'A gentle beginning.',
      nodes: [
        {
          id: 'letters:Hiragana',
          kind: 'letters',
          lessonId: 'letters/Hiragana',
          title: 'Hiragana',
          route: '/letters/ja?mode=learn&alphabet=Hiragana',
          state: 'completed',
          unitId: 'first-steps',
        },
        {
          id: 'vocab:greetings',
          kind: 'vocab',
          lessonId: 'vocab/greetings',
          title: 'Greetings & Introductions',
          route: '/vocab-lessons?lesson=greetings',
          state: 'available',
          unitId: 'first-steps',
        },
        {
          id: 'grammar:particles',
          kind: 'grammar',
          lessonId: 'particles',
          title: 'Basic Particles',
          route: '/grammar?lesson=particles',
          state: 'locked',
          unitId: 'first-steps',
        },
      ],
    },
  ],
};

describe('LearningPath', () => {
  it('exposes completed, current, and locked steps semantically', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LearningPath path={PATH} />
      </MemoryRouter>,
    );

    expect(html).toContain('aria-current="step"');
    expect(html).toContain('Basic Particles, locked');
    expect(html).toContain('disabled');
    expect(html).toContain('1/3');
  });

  it('keeps navigation routes on the real lesson links', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LearningPath path={PATH} />
      </MemoryRouter>,
    );

    expect(html).toContain('/vocab-lessons?lesson=greetings');
    expect(html).toContain('/letters/ja?mode=learn&amp;alphabet=Hiragana');
  });
});
