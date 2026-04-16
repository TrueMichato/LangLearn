import { Link } from 'react-router-dom';

export default function LearnPage() {
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

        {/* Letter Practice placeholder — will be filled by letter-system agent */}
        <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow opacity-50">
          <span className="text-3xl">🔤</span>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">Letter Practice</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon — learn writing systems</p>
          </div>
        </div>

        {/* Vocabulary Lessons placeholder — will be filled by vocab-lessons agent */}
        <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow opacity-50">
          <span className="text-3xl">📖</span>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">Vocabulary Lessons</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon — themed word sets</p>
          </div>
        </div>
      </div>
    </div>
  );
}
