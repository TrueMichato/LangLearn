import { Link } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { getAlphabetsForLanguage } from '../data/alphabets';

export default function LearnPage() {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const languagesWithLetters = activeLanguages.filter((l) => getAlphabetsForLanguage(l).length > 0);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Learn</h2>

      <div className="space-y-3">
        <Link
          to="/grammar"
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-md transition-shadow"
        >
          <span className="text-3xl">📝</span>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">Grammar Lessons</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Learn grammar rules and patterns</p>
          </div>
          <span className="ml-auto text-gray-400 dark:text-gray-500">→</span>
        </Link>

        {/* Letter Practice */}
        {languagesWithLetters.length > 0 ? (
          <Link
            to={`/letters/${languagesWithLetters[0]}`}
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-md transition-shadow"
          >
            <span className="text-3xl">🔤</span>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-100">Letter Practice</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Learn Hiragana, Katakana, Cyrillic</p>
            </div>
            <span className="ml-auto text-gray-400 dark:text-gray-500">→</span>
          </Link>
        ) : (
          <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow opacity-50">
            <span className="text-3xl">🔤</span>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-100">Letter Practice</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add Japanese or Russian to enable</p>
            </div>
          </div>
        )}

        <Link
          to="/vocab-lessons"
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-md transition-shadow"
        >
          <span className="text-3xl">📖</span>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">Vocabulary Lessons</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Learn themed vocabulary sets</p>
          </div>
          <span className="ml-auto text-gray-400 dark:text-gray-500">→</span>
        </Link>
      </div>
    </div>
  );
}
