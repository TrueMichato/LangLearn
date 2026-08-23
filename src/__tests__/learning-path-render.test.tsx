import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import LearningPath from '../components/learn/LearningPath';
import type { LearningPath as LearningPathModel } from '../types/learning-path';

const PATH: LearningPathModel = {
  language: 'ja',
  completedCount: 1,
  totalCount: 4,
  testOutOptions: [
    {
      kind: 'vocab',
      lessonId: 'greetings',
      route: '/vocab-lessons?testOut=greetings',
      state: 'available',
      unitId: 'first-steps',
      unitTitle: 'First steps',
      lessonCount: 1,
      lessonIds: ['greetings'],
      firstLessonTitle: 'Greetings & Introductions',
      lastLessonTitle: 'Greetings & Introductions',
    },
    {
      kind: 'grammar',
      lessonId: 'particles',
      route: '/grammar?testOut=particles',
      state: 'available',
      unitId: 'first-steps',
      unitTitle: 'First steps',
      lessonCount: 1,
      lessonIds: ['particles'],
      firstLessonTitle: 'Basic Particles',
      lastLessonTitle: 'Basic Particles',
    },
  ],
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
          unitId: 'first-steps',
          unitTitle: 'First steps',
          lessonCount: 1,
          lessonIds: ['greetings'],
          firstLessonTitle: 'Greetings & Introductions',
          lastLessonTitle: 'Greetings & Introductions',
        },
        {
          kind: 'grammar',
          lessonId: 'particles',
          route: '/grammar?testOut=particles',
          state: 'available',
          unitId: 'first-steps',
          unitTitle: 'First steps',
          lessonCount: 1,
          lessonIds: ['particles'],
          firstLessonTitle: 'Basic Particles',
          lastLessonTitle: 'Basic Particles',
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
    {
      id: 'later',
      title: 'Later',
      description: 'Future work.',
      checkpoints: [],
      nodes: [
        {
          id: 'grammar:future',
          kind: 'grammar',
          lessonId: 'future',
          title: 'Future Grammar',
          route: '/grammar?lesson=future',
          state: 'locked',
          unitId: 'later',
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
    expect(html).toContain('First steps · 1 of 3 steps complete');
    expect(html).toContain('Up next');
    expect(html).toContain('Coming next');
    expect(html).toContain('Later');
    expect(html).toContain('View full curriculum');
    expect(html).not.toContain('Future Grammar');
    expect(html).toContain(
      'Complete Greetings &amp; Introductions to unlock the next lesson.',
    );
  });

  it('keeps navigation routes on the real lesson links', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LearningPath path={PATH} />
      </MemoryRouter>,
    );

    expect(html).toContain('/vocab-lessons?lesson=greetings');
    expect(html).toContain('/letters/ja?mode=learn&amp;alphabet=Hiragana');
    expect(html).toContain('Check what you already know');
    expect(html.match(/Check what you already know/g)).toHaveLength(1);
    expect(html).not.toContain('/vocab-lessons?testOut=greetings');
    expect(html).not.toContain('/grammar?testOut=particles');
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
