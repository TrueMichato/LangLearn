import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import CurriculumOutline from '../components/learn/CurriculumOutline';
import type { LearningPath } from '../types/learning-path';

const PATH: LearningPath = {
  language: 'ja',
  completedCount: 1,
  totalCount: 4,
  completedAheadCount: 0,
  recommendedNodeId: 'grammar:particles',
  testOutOptions: [],
  units: [
    {
      id: 'first',
      title: 'First steps',
      description: 'A gentle beginning.',
      checkpoints: [],
      strands: [],
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
        {
          id: 'grammar:verb-forms',
          kind: 'grammar',
          lessonId: 'verb-forms',
          title: 'Verb Forms',
          route: '/grammar?lesson=verb-forms',
          state: 'locked',
          unitId: 'first',
        },
      ],
    },
    {
      id: 'later',
      title: 'Everyday life',
      description: 'Useful routines.',
      checkpoints: [],
      strands: [],
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
  it('mounts only the current unit rows and keeps future units as summaries', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <CurriculumOutline path={PATH} />
      </MemoryRouter>,
    );

    expect(html).toContain('Course outline');
    expect(html).toContain('Current unit · 1 of 3 required steps');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-expanded="false"');
    expect(html.match(/aria-controls=/g)).toHaveLength(1);
    expect(html).toContain('Everyday life');
    expect(html).not.toContain('Daily Routines');
    expect(html).not.toContain('Complete the earlier units');
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
    expect(html).toContain('Verb Forms. Grammar. Locked.');
    expect(html).not.toContain('href="/grammar?lesson=verb-forms"');
    expect(html).not.toContain('Daily Routines');
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

  it('groups a parallel unit by strand while keeping one current step', () => {
    const soundNode = {
      id: 'grammar:stress',
      kind: 'grammar' as const,
      lessonId: 'stress',
      title: 'Stress in Russian',
      route: '/grammar?lesson=stress',
      state: 'available' as const,
      unitId: 'foundations',
      strandId: 'sound-rhythm',
    };
    const peopleNode = {
      id: 'vocab:family',
      kind: 'vocab' as const,
      lessonId: 'vocab/family',
      title: 'Family Members',
      route: '/vocab-lessons?lesson=family',
      state: 'available' as const,
      unitId: 'foundations',
      strandId: 'people-things',
    };
    const path: LearningPath = {
      language: 'ru',
      completedCount: 0,
      totalCount: 2,
      completedAheadCount: 0,
      recommendedNodeId: soundNode.id,
      testOutOptions: [],
      units: [
        {
          id: 'foundations',
          title: 'Build your foundations',
          description: 'Grow two foundations.',
          checkpoints: [],
          nodes: [soundNode, peopleNode],
          strands: [
            {
              id: 'sound-rhythm',
              title: 'Sound and rhythm',
              description: 'Practice stress.',
              nodes: [soundNode],
            },
            {
              id: 'people-things',
              title: 'People and things',
              description: 'Name people.',
              nodes: [peopleNode],
            },
          ],
        },
      ],
    };
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <CurriculumOutline path={path} />
      </MemoryRouter>,
    );

    expect(html).toContain('Sound and rhythm');
    expect(html).toContain('People and things');
    expect(html).toContain('Also available');
    expect(html).toContain('These strands are both required');
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
  });

  it('keeps a large generated curriculum to one mounted lesson list', () => {
    const units = Array.from({ length: 120 }, (_, index) => {
      const state = index === 0 ? ('available' as const) : ('locked' as const);
      return {
        id: `stage-${index}`,
        title: `Stage ${index + 1}`,
        description: `Stage ${index + 1} description`,
        checkpoints: [],
        strands: [],
        nodes: [
          {
            id: `grammar:lesson-${index}`,
            kind: 'grammar' as const,
            lessonId: `lesson-${index}`,
            title: `Lesson ${index + 1}`,
            route: `/grammar?lesson=lesson-${index}`,
            state,
            unitId: `stage-${index}`,
          },
        ],
      };
    });
    const path: LearningPath = {
      language: 'es',
      completedCount: 0,
      totalCount: units.length,
      completedAheadCount: 0,
      recommendedNodeId: 'grammar:lesson-0',
      testOutOptions: [],
      units,
    };

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <CurriculumOutline path={path} />
      </MemoryRouter>,
    );

    expect(html.match(/aria-expanded="true"/g)).toHaveLength(1);
    expect(html.match(/href="\/grammar/g)).toHaveLength(1);
    expect(html).toContain('Lesson 1');
    expect(html).not.toContain('Lesson 120');
    expect(html).toContain('Stage 120');
  });
});
