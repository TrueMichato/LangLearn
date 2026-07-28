import { useState, useMemo } from 'react';
import { BADGES, type BadgeCategory, type BadgeDefinition } from '../../data/badges';
import { useBadgeStore } from '../../stores/badgeStore';
import { useSettingsStore } from '../../stores/settingsStore';

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  xp: '⭐ XP Milestones',
  streak: '🔥 Streaks',
  reviews: '📝 Reviews',
  vocabulary: '📚 Vocabulary',
  lessons: '📘 Lessons',
  kanji: '漢 Kanji',
  'letters-ja': 'あ Japanese Kana',
  'letters-ru': 'Б Russian Letters',
  'letters-pt': 'á Portuguese Letters',
  'daily-challenge': '🎯 Daily Challenges',
  reading: '📖 Reading',
  'vocabulary-lang': '🗂️ Vocabulary by Language',
  'lessons-lang': '🎓 Lessons by Language',
  'tests-lang': '🏅 Proficiency Tests',
};

const CATEGORY_ORDER: BadgeCategory[] = [
  'xp',
  'streak',
  'reviews',
  'vocabulary',
  'vocabulary-lang',
  'lessons',
  'lessons-lang',
  'tests-lang',
  'kanji',
  'letters-ja',
  'letters-ru',
  'letters-pt',
  'daily-challenge',
  'reading',
];

export default function BadgeCollection() {
  const unlockedBadges = useBadgeStore((s) => s.unlockedBadges);
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const visibleBadges = useMemo<BadgeDefinition[]>(() => {
    const active = new Set(activeLanguages);
    return BADGES.filter((b) => {
      if (!b.language) return true;
      // Show language-locked badges only when their language is active,
      // but always keep an already-earned badge visible so accomplishments persist.
      return active.has(b.language) || b.id in unlockedBadges;
    });
  }, [activeLanguages, unlockedBadges]);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    badges: visibleBadges.filter((b) => b.category === cat),
  })).filter((g) => g.badges.length > 0);

  const total = visibleBadges.length;
  const unlocked = visibleBadges.filter((b) => b.id in unlockedBadges).length;
  const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  // Collapsed preview: earned badges first, then the next few to chase.
  const preview = useMemo<BadgeDefinition[]>(() => {
    const earned = visibleBadges.filter((b) => b.id in unlockedBadges);
    const locked = visibleBadges.filter((b) => !(b.id in unlockedBadges));
    return [...earned, ...locked].slice(0, 8);
  }, [visibleBadges, unlockedBadges]);

  const selected = selectedBadge
    ? BADGES.find((b) => b.id === selectedBadge)
    : null;
  const selectedDate = selectedBadge ? unlockedBadges[selectedBadge] : null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200">
          🏅 Badges
        </h3>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {unlocked} / {total} unlocked
        </span>
      </div>

      {/* Progress toward badge completion */}
      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {!expanded ? (
        <>
          <div className="grid grid-cols-4 gap-3">
            {preview.map((badge) => {
              const isUnlocked = badge.id in unlockedBadges;
              return isUnlocked ? (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge.id)}
                  className="bg-white dark:bg-slate-700 rounded-xl shadow-sm p-3 text-center cursor-pointer hover:ring-2 hover:ring-indigo-400 dark:hover:ring-indigo-500 transition-all min-h-[44px]"
                  title={badge.name}
                >
                  <span className="text-2xl block">{badge.icon}</span>
                </button>
              ) : (
                <div
                  key={badge.id}
                  className="bg-slate-100 dark:bg-slate-900/40 rounded-xl p-3 text-center opacity-60 flex items-center justify-center min-h-[44px]"
                  title={badge.description}
                >
                  <span className="text-2xl block">🔒</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setExpanded(true)}
            className="mt-3 w-full text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline min-h-[44px]"
          >
            Show all {total} badges →
          </button>
        </>
      ) : (
        <>
          {grouped.map(({ category, label, badges }) => (
            <div key={category} className="mb-4 last:mb-0">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                {label}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {badges.map((badge) => {
                  const isUnlocked = badge.id in unlockedBadges;
                  return isUnlocked ? (
                    <button
                      key={badge.id}
                      onClick={() => setSelectedBadge(badge.id)}
                      className="bg-white dark:bg-slate-700 rounded-xl shadow p-3 text-center cursor-pointer hover:ring-2 hover:ring-indigo-400 dark:hover:ring-indigo-500 transition-all min-h-[44px]"
                    >
                      <span className="text-2xl block">{badge.icon}</span>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1 leading-tight">
                        {badge.name}
                      </p>
                    </button>
                  ) : (
                    <div
                      key={badge.id}
                      className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 text-center opacity-50"
                      title={badge.description}
                    >
                      <span className="text-2xl block">🔒</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                        {badge.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <button
            onClick={() => setExpanded(false)}
            className="mt-1 w-full text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline min-h-[44px]"
          >
            Show less ↑
          </button>
        </>
      )}

      {/* Badge detail modal */}
      {selected && selectedDate && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-xs w-full mx-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-5xl block mb-3">{selected.icon}</span>
            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
              {selected.name}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              {selected.description}
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">
              🎉 Earned on {new Date(selectedDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <button
              onClick={() => setSelectedBadge(null)}
              className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-sm min-h-[44px]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
