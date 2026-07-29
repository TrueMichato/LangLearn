import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import { getAlphabetsForLanguage } from '../data/alphabets';
import { hasNumbers } from '../data/numbers';
import { getLanguageFlag } from '../lib/languages';
import { getStartingPoints } from '../lib/starting-points';
import ExternalResources from '../components/common/ExternalResources';

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

function SectionLabel({ label, showBorder }: { label: string; showBorder: boolean }) {
  return (
    <div
      className={`col-span-2 text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 mt-4 ${
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
      <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-700">
        <span className="text-3xl leading-none">{card.emoji}</span>
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-tight line-clamp-2">
          {card.title}
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-tight line-clamp-2 mt-0.5">
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
        className={`flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 rounded-2xl shadow-sm opacity-50 ${card.colSpan2 ? 'col-span-2' : ''}`}
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

export default function LearnPage() {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const { language: currentLanguage } = useCurrentLanguage();
  const languagesWithLetters = activeLanguages.filter((l) => getAlphabetsForLanguage(l).length > 0);
  const hasArabic = activeLanguages.includes('ar');
  const hasNumberPractice = activeLanguages.some((l) => hasNumbers(l));
  const [showMore, setShowMore] = useState(false);

  // The same recommendation onboarding and the dashboard give, so the app never
  // points a learner in three different directions at once.
  const firstLanguage = currentLanguage ?? activeLanguages[0];
  const recommended = firstLanguage ? getStartingPoints(firstLanguage)[0] : null;

  const letterCards: ActivityCard[] =
    languagesWithLetters.length > 0
      ? languagesWithLetters.map((lang) => {
          const alphabets = getAlphabetsForLanguage(lang);
          return {
            to: `/letters/${lang}`,
            emoji: '🔤',
            title: `${getLanguageFlag(lang)} Letters`,
            subtitle: alphabets.map((a) => a.name).join(', '),
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

  const coreSection: CardSection = {
    label: '📥 Input & Study',
    showBorder: false,
    cards: [
      { to: '/grammar', emoji: '📖', title: 'Grammar', subtitle: 'Rules & patterns' },
      { to: '/vocab-lessons', emoji: '📝', title: 'Vocabulary', subtitle: 'Themed word sets' },
      ...letterCards,
      ...(hasArabic
        ? [{ to: '/dialects', emoji: '🗣️', title: 'Dialects', subtitle: 'Compare spoken Arabic' }]
        : []),
      { to: '/listening', emoji: '🎧', title: 'Listening', subtitle: 'Audio comprehension' },
    ],
  };

  // Everything below the fold on day one: real activities, but ones that only
  // make sense once there is vocabulary to practise with.
  const moreSections: CardSection[] = [
    {
      label: '📤 Practice & Output',
      showBorder: false,
      cards: [
        { to: '/sentence-builder', emoji: '✏️', title: 'Sentences', subtitle: 'Build & translate' },
        { to: '/cloze-practice', emoji: '🧩', title: 'Cloze Practice', subtitle: 'Fill in the blank' },
        { to: '/conjugations', emoji: '🔄', title: 'Conjugations', subtitle: 'Verbs & noun cases' },
        { to: '/minimal-pairs', emoji: '👂', title: 'Minimal Pairs', subtitle: 'Pronunciation ear training' },
        ...(hasNumberPractice
          ? [{ to: '/number-practice', emoji: '🔢', title: 'Numbers', subtitle: 'Read & spell numerals' }]
          : []),
        { to: '/translation', emoji: '✍️', title: 'Translation', subtitle: 'Translate sentences to practice output' },
      ],
    },
    {
      label: '🎶 Extras',
      showBorder: true,
      cards: [
        { to: '/lyrics', emoji: '🎵', title: 'Music', subtitle: 'Learn through song lyrics' },
        { to: '/tests', emoji: '📊', title: 'Tests', subtitle: 'Track your level' },
      ],
    },
  ];

  const moreCount = moreSections.reduce((n, s) => n + s.cards.length, 0);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Learn</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Build strong comprehension through reading and listening before practicing output — this is how the best language learners study.
      </p>

      {recommended && (
        <Link
          to={recommended.route}
          className="mb-4 flex min-h-[44px] items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 transition-colors hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/15"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20">
            <span className="text-3xl leading-none">{recommended.emoji}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Start here</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{recommended.label}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{recommended.sublabel}</p>
          </div>
          <span aria-hidden="true" className="shrink-0 text-slate-500 dark:text-slate-400">
            →
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        <SectionLabel label={coreSection.label} showBorder={coreSection.showBorder} />
        {coreSection.cards.map((card) => (
          <ActivityCardLink key={card.to + card.title} card={card} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        aria-expanded={showMore}
        className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60"
      >
        {showMore ? 'Show less' : `Explore more (${moreCount})`}
        <span aria-hidden="true">{showMore ? '↑' : '↓'}</span>
      </button>

      {showMore && (
        <div className="grid grid-cols-2 gap-3">
          {moreSections.map((section) => (
            <React.Fragment key={section.label}>
              <SectionLabel label={section.label} showBorder={section.showBorder} />
              {section.cards.map((card) => (
                <ActivityCardLink key={card.to + card.title} card={card} />
              ))}
            </React.Fragment>
          ))}
        </div>
      )}

      <ExternalResources />
    </div>
  );
}
