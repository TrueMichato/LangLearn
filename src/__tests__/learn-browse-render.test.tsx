import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPathRecommendations } from '../lib/learn-activity-recommendations';
import BrowseActivitiesPage from '../pages/BrowseActivities';
import LearnPage from '../pages/Learn';
import ListeningPage from '../pages/Listening';
import { ROUTES } from '../lib/routes';
import type { LearningPath } from '../types/learning-path';

const mockActiveLanguages = ['ja', 'ar'] as const;
const mockCurrentLanguage = {
  language: 'ja',
  setLanguage: vi.fn(),
  options: ['ja', 'ar'],
  isSupported: true,
  requested: 'ja',
};

vi.mock('../stores/settingsStore', () => ({
  useSettingsStore: (selector: (state: { activeLanguages: readonly string[] }) => unknown) =>
    selector({ activeLanguages: mockActiveLanguages }),
}));

vi.mock('../hooks/useCurrentLanguage', () => ({
  useCurrentLanguage: () => mockCurrentLanguage,
}));

function getSection(html: string, label: string): { block: string; count: number } {
  const id = `activity-section-${label.toLowerCase().replaceAll(' ', '-')}`;
  const sectionStart = html.indexOf(
    `<section aria-labelledby="${id}"`,
  );
  if (sectionStart === -1) {
    throw new Error(`Section "${label}" not found in rendered markup`);
  }
  const sectionEnd = html.indexOf('</section>', sectionStart) + '</section>'.length;
  const block = html.slice(sectionStart, sectionEnd);
  return {
    block,
    count: (block.match(/<a /g) ?? []).length,
  };
}

describe('Learn and Browse activities pages', () => {
  beforeEach(() => {
    mockCurrentLanguage.language = 'ja';
    mockCurrentLanguage.setLanguage.mockReset();
  });

  it('makes the guided path and free-choice mode equally findable', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LearnPage />
      </MemoryRouter>,
    );

    expect(html).toContain('Learn');
    expect(html).toContain('choose any lesson and practice activity');
    expect(html).toContain('aria-label="Learning path language"');
    expect(html).toContain('aria-label="Learn sections"');
    expect(html).toContain('Guided path');
    expect(html).toContain(`href="${ROUTES.browseActivities}"`);
    expect(html).toContain('Lessons &amp; practice');
    expect(html).not.toContain('Recommended Resources');
    expect(html).not.toContain('Cloze Practice');
  });

  it('opens guided dictation links in dictation mode', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/listening?mode=dictation']}>
        <ListeningPage />
      </MemoryRouter>,
    );

    expect(html).toContain('Start Dictation Practice');
  });

  it('keeps lesson libraries and all practice routes visible', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BrowseActivitiesPage />
      </MemoryRouter>,
    );

    expect(html).toContain(`href="${ROUTES.learn}"`);
    expect(html).toContain('Guided path');
    expect(html).toContain('Lesson libraries');
    expect(html).toContain('Practice activities');
    expect(html).toContain('More ways to learn');
    expect(html).toContain('Grammar lessons');
    expect(html).toContain('All grammar lessons in course order');
    expect(html).toContain('Vocabulary lessons');
    expect(html).toContain('All vocabulary lessons in course order');
    expect(html).toContain('Cloze Practice');
    expect(html).toContain('Listening');
    expect(html).toContain('Sentences');
    expect(html).not.toContain('Dialects');
    expect(html).toContain('Recommended Resources');
    expect(html).toContain('Outside resources');
    expect(html).toContain('href="/letters/ja"');
    expect(html).toContain('href="/grammar?from=browse"');
    expect(html).toContain('href="/vocab-lessons?from=browse"');
    expect(html).not.toContain('href="/letters/ar"');
    expect(html).not.toContain('leading-tight');
    expect(html).toContain('leading-5');
    expect(html).toContain('leading-[1.4]');
    expect(html).not.toContain('sm:grid-cols-2');
    expect(html).toContain('aria-label="Activity language"');
  });

  it('groups every route into visible lesson, practice, and extension sections', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BrowseActivitiesPage />
      </MemoryRouter>,
    );

    const libraries = getSection(html, 'Lesson libraries');
    expect(libraries.count).toBe(3);
    expect(libraries.block).toContain('href="/grammar?from=browse"');
    expect(libraries.block).toContain('Grammar lessons');
    expect(libraries.block).toContain('href="/vocab-lessons?from=browse"');
    expect(libraries.block).toContain('Vocabulary lessons');
    expect(libraries.block).toContain('href="/letters/ja"');

    const practice = getSection(html, 'Practice activities');
    for (const route of [
      ROUTES.sentenceBuilder,
      ROUTES.clozePractice,
      ROUTES.conjugations,
      ROUTES.listening,
      ROUTES.minimalPairs,
      ROUTES.translation,
    ]) {
      expect(practice.block).toContain(`href="${route}"`);
    }

    const more = getSection(html, 'More ways to learn');
    expect(more.count).toBe(2);
    expect(more.block).toContain(`href="${ROUTES.lyrics}"`);
    expect(more.block).toContain(`href="${ROUTES.tests}"`);
  });

  it('shows Arabic-specific lesson choices only when Arabic is active', () => {
    mockCurrentLanguage.language = 'ar';
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BrowseActivitiesPage />
      </MemoryRouter>,
    );

    const libraries = getSection(html, 'Lesson libraries');
    expect(libraries.block).toContain(`href="${ROUTES.dialects}"`);
    expect(libraries.block).toContain('Dialects');
    expect(libraries.block).toContain('Compare spoken Arabic');
    expect(libraries.block).toContain('href="/letters/ar"');
    expect(libraries.count).toBe(4);
  });

  it('shows Numbers in practice only when the language has numeral practice', () => {
    mockCurrentLanguage.language = 'ar';
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BrowseActivitiesPage />
      </MemoryRouter>,
    );

    const practice = getSection(html, 'Practice activities');
    expect(practice.block).toContain(`href="${ROUTES.numberPractice}"`);
    expect(practice.block).toContain('Numbers');
    expect(practice.block).toContain('Read and spell numerals');

    mockCurrentLanguage.language = 'ja';
    const jaHtml = renderToStaticMarkup(
      <MemoryRouter>
        <BrowseActivitiesPage />
      </MemoryRouter>,
    );
    expect(getSection(jaHtml, 'Practice activities').block).not.toContain(
      ROUTES.numberPractice,
    );
  });

  it('derives no more than two recommendations from the current path step', () => {
    const path: LearningPath = {
      language: 'ja',
      completedCount: 0,
      totalCount: 2,
      completedAheadCount: 0,
      recommendedNodeId: 'vocab:greetings',
      testOutOptions: [],
      units: [
        {
          id: 'first',
          title: 'First steps',
          description: 'Start here.',
          checkpoints: [],
          strands: [],
          nodes: [
            {
              id: 'vocab:greetings',
              kind: 'vocab',
              lessonId: 'greetings',
              title: 'Greetings',
              route: '/vocab-lessons?lesson=greetings',
              state: 'available',
              unitId: 'first',
            },
            {
              id: 'grammar:particles',
              kind: 'grammar',
              lessonId: 'particles',
              title: 'Particles',
              route: '/grammar?lesson=particles',
              state: 'locked',
              unitId: 'first',
            },
          ],
        },
      ],
    };

    expect(getPathRecommendations(path)).toEqual([
      expect.objectContaining({
        to: '/vocab-lessons?lesson=greetings',
        title: 'Greetings',
      }),
      expect.objectContaining({
        to: ROUTES.sentenceBuilder,
        title: 'Use the words',
      }),
    ]);
  });

  it('uses the explicit recommendation when a sibling branch is also available', () => {
    const path: LearningPath = {
      language: 'ru',
      completedCount: 0,
      totalCount: 2,
      completedAheadCount: 0,
      recommendedNodeId: 'grammar:stress',
      testOutOptions: [],
      units: [
        {
          id: 'foundations',
          title: 'Build your foundations',
          description: 'Grow two foundations.',
          checkpoints: [],
          strands: [],
          nodes: [
            {
              id: 'vocab:family',
              kind: 'vocab',
              lessonId: 'vocab/family',
              title: 'Family Members',
              route: '/vocab-lessons?lesson=family',
              state: 'available',
              unitId: 'foundations',
            },
            {
              id: 'grammar:stress',
              kind: 'grammar',
              lessonId: 'stress',
              title: 'Stress in Russian',
              route: '/grammar?lesson=stress',
              state: 'available',
              unitId: 'foundations',
            },
          ],
        },
      ],
    };

    expect(getPathRecommendations(path)[0]).toMatchObject({
      to: '/grammar?lesson=stress',
      title: 'Stress in Russian',
    });
  });
});
