import { useState, useMemo } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { immersionTips, type ImmersionTip } from '../../data/immersion-tips';

type Category = ImmersionTip['category'] | 'all';

const categoryLabels: Record<Category, string> = {
  all: 'All',
  media: 'Media',
  'daily-life': 'Daily Life',
  social: 'Social',
  technology: 'Technology',
  creative: 'Creative',
};

const categories: Category[] = ['all', 'media', 'daily-life', 'social', 'technology', 'creative'];

export default function ImmersionSection() {
  const { activeLanguages } = useSettingsStore();
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  const filteredTips = useMemo(() => {
    return immersionTips
      .filter((tip) => {
        // Show universal tips + tips matching user's active languages
        if (!tip.languages) return true;
        return tip.languages.some((lang) => activeLanguages.includes(lang));
      })
      .filter((tip) => {
        if (selectedCategory === 'all') return true;
        return tip.category === selectedCategory;
      });
  }, [activeLanguages, selectedCategory]);

  return (
    <section className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-slate-200/60 dark:border-white/10 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
        🌍 Immersion Ideas
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Extend your learning beyond the app
      </p>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 press-feedback ${
              selectedCategory === cat
                ? 'gradient-primary text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Tips grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredTips.map((tip) => (
          <div
            key={tip.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none mt-0.5 shrink-0">{tip.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                  {tip.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {tip.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTips.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
          No tips match the current filter.
        </p>
      )}
    </section>
  );
}
