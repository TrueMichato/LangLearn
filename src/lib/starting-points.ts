import { LANGUAGES } from './languages';
import { getAlphabetsForLanguage } from '../data/alphabets';
import { ROUTES, guidedLettersRoute } from './routes';

export interface StartingPoint {
  id: 'letters' | 'words' | 'reading' | 'import';
  emoji: string;
  label: string;
  sublabel: string;
  route: string;
  /** Exactly one starting point per language carries this. */
  recommended: boolean;
}

/**
 * Scripts a learner cannot read on sight. For these, letters come first —
 * every other activity is opaque until the alphabet is familiar. Latin-accent
 * languages are readable from day one, so words come first instead.
 */
const UNFAMILIAR_SCRIPTS = new Set([
  'hiragana-katakana',
  'cyrillic',
  'arabic',
  'hanzi',
  'hangul',
]);

function lettersSublabel(lang: string): string {
  const system = LANGUAGES[lang]?.hasLetterSystem;
  return system && UNFAMILIAR_SCRIPTS.has(system)
    ? 'Get comfortable with the script first'
    : 'Accents and spelling marks';
}

/**
 * The three ways into a language on day one, ordered so the recommended one
 * comes first. Used by the last onboarding step and by the Dashboard first-run
 * card, so both give an identical on-ramp.
 */
export function getStartingPoints(lang: string): StartingPoint[] {
  const isKnown = Boolean(LANGUAGES[lang]);
  const hasLetters = getAlphabetsForLanguage(lang).length > 0;

  // Custom languages added by hand ship no bundled content, so the honest
  // on-ramp is the Reader and the vocabulary list rather than lessons that
  // do not exist.
  if (!isKnown) {
    return [
      {
        id: 'import',
        emoji: '📖',
        label: 'Bring in a text',
        sublabel: 'Paste anything and tap words to save them',
        route: ROUTES.reader,
        recommended: true,
      },
      {
        id: 'words',
        emoji: '✏️',
        label: 'Add words yourself',
        sublabel: 'Build a list you can review from tomorrow',
        route: ROUTES.words,
        recommended: false,
      },
    ];
  }

  const startWithLetters =
    hasLetters && UNFAMILIAR_SCRIPTS.has(LANGUAGES[lang].hasLetterSystem ?? '');

  const points: StartingPoint[] = [
    {
      id: 'words',
      emoji: '✨',
      label: 'Learn your first words',
      sublabel: 'A short themed lesson, about two minutes',
      route: ROUTES.vocabLessons,
      recommended: !startWithLetters,
    },
    {
      id: 'reading',
      emoji: '📖',
      label: 'Read something short',
      sublabel: 'Curated texts, easiest first',
      route: ROUTES.reader,
      recommended: false,
    },
  ];

  if (hasLetters) {
    points.unshift({
      id: 'letters',
      emoji: '🔤',
      label: 'Learn the letters',
      sublabel: lettersSublabel(lang),
      route: guidedLettersRoute(lang),
      recommended: startWithLetters,
    });
  }

  return points.sort(
    (a, b) => Number(b.recommended) - Number(a.recommended),
  );
}
