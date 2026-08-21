import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import { getAlphabetsForLanguage } from '../data/alphabets';
import { hasNumbers } from '../data/numbers';
import { getLanguageFlag } from '../lib/languages';
import ExternalResources from '../components/common/ExternalResources';
import LearningPath from '../components/learn/LearningPath';
import LanguagePicker from '../components/common/LanguagePicker';
import LanguageUnavailable from '../components/common/LanguageUnavailable';
import { LEARNING_PATHS } from '../data/learning-paths';
import { loadLearningPath } from '../lib/learning-path';
import { SkeletonList } from '../components/common/Skeleton';
import type { LearningPath as LearningPathModel } from '../types/learning-path';

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
  const { language: currentLanguage, setLanguage } = useCurrentLanguage();
  const languagesWithLetters = activeLanguages.filter((l) => getAlphabetsForLanguage(l).length > 0);
  const hasArabic = activeLanguages.includes('ar');
  const hasNumberPractice = activeLanguages.some((l) => hasNumbers(l));
  const [showBrowseAll, setShowBrowseAll] = useState(false);
  const [path, setPath] = useState<LearningPathModel | null>(null);
  const [pathLoading, setPathLoading] = useState(true);
  const [pathError, setPathError] = useState('');
  const pathLanguages = useMemo(
    () => activeLanguages.filter((lang) => LEARNING_PATHS[lang]),
    [activeLanguages],
  );

  useEffect(() => {
    let cancelled = false;
    setPathLoading(true);
    setPathError('');
    if (!currentLanguage || !LEARNING_PATHS[currentLanguage]) {
      setPath(null);
      setPathLoading(false);
      return () => {
        cancelled = true;
      };
    }

    loadLearningPath(currentLanguage)
      .then((nextPath) => {
        if (!cancelled) setPath(nextPath);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setPath(null);
        setPathError(
          error instanceof Error
            ? error.message
            : 'The learning path could not be loaded.',
        );
      })
      .finally(() => {
        if (!cancelled) setPathLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentLanguage]);

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

  const browseCount =
    coreSection.cards.length +
    moreSections.reduce((count, section) => count + section.cards.length, 0);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Learn</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Follow a calm route through the essentials, or browse every activity when you know what you need.
      </p>

      <LanguagePicker
        options={activeLanguages}
        value={currentLanguage}
        onChange={setLanguage}
        label="Learning path language"
        className="mb-4"
      />

      {pathLoading ? (
        <SkeletonList count={4} />
      ) : pathError ? (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <p className="font-semibold">Your path needs a quick refresh</p>
          <p className="mt-1">{pathError} You can still browse every activity below.</p>
        </div>
      ) : path ? (
        <LearningPath path={path} />
      ) : (
        <LanguageUnavailable
          requested={currentLanguage}
          options={pathLanguages}
          onChange={setLanguage}
          feature="A guided learning path"
        />
      )}

      <button
        type="button"
        onClick={() => setShowBrowseAll((visible) => !visible)}
        aria-expanded={showBrowseAll}
        aria-controls="learn-activity-browser"
        className="mt-5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60"
      >
        {showBrowseAll ? 'Hide activity browser' : `Browse all activities (${browseCount})`}
        <span aria-hidden="true">{showBrowseAll ? '↑' : '↓'}</span>
      </button>

      {showBrowseAll && (
        <div id="learn-activity-browser" className="mt-1 grid grid-cols-2 gap-3">
          <SectionLabel label={coreSection.label} showBorder={coreSection.showBorder} />
          {coreSection.cards.map((card) => (
            <ActivityCardLink key={card.to + card.title} card={card} />
          ))}
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
