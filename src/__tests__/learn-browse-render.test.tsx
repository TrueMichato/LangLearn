import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BrowseActivitiesPage from '../pages/BrowseActivities';
import LearnPage from '../pages/Learn';
import { ROUTES } from '../lib/routes';

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

  it('renders the grouped browse catalog, resources entrypoint, and relaxed card rhythm', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BrowseActivitiesPage />
      </MemoryRouter>,
    );

    expect(html).toContain(`href="${ROUTES.learn}"`);
    expect(html).toContain('Back to Learn');
    expect(html).toContain('📥 Input &amp; Study');
    expect(html).toContain('📤 Practice &amp; Output');
    expect(html).toContain('🎶 Extras');
    expect(html).toContain('Grammar');
    expect(html).toContain('Dialects');
    expect(html).toContain('Recommended Resources');
    expect(html).toContain('href="/letters/ja"');
    expect(html).not.toContain('leading-tight');
    expect(html).toContain('leading-5');
    expect(html).toContain('leading-[1.4]');
    expect(html).toContain('grid-cols-1');
    expect(html).toContain('sm:grid-cols-2');
  });
});
