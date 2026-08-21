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
      checkpoints: [
        {
          kind: 'vocab',
          lessonId: 'greetings',
          route: '/vocab-lessons?testOut=greetings',
          state: 'available',
        },
        {
          kind: 'grammar',
          lessonId: 'particles',
          route: '/grammar?testOut=particles',
          state: 'available',
        },
      ],
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
    expect(html).toContain('/vocab-lessons?testOut=greetings');
    expect(html).toContain('/grammar?testOut=particles');
    expect(html).toContain('Test out of grammar through First steps');
  });

  it('mirrors the winding treatment for an RTL learning path', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LearningPath path={{ ...PATH, language: 'ar' }} />
      </MemoryRouter>,
    );

    expect(html).toContain('flex-row-reverse');
    expect(html).toContain('←');
  });
});
