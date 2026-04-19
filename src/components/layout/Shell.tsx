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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 pb-20">
      <header className="sticky top-0 glass border-b border-slate-200/60 dark:border-white/10 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">🌱 LangLearn</h1>
          <div className="flex items-center gap-1.5">
            <StudyTimer />
            <button
              onClick={() => setShowDictionary(true)}
              className="text-lg p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
              aria-label="Search dictionary"
            >
              🔍
            </button>
            <button
              onClick={toggleDarkMode}
              className="text-lg p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-4">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
      <BadgeToast />
      <DictionaryModal isOpen={showDictionary} onClose={() => setShowDictionary(false)} />
      <BottomNav />
    </div>
  );
}
