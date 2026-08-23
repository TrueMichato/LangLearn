import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import CurriculumOutline from '../components/learn/CurriculumOutline';
import type { LearningPath } from '../types/learning-path';

const PATH: LearningPath = {
  language: 'ja',
  completedCount: 1,
  totalCount: 3,
  testOutOptions: [],
  units: [
    {
      id: 'first',
      title: 'First steps',
      description: 'A gentle beginning.',
      checkpoints: [],
      nodes: [
        {
          id: 'vocab:greetings',
          kind: 'vocab',
          lessonId: 'greetings',
          title: 'Greetings',
          route: '/vocab-lessons?lesson=greetings',
          state: 'completed',
          unitId: 'first',
        },
        {
          id: 'grammar:particles',
          kind: 'grammar',
          lessonId: 'particles',
          title: 'Basic Particles',
          route: '/grammar?lesson=particles',
          state: 'available',
          unitId: 'first',
        },
      ],
    },
    {
      id: 'later',
      title: 'Everyday life',
      description: 'Useful routines.',
      checkpoints: [],
      nodes: [
        {
          id: 'vocab:routines',
          kind: 'vocab',
          lessonId: 'routines',
          title: 'Daily Routines',
          route: '/vocab-lessons?lesson=routines',
          state: 'locked',
          unitId: 'later',
        },
      ],
    },
  ],
};

describe('CurriculumOutline', () => {
  it('opens the current unit and keeps future units as compact summaries', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <CurriculumOutline path={PATH} />
      </MemoryRouter>,
    );

    expect(html).toContain('Course outline');
    expect(html).toContain('Current unit · 1 of 2 steps');
    expect(html).toContain('<details open=""');
    expect(html).toContain('Everyday life');
    expect(html).toContain('Complete the earlier units');
  });

  it('links completed and current lessons but not locked lessons', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <CurriculumOutline path={PATH} />
      </MemoryRouter>,
    );

    expect(html).toContain('href="/vocab-lessons?lesson=greetings"');
    expect(html).toContain('href="/grammar?lesson=particles"');
    expect(html).toContain('aria-current="step"');
    expect(html).toContain('Daily Routines, locked');
    expect(html).not.toContain('href="/vocab-lessons?lesson=routines"');
  });

  it('mirrors curriculum rows for an RTL learning path', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <CurriculumOutline path={{ ...PATH, language: 'ar' }} />
      </MemoryRouter>,
    );

    expect(html).toContain('flex-row-reverse');
    expect(html).toContain('←');
  });
});
