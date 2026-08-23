import { Link } from 'react-router-dom';
import ExternalResources from '../components/common/ExternalResources';
import LanguagePicker from '../components/common/LanguagePicker';
import LearnModeNav from '../components/learn/LearnModeNav';
import { getAlphabetsForLanguage } from '../data/alphabets';
import { hasNumbers } from '../data/numbers';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import { useLearningPath } from '../hooks/useLearningPath';
import { getPathRecommendations } from '../lib/learn-activity-recommendations';
import { getLanguageFlag } from '../lib/languages';
import {
  readRecentLearnActivities,
  recordRecentLearnActivity,
} from '../lib/recent-learn-activities';
import { ROUTES, lessonLibraryRoute, lettersRoute } from '../lib/routes';
import { useSettingsStore } from '../stores/settingsStore';

interface ActivityCard {
  to: string;
  emoji: string;
  title: string;
  subtitle: string;
  disabled?: boolean;
}

interface CardSection {
  label: string;
  description: string;
  cards: ActivityCard[];
}

function getBrowseSections(language?: string): CardSection[] {
  const alphabets = language ? getAlphabetsForLanguage(language) : [];
  const hasArabic = language === 'ar';
  const hasNumberPractice = language ? hasNumbers(language) : false;

  const letterCards: ActivityCard[] =
    language && alphabets.length > 0
      ? [
          {
            to: lettersRoute(language),
            emoji: '🔤',
            title: `${getLanguageFlag(language)} Letters`,
            subtitle: alphabets.map((alphabet) => alphabet.name).join(', '),
          },
        ]
      : [
          {
            to: '#',
            emoji: '🔤',
            title: 'Letter Practice',
            subtitle: 'Choose a language with a writing system',
            disabled: true,
          },
        ];

  return [
    {
      label: 'Lesson libraries',
      description: 'Prefer one subject at a time? Browse every lesson in order.',
      cards: [
        {
          to: lessonLibraryRoute(ROUTES.grammar),
          emoji: '📖',
          title: 'Grammar lessons',
          subtitle: 'All grammar lessons in course order',
        },
        {
          to: lessonLibraryRoute(ROUTES.vocabLessons),
          emoji: '📝',
          title: 'Vocabulary lessons',
          subtitle: 'All vocabulary lessons in course order',
        },
        ...letterCards,
        ...(hasArabic
          ? [
              {
                to: ROUTES.dialects,
                emoji: '🗣️',
                title: 'Dialects',
                subtitle: 'Compare spoken Arabic',
              },
            ]
          : []),
      ],
    },
    {
      label: 'Practice activities',
      description: 'Choose the skill you want to work on right now.',
      cards: [
        {
          to: ROUTES.sentenceBuilder,
          emoji: '✏️',
          title: 'Sentences',
          subtitle: 'Build and translate',
        },
        {
          to: ROUTES.clozePractice,
          emoji: '🧩',
          title: 'Cloze Practice',
          subtitle: 'Fill in the blank',
        },
        {
          to: ROUTES.conjugations,
          emoji: '🔄',
          title: 'Conjugations',
          subtitle: 'Verbs and noun cases',
        },
        {
          to: ROUTES.listening,
          emoji: '🎧',
          title: 'Listening',
          subtitle: 'Audio comprehension',
        },
        {
          to: ROUTES.minimalPairs,
          emoji: '👂',
          title: 'Minimal Pairs',
          subtitle: 'Pronunciation ear training',
        },
        ...(hasNumberPractice
          ? [
              {
                to: ROUTES.numberPractice,
                emoji: '🔢',
                title: 'Numbers',
                subtitle: 'Read and spell numerals',
              },
            ]
          : []),
        {
          to: ROUTES.translation,
          emoji: '✍️',
          title: 'Translation',
          subtitle: 'Practice writing in your language',
        },
      ],
    },
    {
      label: 'More ways to learn',
      description: 'Explore music or check your current level.',
      cards: [
        {
          to: ROUTES.lyrics,
          emoji: '🎵',
          title: 'Music',
          subtitle: 'Learn through song lyrics',
        },
        {
          to: ROUTES.tests,
          emoji: '📊',
          title: 'Tests',
          subtitle: 'Track your level',
        },
      ],
    },
  ];
}

function CardBody({ card }: { card: ActivityCard }) {
  return (
    <>
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-700"
        aria-hidden="true"
      >
        {card.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-5 text-slate-800 dark:text-slate-100">
          {card.title}
        </span>
        <span className="mt-0.5 block text-xs leading-[1.4] text-slate-500 dark:text-slate-400">
          {card.subtitle}
        </span>
      </span>
    </>
  );
}

function ActivityCardLink({
  card,
  featured = false,
  divided = false,
}: {
  card: ActivityCard;
  featured?: boolean;
  divided?: boolean;
}) {
  const className = featured
    ? 'flex min-h-[68px] items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-white/10 dark:bg-slate-800'
    : `flex min-h-[60px] items-center gap-3 px-3 py-2 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 dark:hover:bg-slate-700/50 ${
        divided ? 'border-t border-slate-200/70 dark:border-white/10' : ''
      }`;

  if (card.disabled) {
    return (
      <div aria-disabled="true" className={`${className} opacity-50`}>
        <CardBody card={card} />
      </div>
    );
  }

  return (
    <Link
      to={card.to}
      onClick={() => recordRecentLearnActivity(card.to)}
      className={className}
    >
      <CardBody card={card} />
      <span
        className="shrink-0 text-slate-500 dark:text-slate-400"
        aria-hidden="true"
      >
        →
      </span>
    </Link>
  );
}

function ActivitySection({ section }: { section: CardSection }) {
  const headingId = `activity-section-${section.label
    .toLowerCase()
    .replaceAll(' ', '-')}`;

  return (
    <section aria-labelledby={headingId} className="mb-5">
      <h3
        id={headingId}
        className="text-sm font-semibold text-slate-800 dark:text-slate-100"
      >
        {section.label}
      </h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {section.description}
      </p>
      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200/70 bg-white dark:border-white/10 dark:bg-slate-800">
        {section.cards.map((card, index) => (
          <ActivityCardLink
            key={card.to + card.title}
            card={card}
            divided={index > 0}
          />
        ))}
      </div>
    </section>
  );
}

export default function BrowseActivitiesPage() {
  const activeLanguages = useSettingsStore((state) => state.activeLanguages);
  const { language, setLanguage } = useCurrentLanguage();
  const { path } = useLearningPath(language);
  const sections = getBrowseSections(language);
  const recommendations = getPathRecommendations(path);
  const allCards = sections.flatMap((section) => section.cards);
  const recentCard = readRecentLearnActivities()
    .map((recent) =>
      [...recommendations, ...allCards].find(
        (card) => card.to === recent.route && !card.disabled,
      ),
    )
    .find((card): card is ActivityCard => card !== undefined);
  const recommended = recommendations.filter(
    (card) => card.to !== recentCard?.to,
  );

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
        Lessons &amp; practice
      </h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Follow one lesson subject in order, or jump straight into the skill you
        want to practice.
      </p>

      <LearnModeNav />

      <LanguagePicker
        options={activeLanguages}
        value={language}
        onChange={setLanguage}
        label="Activity language"
        className="mb-4"
      />

      <ActivitySection section={sections[0]} />
      <ActivitySection section={sections[1]} />

      {recentCard && (
        <section aria-labelledby="continue-activity-heading" className="mb-5">
          <h3
            id="continue-activity-heading"
            className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100"
          >
            Continue where you left off
          </h3>
          <ActivityCardLink card={recentCard} featured />
        </section>
      )}

      {recommended.length > 0 && (
        <section aria-labelledby="recommended-activity-heading" className="mb-5">
          <h3
            id="recommended-activity-heading"
            className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100"
          >
            Recommended for your path
          </h3>
          <div className="space-y-3">
            {recommended.slice(0, 2).map((card) => (
              <ActivityCardLink key={card.to} card={card} featured />
            ))}
          </div>
        </section>
      )}

      {sections.slice(2).map((section) => (
        <ActivitySection key={section.label} section={section} />
      ))}

      <details className="mt-4 border-t border-slate-200/70 pt-2 dark:border-white/10">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between text-sm font-medium text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300">
          Outside resources
          <span aria-hidden="true">+</span>
        </summary>
        <ExternalResources />
      </details>
    </div>
  );
}
