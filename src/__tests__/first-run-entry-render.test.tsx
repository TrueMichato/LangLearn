import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { StartingPoint } from '../lib/starting-points';

const controls = vi.hoisted(() => ({
  navigate: vi.fn(),
  complete: vi.fn(),
  settings: {
    activeLanguages: ['ja', 'es'],
    currentLanguage: 'es',
    arabicDialect: 'msa',
    arabicColloquialFocus: false,
    setCurrentLanguage: vi.fn(),
    addLanguage: vi.fn(),
    removeLanguage: vi.fn(),
    completeOnboarding: vi.fn(),
  },
  select: null as null | ((point: StartingPoint) => void),
  lesson: null as null | { lang: string; lessonId: string; onBack: () => void },
}));

vi.mock('../stores/settingsStore', () => ({
  useSettingsStore: <T,>(selector: (state: typeof controls.settings) => T) => selector(controls.settings),
}));
vi.mock('react-router-dom', async (importOriginal) => ({
  ...await importOriginal<typeof import('react-router-dom')>(),
  useNavigate: () => controls.navigate,
}));
vi.mock('../components/onboarding/StartingPoints', () => ({
  default: (props: { language: string; onSelect: (point: StartingPoint) => void }) => {
    controls.select = props.onSelect;
    return <span data-starting-language={props.language} />;
  },
}));
vi.mock('../components/vocab/VocabLessonView', () => ({
  default: (props: NonNullable<typeof controls.lesson>) => {
    controls.lesson = props;
    return <article data-language={props.lang} data-lesson={props.lessonId}>Authored lesson</article>;
  },
}));

import OnboardingOverlay from '../components/onboarding/OnboardingOverlay';
import VocabLessons from '../pages/VocabLessons';
import LetterPractice from '../pages/LetterPractice';
import { getStartingPoints } from '../lib/starting-points';

beforeEach(() => {
  vi.clearAllMocks();
  controls.settings.activeLanguages = ['ja', 'es'];
  controls.settings.currentLanguage = 'es';
  controls.settings.completeOnboarding = controls.complete;
  controls.lesson = null;
  controls.select = null;
});

function vocabulary(route = '/vocab-lessons?lesson=greetings') {
  return renderToStaticMarkup(<MemoryRouter initialEntries={[route]}><VocabLessons /></MemoryRouter>);
}

describe('first-run handoff and current language', () => {
  it('uses the global language for onboarding rather than the first active language', () => {
    const html = renderToStaticMarkup(<MemoryRouter><OnboardingOverlay /></MemoryRouter>);
    expect(html).toContain('data-starting-language="es"');
    expect(html).toContain('Starting language');
    expect(html).not.toContain('about two minutes');
    expect(html).not.toContain('Everything you learn turns into a review card');
    expect(html).toContain('Choose material from lessons to save as review cards');
    expect(html).toContain("lesson doesn&#x27;t automatically save review material");
    expect(html).toContain('Skip');
    const point = getStartingPoints('es')[0];
    controls.select!(point);
    expect(controls.complete).toHaveBeenCalledOnce();
    expect(controls.navigate).toHaveBeenCalledWith(point.route);
  });

  it('opens the actual lesson for the current language without waiting for a catalog', () => {
    const html = vocabulary(getStartingPoints('es')[0].route);
    expect(html).toContain('data-language="es"');
    expect(html).toContain('data-lesson="greetings"');
    expect(html).not.toContain('Vocabulary Lessons');
    expect(controls.settings.currentLanguage).toBe('es');
    controls.lesson!.onBack();
    expect(controls.navigate).toHaveBeenCalledWith('/vocab-lessons', { replace: true });
  });

  it('preserves the independent browser and its Back destination', () => {
    expect(vocabulary('/vocab-lessons?from=browse')).toContain('Vocabulary Lessons');
    expect(controls.lesson).toBeNull();
    vocabulary('/vocab-lessons?lesson=greetings&from=browse');
    controls.lesson!.onBack();
    expect(controls.navigate).toHaveBeenCalledWith('/vocab-lessons?from=browse', { replace: true });
  });

  it('does not silently substitute an available language for an unsupported current language', () => {
    controls.settings.activeLanguages = ['ja', 'klingon'];
    controls.settings.currentLanguage = 'klingon';
    const html = vocabulary();
    expect(html).toContain('available for KLINGON');
    expect(controls.lesson).toBeNull();
    expect(controls.settings.setCurrentLanguage).not.toHaveBeenCalled();
    const letters = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/letters/klingon?mode=learn&group=next']}>
        <Routes><Route path="/letters/:lang" element={<LetterPractice />} /></Routes>
      </MemoryRouter>,
    );
    expect(letters).toContain('available for KLINGON');
    expect(letters).not.toContain('Hiragana');
  });

  it('does not invent a default lesson language before any language is active', () => {
    controls.settings.activeLanguages = [];
    controls.settings.currentLanguage = '';
    expect(vocabulary()).toContain('available for this language');
    expect(controls.lesson).toBeNull();
  });
});
