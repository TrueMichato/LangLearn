import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import StudyTimer from '../common/StudyTimer';
import DictionaryModal from '../dictionary/DictionaryModal';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useFontSize } from '../../hooks/useFontSize';
import { useNotificationScheduler } from '../../hooks/useNotificationScheduler';
import { useSettingsStore } from '../../stores/settingsStore';
import BadgeToast from '../badges/BadgeToast';
import { useBadgeChecker } from '../../hooks/useBadgeChecker';

export default function Shell() {
  const darkMode = useDarkMode();
  useFontSize();
  useNotificationScheduler();
  useBadgeChecker();
  const toggleDarkMode = useSettingsStore((s) => s.toggleDarkMode);
  const [showDictionary, setShowDictionary] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 pb-20">
      <header className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">🌱 LangLearn</h1>
          <div className="flex items-center gap-2">
            <StudyTimer />
            <button
              onClick={() => setShowDictionary(true)}
              className="text-lg p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Search dictionary"
            >
              🔍
            </button>
            <button
              onClick={toggleDarkMode}
              className="text-lg p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-4">
        <Outlet />
      </main>
      <BadgeToast />
      <DictionaryModal isOpen={showDictionary} onClose={() => setShowDictionary(false)} />
      <BottomNav />
    </div>
  );
}
