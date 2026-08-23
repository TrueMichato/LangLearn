import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import ExternalResources from '../components/common/ExternalResources';
import { getAlphabetsForLanguage } from '../data/alphabets';
import { hasNumbers } from '../data/numbers';
import { getLanguageFlag } from '../lib/languages';
import { ROUTES, lettersRoute } from '../lib/routes';
import { useSettingsStore } from '../stores/settingsStore';

interface ActivityCard {
  to: string;
  emoji: string;
  title: string;
  subtitle: string;
  disabled?: boolean;
  colSpan2?: boolean;
}

interface CardSection {
  label: string;
  showBorder: boolean;
  cards: ActivityCard[];
}

const cardBase =
  'flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 rounded-2xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 press-feedback';

function getBrowseSections(activeLanguages: readonly string[]): CardSection[] {
  const languagesWithLetters = activeLanguages.filter((language) => getAlphabetsForLanguage(language).length > 0);
  const hasArabic = activeLanguages.includes('ar');
  const hasNumberPractice = activeLanguages.some((language) => hasNumbers(language));

  const letterCards: ActivityCard[] =
    languagesWithLetters.length > 0
      ? languagesWithLetters.map((language) => {
          const alphabets = getAlphabetsForLanguage(language);
          return {
            to: lettersRoute(language),
            emoji: '🔤',
            title: `${getLanguageFlag(language)} Letters`,
            subtitle: alphabets.map((alphabet) => alphabet.name).join(', '),
          };
        })
      : [
          {
            to: '#',
            emoji: '🔤',
            title: 'Letter Practice',
            subtitle: 'Add a language with a letter system',
            disabled: true,
          },
        ];

  return [
    {
      label: '📥 Input & Study',
      showBorder: false,
      cards: [
        { to: ROUTES.grammar, emoji: '📖', title: 'Grammar', subtitle: 'Rules & patterns' },
        { to: ROUTES.vocabLessons, emoji: '📝', title: 'Vocabulary', subtitle: 'Themed word sets' },
        ...letterCards,
        ...(hasArabic
          ? [{ to: ROUTES.dialects, emoji: '🗣️', title: 'Dialects', subtitle: 'Compare spoken Arabic' }]
          : []),
        { to: ROUTES.listening, emoji: '🎧', title: 'Listening', subtitle: 'Audio comprehension' },
      ],
    },
    {
      label: '📤 Practice & Output',
      showBorder: false,
      cards: [
        { to: ROUTES.sentenceBuilder, emoji: '✏️', title: 'Sentences', subtitle: 'Build & translate' },
        { to: ROUTES.clozePractice, emoji: '🧩', title: 'Cloze Practice', subtitle: 'Fill in the blank' },
        { to: ROUTES.conjugations, emoji: '🔄', title: 'Conjugations', subtitle: 'Verbs & noun cases' },
        { to: ROUTES.minimalPairs, emoji: '👂', title: 'Minimal Pairs', subtitle: 'Pronunciation ear training' },
        ...(hasNumberPractice
          ? [{ to: ROUTES.numberPractice, emoji: '🔢', title: 'Numbers', subtitle: 'Read & spell numerals' }]
          : []),
        {
          to: ROUTES.translation,
          emoji: '✍️',
          title: 'Translation',
          subtitle: 'Translate sentences to practice output',
        },
      ],
    },
    {
      label: '🎶 Extras',
      showBorder: true,
      cards: [
        { to: ROUTES.lyrics, emoji: '🎵', title: 'Music', subtitle: 'Learn through song lyrics' },
        { to: ROUTES.tests, emoji: '📊', title: 'Tests', subtitle: 'Track your level' },
      ],
    },
  ];
}

function SectionLabel({ label, showBorder }: { label: string; showBorder: boolean }) {
  return (
    <div
      className={`mb-2 mt-4 text-sm font-semibold text-slate-500 sm:col-span-2 dark:text-slate-400 ${
        showBorder ? 'border-t border-slate-200 dark:border-slate-700 pt-4' : ''
      }`}
    >
      {label}
    </div>
  );
}

function CardBody({ card }: { card: ActivityCard }) {
  return (
    <>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
        <span className="text-3xl leading-none">{card.emoji}</span>
      </div>
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-800 dark:text-slate-100">
          {card.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-[1.4] text-slate-500 dark:text-slate-400">
          {card.subtitle}
        </p>
      </div>
    </>
  );
}

function ActivityCardLink({ card }: { card: ActivityCard }) {
  if (card.disabled) {
    return (
      <div
        aria-disabled="true"
        className={`flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm opacity-50 dark:border-white/10 dark:bg-slate-800 ${card.colSpan2 ? 'col-span-2' : ''}`}
      >
        <CardBody card={card} />
      </div>
    );
  }

  return (
    <Link to={card.to} className={`${cardBase} ${card.colSpan2 ? 'col-span-2' : ''}`}>
      <CardBody card={card} />
    </Link>
  );
}

export default function BrowseActivitiesPage() {
  const activeLanguages = useSettingsStore((state) => state.activeLanguages);
  const sections = getBrowseSections(activeLanguages);

  return (
    <div>
      <Link
        to={ROUTES.learn}
        className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
      >
        <span aria-hidden="true">←</span>
        Back to Learn
      </Link>

      <h2 className="mb-2 mt-3 text-lg font-semibold text-slate-700 dark:text-slate-200">
        Browse activities
      </h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Pick any study mode directly, then open recommended resources when you want outside support.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <Fragment key={section.label}>
            <SectionLabel label={section.label} showBorder={section.showBorder} />
            {section.cards.map((card) => (
              <ActivityCardLink key={card.to + card.title} card={card} />
            ))}
          </Fragment>
        ))}
      </div>

      <ExternalResources />
    </div>
  );
}
