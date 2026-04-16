import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import StudyTimer from '../common/StudyTimer';

export default function Shell() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-indigo-600">🌱 LangLearn</h1>
          <StudyTimer />
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
