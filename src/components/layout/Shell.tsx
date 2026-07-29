import { useState, Suspense } from 'react';
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
import InAppNudgeStack from '../common/InAppNudgeStack';
import { PageSkeleton } from '../common/Skeleton';

export default function Shell() {
  const darkMode = useDarkMode();
  useFontSize();
  useNotificationScheduler();
  useBadgeChecker();
  const toggleDarkMode = useSettingsStore((s) => s.toggleDarkMode);
  const [showDictionary, setShowDictionary] = useState(false);

  return (
    <div className="min-h-screen app-canvas">
      <div className="app-frame app-surface min-h-screen pb-[calc(var(--nav-height)_+_var(--safe-bottom))]">
        <header className="sticky top-0 glass border-b border-slate-200/60 dark:border-white/10 z-40 pt-[var(--safe-top)]">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">🌱 LangLearn</h1>
            <div className="flex items-center gap-1.5">
              <StudyTimer />
              <button
                onClick={() => setShowDictionary(true)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center text-lg rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
                aria-label="Search dictionary"
              >
                🔍
              </button>
              <button
                onClick={toggleDarkMode}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center text-lg rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
                aria-label="Toggle dark mode"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </header>
        <main className="px-4 py-4">
          <div className="page-enter">
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
      <BadgeToast />
      <InAppNudgeStack />
      <DictionaryModal isOpen={showDictionary} onClose={() => setShowDictionary(false)} />
      <BottomNav />
    </div>
  );
}
