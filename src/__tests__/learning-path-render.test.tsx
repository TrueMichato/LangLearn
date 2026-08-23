import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import LearningPath from '../components/learn/LearningPath';
import type { LearningPath as LearningPathModel } from '../types/learning-path';

const PATH: LearningPathModel = {
  language: 'ja',
  completedCount: 1,
  totalCount: 4,
  completedAheadCount: 0,
  recommendedNodeId: 'vocab:greetings',
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
      strands: [],
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
      strands: [],
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

const SOUND_NODES: LearningPathModel['units'][number]['nodes'] = [
  {
    id: 'vocab:days-months',
    kind: 'vocab',
    lessonId: 'vocab/days-months',
    title: 'Days & Months',
    route: '/vocab-lessons?lesson=days-months',
    state: 'available',
    unitId: 'foundations',
    strandId: 'sound-rhythm',
  },
  {
    id: 'grammar:stress',
    kind: 'grammar',
    lessonId: 'stress',
    title: 'Stress in Russian',
    route: '/grammar?lesson=stress',
    state: 'locked',
    unitId: 'foundations',
    strandId: 'sound-rhythm',
  },
];

const PEOPLE_NODES: LearningPathModel['units'][number]['nodes'] = [
  {
    id: 'vocab:family',
    kind: 'vocab',
    lessonId: 'vocab/family',
    title: 'Family Members',
    route: '/vocab-lessons?lesson=family',
    state: 'available',
    unitId: 'foundations',
    strandId: 'people-things',
  },
  {
    id: 'grammar:spelling-rules',
    kind: 'grammar',
    lessonId: 'spelling-rules',
    title: 'Russian Spelling Rules',
    route: '/grammar?lesson=spelling-rules',
    state: 'locked',
    unitId: 'foundations',
    strandId: 'people-things',
  },
];

const BRANCH_PATH: LearningPathModel = {
  language: 'ru',
  completedCount: 1,
  totalCount: 6,
  completedAheadCount: 0,
  recommendedNodeId: 'vocab:days-months',
  testOutOptions: [],
  units: [
    {
      id: 'first-steps',
      title: 'First steps',
      description: 'A completed beginning.',
      checkpoints: [],
      strands: [],
      nodes: [
        {
          id: 'vocab:greetings',
          kind: 'vocab',
          lessonId: 'vocab/greetings',
          title: 'Greetings & Introductions',
          route: '/vocab-lessons?lesson=greetings',
          state: 'completed',
          unitId: 'first-steps',
        },
      ],
    },
    {
      id: 'foundations',
      title: 'Build your foundations',
      description: 'Grow two useful foundations.',
      checkpoints: [],
      nodes: [...SOUND_NODES, ...PEOPLE_NODES],
      strands: [
        {
          id: 'sound-rhythm',
          title: 'Sound and rhythm',
          description: 'Practice stress and rhythm.',
          nodes: SOUND_NODES,
        },
        {
          id: 'people-things',
          title: 'People and things',
          description: 'Name people and notice spelling.',
          nodes: PEOPLE_NODES,
        },
      ],
    },
    {
      id: 'food-cases',
      title: 'Food and cases',
      description: 'Continue after both strands.',
      checkpoints: [],
      strands: [],
      nodes: [
        {
          id: 'vocab:food',
          kind: 'vocab',
          lessonId: 'vocab/food',
          title: 'Food & Drink',
          route: '/vocab-lessons?lesson=food',
          state: 'locked',
          unitId: 'food-cases',
        },
      ],
    },
  ],
};

describe('LearningPath parallel unit', () => {
  it('keeps one recommendation while making the sibling strand actionable', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LearningPath path={BRANCH_PATH} />
      </MemoryRouter>,
    );

    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toContain('Days &amp; Months');
    expect(html).toContain('Up next');
    expect(html).toContain('Family Members');
    expect(html).toContain('Also available');
    expect(html).toContain('href="/vocab-lessons?lesson=family"');
    expect(html).toContain('Two strands, both part of this unit');
    expect(html).toContain('Complete both strands to unlock the next unit.');
    expect(html).toContain('1 earlier unit');
    expect(html).not.toContain('Greetings &amp; Introductions');
  });
});

const LETTERS_CURRENT_PATH: LearningPathModel = {
  language: 'ja',
  completedCount: 2,
  totalCount: 5,
  completedAheadCount: 0,
  recommendedNodeId: 'letters:Katakana',
  testOutOptions: [],
  units: [
    {
      id: 'letters',
      title: 'Learn the script',
      description: 'Get comfortable with the writing system before lessons begin.',
      checkpoints: [],
      strands: [],
      nodes: [
        {
          id: 'letters:Hiragana',
          kind: 'letters',
          lessonId: 'letters/Hiragana',
          title: 'Hiragana',
          route: '/letters/ja?mode=learn&alphabet=Hiragana',
          state: 'completed',
          unitId: 'letters',
        },
        {
          id: 'letters:Katakana',
          kind: 'letters',
          lessonId: 'letters/Katakana',
          title: 'Katakana',
          route: '/letters/ja?mode=learn&alphabet=Katakana',
          state: 'available',
          unitId: 'letters',
        },
      ],
    },
    {
      id: 'first-steps',
      title: 'First steps',
      description: 'A gentle beginning.',
      checkpoints: [],
      strands: [],
      nodes: [
        {
          id: 'vocab:greetings',
          kind: 'vocab',
          lessonId: 'vocab/greetings',
          title: 'Greetings & Introductions',
          route: '/vocab-lessons?lesson=greetings',
          state: 'completed',
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
        {
          id: 'vocab:numbers',
          kind: 'vocab',
          lessonId: 'vocab/numbers',
          title: 'Numbers 1-100',
          route: '/vocab-lessons?lesson=numbers',
          state: 'locked',
          unitId: 'first-steps',
        },
      ],
    },
  ],
};

describe('LearningPath completed-ahead acknowledgment', () => {
  it('renders nothing when nothing is completed ahead of the current step', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LearningPath path={LETTERS_CURRENT_PATH} />
      </MemoryRouter>,
    );

    expect(html).not.toContain('finished');
    expect(html).not.toContain('View in curriculum');
  });

  it('renders a singular acknowledgment while letters are current and one future vocab lesson is already done', () => {
    const path: LearningPathModel = {
      ...LETTERS_CURRENT_PATH,
      completedAheadCount: 1,
    };
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LearningPath path={path} />
      </MemoryRouter>,
    );

    expect(html).toContain("You&#x27;ve already finished 1 lesson ahead of this step.");
    expect(html).not.toContain('1 lessons ahead');
    expect(html).toContain('View full curriculum');
    const [href] = html.match(/href="[^"]*"/g)?.filter((link) =>
      link.includes('/learn/curriculum'),
    ) ?? [];
    expect(href).toBeDefined();
    // Ahead completions never move the current step or unlock anything: the
    // learner is still on Katakana, and the not-yet-guided unit isn't
    // rendered as if it were unlocked.
    expect(html).toContain('aria-current="step"');
    expect(html).toContain('Katakana');
    expect(html).not.toContain('Basic Particles');
    expect(html).not.toContain('Numbers 1-100');
  });

  it('renders a plural acknowledgment when more than one lesson is completed ahead', () => {
    const path: LearningPathModel = {
      ...LETTERS_CURRENT_PATH,
      completedAheadCount: 2,
    };
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LearningPath path={path} />
      </MemoryRouter>,
    );

    expect(html).toContain(
      "You&#x27;ve already finished 2 lessons ahead of this step.",
    );
  });

  it('mirrors the curriculum arrow for an RTL path with ahead progress', () => {
    const path: LearningPathModel = {
      ...LETTERS_CURRENT_PATH,
      language: 'ar',
      completedAheadCount: 1,
    };
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LearningPath path={path} />
      </MemoryRouter>,
    );

    expect(html).toContain('View full curriculum');
    expect(html).toContain('←');
    expect(html).not.toContain('→');
  });

  it('does not render the acknowledgment once the whole path is complete', () => {
    const path: LearningPathModel = {
      ...LETTERS_CURRENT_PATH,
      completedCount: LETTERS_CURRENT_PATH.totalCount,
      completedAheadCount: 3,
    };
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LearningPath path={path} />
      </MemoryRouter>,
    );

    expect(html).not.toContain('finished');
    expect(html).not.toContain('View in curriculum');
  });
});
