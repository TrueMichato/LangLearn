import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPathRecommendations } from '../lib/learn-activity-recommendations';
import BrowseActivitiesPage from '../pages/BrowseActivities';
import LearnPage from '../pages/Learn';
import { ROUTES } from '../lib/routes';
import type { LearningPath } from '../types/learning-path';

const mockActiveLanguages = ['ja', 'ar'] as const;
const mockCurrentLanguage = {
  language: 'ja',
  setLanguage: vi.fn(),
};

vi.mock('../stores/settingsStore', () => ({
  useSettingsStore: (selector: (state: { activeLanguages: readonly string[] }) => unknown) =>
    selector({ activeLanguages: mockActiveLanguages }),
}));

vi.mock('../hooks/useCurrentLanguage', () => ({
  useCurrentLanguage: () => mockCurrentLanguage,
}));

describe('Learn and Browse activities pages', () => {
  beforeEach(() => {
    mockCurrentLanguage.language = 'ja';
    mockCurrentLanguage.setLanguage.mockReset();
  });

  it('keeps Learn focused on the path and a quiet browse link', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LearnPage />
      </MemoryRouter>,
    );

    expect(html).toContain('Learn');
    expect(html).toContain('Follow a calm route through the essentials');
    expect(html).toContain('aria-label="Learning path language"');
    expect(html).toContain(`href="${ROUTES.browseActivities}"`);
    expect(html).toContain('Browse activities');
    expect(html).not.toContain('Browse all activities');
    expect(html).not.toContain('Recommended Resources');
    expect(html).not.toContain('Cloze Practice');
    expect(html).not.toContain('📥 Input &amp; Study');
  });

  it('keeps the complete catalog and resources behind intentional disclosures', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BrowseActivitiesPage />
      </MemoryRouter>,
    );

    expect(html).toContain(`href="${ROUTES.learn}"`);
    expect(html).toContain('Back to Learn');
    expect(html).toContain('All activities');
    expect(html).toContain('Input and study');
    expect(html).toContain('Practice');
    expect(html).toContain('Extras');
    expect(html).toContain('<details');
    expect(html).toContain('Grammar');
    expect(html).not.toContain('Dialects');
    expect(html).toContain('Recommended Resources');
    expect(html).toContain('Outside resources');
    expect(html).toContain('href="/letters/ja"');
    expect(html).not.toContain('href="/letters/ar"');
    expect(html).not.toContain('leading-tight');
    expect(html).toContain('leading-5');
    expect(html).toContain('leading-[1.4]');
    expect(html).not.toContain('sm:grid-cols-2');
    expect(html).toContain('aria-label="Activity language"');
  });

  it('derives no more than two recommendations from the current path step', () => {
    const path: LearningPath = {
      language: 'ja',
      completedCount: 0,
      totalCount: 2,
      testOutOptions: [],
      units: [
        {
          id: 'first',
          title: 'First steps',
          description: 'Start here.',
          checkpoints: [],
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
});
