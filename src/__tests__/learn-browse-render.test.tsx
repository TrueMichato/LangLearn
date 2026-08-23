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

/**
 * Extracts the `<details>...</details>` block for a given section label and
 * the card count rendered in its summary badge. Section labels are followed
 * immediately by a `<span>{cards.length}</span>` badge with no separating
 * whitespace in the rendered markup.
 */
function getSection(html: string, label: string): { block: string; count: number } {
  const summaryMatch = new RegExp(`${label}<span[^>]*>(\\d+)</span>`).exec(html);
  if (!summaryMatch) {
    throw new Error(`Section "${label}" not found in rendered markup`);
  }
  const detailsStart = html.lastIndexOf('<details', summaryMatch.index);
  const detailsEnd = html.indexOf('</details>', summaryMatch.index) + '</details>'.length;
  return {
    block: html.slice(detailsStart, detailsEnd),
    count: Number(summaryMatch[1]),
  };
}

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
    expect(html).toContain('Core practice');
    expect(html).toContain('Focused drills');
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

  it('regroups every route into the four canonical sections, preserving copy and paths', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BrowseActivitiesPage />
      </MemoryRouter>,
    );

    const inputAndStudy = getSection(html, 'Input and study');
    expect(inputAndStudy.block).toContain(`href="${ROUTES.grammar}"`);
    expect(inputAndStudy.block).toContain('Grammar');
    expect(inputAndStudy.block).toContain('Rules and patterns');
    expect(inputAndStudy.block).toContain(`href="${ROUTES.vocabLessons}"`);
    expect(inputAndStudy.block).toContain('Vocabulary');
    expect(inputAndStudy.block).toContain('Themed word sets');
    expect(inputAndStudy.block).toContain('href="/letters/ja"');

    const corePractice = getSection(html, 'Core practice');
    expect(corePractice.count).toBe(3);
    expect(corePractice.block).toContain(`href="${ROUTES.sentenceBuilder}"`);
    expect(corePractice.block).toContain('Sentences');
    expect(corePractice.block).toContain('Build and translate');
    expect(corePractice.block).toContain(`href="${ROUTES.clozePractice}"`);
    expect(corePractice.block).toContain('Cloze Practice');
    expect(corePractice.block).toContain('Fill in the blank');
    expect(corePractice.block).toContain(`href="${ROUTES.conjugations}"`);
    expect(corePractice.block).toContain('Conjugations');
    expect(corePractice.block).toContain('Verbs and noun cases');
    // Practice-adjacent drills moved out of this section.
    expect(corePractice.block).not.toContain('Listening');
    expect(corePractice.block).not.toContain('Minimal Pairs');
    expect(corePractice.block).not.toContain('Translation');

    const focusedDrills = getSection(html, 'Focused drills');
    expect(focusedDrills.block).toContain(`href="${ROUTES.listening}"`);
    expect(focusedDrills.block).toContain('Listening');
    expect(focusedDrills.block).toContain('Audio comprehension');
    expect(focusedDrills.block).toContain(`href="${ROUTES.minimalPairs}"`);
    expect(focusedDrills.block).toContain('Minimal Pairs');
    expect(focusedDrills.block).toContain('Pronunciation ear training');
    expect(focusedDrills.block).toContain(`href="${ROUTES.translation}"`);
    expect(focusedDrills.block).toContain('Translation');
    expect(focusedDrills.block).toContain('Practice writing in your language');

    const extras = getSection(html, 'Extras');
    expect(extras.count).toBe(2);
    expect(extras.block).toContain(`href="${ROUTES.lyrics}"`);
    expect(extras.block).toContain('Music');
    expect(extras.block).toContain('Learn through song lyrics');
    expect(extras.block).toContain(`href="${ROUTES.tests}"`);
    expect(extras.block).toContain('Tests');
    expect(extras.block).toContain('Track your level');

    // No section exceeds the 4-card cap for this language/capability combo.
    for (const label of ['Input and study', 'Core practice', 'Focused drills', 'Extras']) {
      expect(getSection(html, label).count).toBeLessThanOrEqual(4);
    }
    // Japanese has neither dialects nor numeral practice.
    expect(inputAndStudy.count).toBe(3);
    expect(focusedDrills.count).toBe(3);
  });

  it('shows the Arabic Dialects card in Input and study only when Arabic is active, capped at 4', () => {
    mockCurrentLanguage.language = 'ar';
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BrowseActivitiesPage />
      </MemoryRouter>,
    );

    const inputAndStudy = getSection(html, 'Input and study');
    expect(inputAndStudy.block).toContain(`href="${ROUTES.dialects}"`);
    expect(inputAndStudy.block).toContain('Dialects');
    expect(inputAndStudy.block).toContain('Compare spoken Arabic');
    expect(inputAndStudy.block).toContain('href="/letters/ar"');
    expect(inputAndStudy.count).toBe(4);
    expect(inputAndStudy.count).toBeLessThanOrEqual(4);
  });

  it('shows the Numbers card in Focused drills only when the language has numeral practice, capped at 4', () => {
    mockCurrentLanguage.language = 'ar';
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BrowseActivitiesPage />
      </MemoryRouter>,
    );

    const focusedDrills = getSection(html, 'Focused drills');
    expect(focusedDrills.block).toContain(`href="${ROUTES.numberPractice}"`);
    expect(focusedDrills.block).toContain('Numbers');
    expect(focusedDrills.block).toContain('Read and spell numerals');
    expect(focusedDrills.count).toBe(4);
    expect(focusedDrills.count).toBeLessThanOrEqual(4);

    mockCurrentLanguage.language = 'ja';
    const jaHtml = renderToStaticMarkup(
      <MemoryRouter>
        <BrowseActivitiesPage />
      </MemoryRouter>,
    );
    expect(getSection(jaHtml, 'Focused drills').block).not.toContain(ROUTES.numberPractice);
  });

  it('derives no more than two recommendations from the current path step', () => {
    const path: LearningPath = {
      language: 'ja',
      completedCount: 0,
      totalCount: 2,
      completedAheadCount: 0,
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
