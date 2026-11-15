import { LANGUAGES } from './languages';
import { getAlphabetsForLanguage } from '../data/alphabets';
import { getLearningPathManifest } from '../data/learning-paths';
import { unitLessons } from '../data/learning-paths/shared';
import { isGuidedAlphabetComplete } from './guided-learning-progress';
import { NEXT_GUIDED_GROUP, ROUTES, guidedLettersRoute, vocabLessonRoute } from './routes';

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
  const manifest = getLearningPathManifest(lang);
  const alphabets = getAlphabetsForLanguage(lang);
  const hasLetters = alphabets.length > 0;
  const firstVocab = manifest && [
    ...(manifest.letterUnitLessons ?? []),
    ...manifest.units.flatMap(unitLessons),
  ].find((node) => node.kind === 'vocab');

  // Custom languages added by hand ship no bundled content, so the honest
  // on-ramp is the Reader and the vocabulary list rather than lessons that
  // do not exist.
  if (!firstVocab) {
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
        sublabel: 'Choose which words to save for review',
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
      sublabel: 'A full lesson with words, examples, and practice. Your place is saved.',
      route: vocabLessonRoute(firstVocab.lessonId),
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
    const pathAlphabets = (manifest?.letterPrerequisites ?? [])
      .map((name) => alphabets.find((alphabet) => alphabet.name === name))
      .filter((alphabet) => alphabet !== undefined);
    const alphabet = pathAlphabets.find((item) =>
      !isGuidedAlphabetComplete(
        item.name, lang, [...new Set(item.characters.map((character) => character.group))],
      ),
    ) ?? pathAlphabets[0] ?? alphabets[0];
    points.unshift({
      id: 'letters',
      emoji: '🔤',
      label: 'Learn the letters',
      sublabel: lettersSublabel(lang),
      route: guidedLettersRoute(lang, alphabet.name, NEXT_GUIDED_GROUP),
      recommended: startWithLetters,
    });
  }

  return points.sort(
    (a, b) => Number(b.recommended) - Number(a.recommended),
  );
}
