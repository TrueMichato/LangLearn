import React from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { getAlphabetsForLanguage } from '../data/alphabets';
import { getLanguageLabel } from '../lib/languages';

interface ActivityCard {
  to: string;
  emoji: string;
  title: string;
  subtitle: string;
  borderColor: string;
  bgColor: string;
  disabled?: boolean;
  colSpan2?: boolean;
  gradient?: string;
}

interface CardSection {
  label: string;
  showBorder: boolean;
  cards: ActivityCard[];
}

const cardBase =
  'flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 press-feedback';

function SectionLabel({ label, showBorder }: { label: string; showBorder: boolean }) {
  return (
    <div
      className={`col-span-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 mt-4 ${
        showBorder ? 'border-t border-gray-200 dark:border-gray-700 pt-4' : ''
      }`}
    >
      {label}
    </div>
  );
}

function ActivityCardLink({ card }: { card: ActivityCard }) {
  if (card.disabled) {
    return (
      <div
        className={`flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow opacity-50 border-l-4 ${card.borderColor} ${card.colSpan2 ? 'col-span-2' : ''}`}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${card.bgColor}`}>
          <span className="text-3xl leading-none">{card.emoji}</span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{card.title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{card.subtitle}</p>
        </div>
      </div>
    );
  }
  return (
    <Link
      to={card.to}
      className={`${cardBase} border-l-4 ${card.borderColor} ${card.colSpan2 ? 'col-span-2' : ''} ${card.gradient ?? ''}`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${card.bgColor}`}>
        <span className="text-3xl leading-none">{card.emoji}</span>
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{card.title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{card.subtitle}</p>
      </div>
    </Link>
  );
}

export default function LearnPage() {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const languagesWithLetters = activeLanguages.filter((l) => getAlphabetsForLanguage(l).length > 0);

  const letterCards: ActivityCard[] =
    languagesWithLetters.length > 0
      ? languagesWithLetters.map((lang) => {
          const alphabets = getAlphabetsForLanguage(lang);
          return {
            to: `/letters/${lang}`,
            emoji: '🔤',
            title: `${getLanguageLabel(lang)} Letters`,
            subtitle: alphabets.map((a) => a.name).join(', '),
            borderColor: 'border-violet-400 dark:border-violet-500',
            bgColor: 'bg-violet-100 dark:bg-violet-900/40',
          };
        })
      : [
          {
            to: '#',
            emoji: '🔤',
            title: 'Letter Practice',
            subtitle: 'Add Japanese or Russian',
            borderColor: 'border-violet-400 dark:border-violet-500',
            bgColor: 'bg-violet-100 dark:bg-violet-900/40',
            disabled: true,
          },
        ];

  const sections: CardSection[] = [
    {
      label: '📥 Input & Study',
      showBorder: false,
      cards: [
        {
          to: '/grammar',
          emoji: '📖',
          title: 'Grammar',
          subtitle: 'Rules & patterns',
          borderColor: 'border-indigo-400 dark:border-indigo-500',
          bgColor: 'bg-indigo-100 dark:bg-indigo-900/40',
        },
        {
          to: '/vocab-lessons',
          emoji: '📝',
          title: 'Vocabulary',
          subtitle: 'Themed word sets',
          borderColor: 'border-rose-400 dark:border-rose-500',
          bgColor: 'bg-rose-100 dark:bg-rose-900/40',
        },
        ...letterCards,
        {
          to: '/listening',
          emoji: '🎧',
          title: 'Listening',
          subtitle: 'Audio comprehension',
          borderColor: 'border-teal-400 dark:border-teal-500',
          bgColor: 'bg-teal-100 dark:bg-teal-900/40',
        },
      ],
    },
    {
      label: '📤 Practice & Output',
      showBorder: true,
      cards: [
        {
          to: '/sentence-builder',
          emoji: '✏️',
          title: 'Sentences',
          subtitle: 'Build & translate',
          borderColor: 'border-emerald-400 dark:border-emerald-500',
          bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
        },
        {
          to: '/conjugations',
          emoji: '🔄',
          title: 'Conjugations',
          subtitle: 'Verbs & noun cases',
          borderColor: 'border-orange-400 dark:border-orange-500',
          bgColor: 'bg-orange-100 dark:bg-orange-900/40',
        },
      ],
    },
    {
      label: '📊 Assessment',
      showBorder: true,
      cards: [
        {
          to: '/tests',
          emoji: '📊',
          title: 'Tests',
          subtitle: 'Track your level',
          borderColor: 'border-amber-400 dark:border-amber-500',
          bgColor: 'bg-amber-100 dark:bg-amber-900/40',
        },
      ],
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Learn</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Build strong comprehension through reading and listening before practicing output — this is how the best language learners study.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {sections.map((section) => (
          <React.Fragment key={section.label}>
            <SectionLabel label={section.label} showBorder={section.showBorder} />
            {section.cards.map((card) => (
              <ActivityCardLink key={card.to + card.title} card={card} />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
