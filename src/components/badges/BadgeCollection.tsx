import { BADGES, type BadgeDefinition } from '../../data/badges';
import { useBadgeStore } from '../../stores/badgeStore';

const CATEGORY_LABELS: Record<BadgeDefinition['category'], string> = {
  xp: '⭐ XP Milestones',
  streak: '🔥 Streaks',
  reviews: '📝 Reviews',
  vocabulary: '📚 Vocabulary',
  lessons: '📘 Lessons',
  kanji: '漢 Kanji',
};

const CATEGORY_ORDER: BadgeDefinition['category'][] = [
  'xp',
  'streak',
  'reviews',
  'vocabulary',
  'lessons',
  'kanji',
];

export default function BadgeCollection() {
  const unlockedBadges = useBadgeStore((s) => s.unlockedBadges);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    badges: BADGES.filter((b) => b.category === cat),
  }));

  const total = BADGES.length;
  const unlocked = Object.keys(unlockedBadges).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200">
          🏅 Badges
        </h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {unlocked}/{total}
        </span>
      </div>

      {grouped.map(({ category, label, badges }) => (
        <div key={category} className="mb-4 last:mb-0">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            {label}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {badges.map((badge) => {
              const isUnlocked = badge.id in unlockedBadges;
              return isUnlocked ? (
                <div
                  key={badge.id}
                  className="bg-white dark:bg-gray-700 rounded-xl shadow p-3 text-center"
                >
                  <span className="text-2xl block">{badge.icon}</span>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mt-1 leading-tight">
                    {badge.name}
                  </p>
                </div>
              ) : (
                <div
                  key={badge.id}
                  className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 text-center opacity-50"
                  title={badge.description}
                >
                  <span className="text-2xl block">🔒</span>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-tight">
                    {badge.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
