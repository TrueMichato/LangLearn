import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../lib/routes';

const MODES = [
  { to: ROUTES.learn, label: 'Guided path', end: true },
  { to: ROUTES.browseActivities, label: 'Lessons & practice', end: false },
] as const;

export default function LearnModeNav() {
  return (
    <nav
      aria-label="Learn sections"
      className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
    >
      {MODES.map((mode) => (
        <NavLink
          key={mode.to}
          to={mode.to}
          end={mode.end}
          className={({ isActive }) =>
            `flex min-h-[44px] items-center justify-center rounded-lg px-3 text-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isActive
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                : 'text-slate-600 hover:bg-white/70 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/70 dark:hover:text-slate-100'
            }`
          }
        >
          {mode.label}
        </NavLink>
      ))}
    </nav>
  );
}
