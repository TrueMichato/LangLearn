import { Link } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { getAlphabetsForLanguage } from '../data/alphabets';
import { getLanguageLabel } from '../lib/languages';

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
          languagesWithLetters.map((lang) => {
            const alphabets = getAlphabetsForLanguage(lang);
            const subtitle = alphabets.map((a) => a.name).join(', ');
            return (
              <Link
                key={lang}
                to={`/letters/${lang}`}
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-md transition-shadow"
              >
                <span className="text-3xl">🔤</span>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{getLanguageLabel(lang)} Letters</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
                </div>
                <span className="ml-auto text-gray-400 dark:text-gray-500">→</span>
              </Link>
            );
          })
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
          to="/sentence-builder"
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-md transition-shadow"
        >
          <span className="text-3xl">✍️</span>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">Sentence Builder</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Build sentences from tiles or type them out</p>
          </div>
          <span className="ml-auto text-gray-400 dark:text-gray-500">→</span>
        </Link>

        <Link
          to="/conjugations"
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-md transition-shadow"
        >
          <span className="text-3xl">🔄</span>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">Conjugation Drills</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Practice verb forms and noun cases</p>
          </div>
          <span className="ml-auto text-gray-400 dark:text-gray-500">→</span>
        </Link>

        <Link
          to="/listening"
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-md transition-shadow"
        >
          <span className="text-3xl">🎧</span>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">Listening Practice</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Listen to passages and test comprehension</p>
          </div>
          <span className="ml-auto text-gray-400 dark:text-gray-500">→</span>
        </Link>

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

        <Link
          to="/tests"
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-md transition-shadow"
        >
          <span className="text-3xl">📋</span>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">Proficiency Tests</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Test your knowledge and track your level</p>
          </div>
          <span className="ml-auto text-gray-400 dark:text-gray-500">→</span>
        </Link>
      </div>
    </div>
  );
}
