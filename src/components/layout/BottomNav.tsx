import { NavLink } from 'react-router-dom';
import { useDueCount } from '../../hooks/useDueCount';

const links = [
  { to: '/', label: 'Home', icon: '📊' },
  { to: '/review', label: 'Review', icon: '🃏' },
  { to: '/words', label: 'Words', icon: '📚' },
  { to: '/reader', label: 'Reader', icon: '📖' },
  { to: '/more', label: 'More', icon: '☰' },
];

export default function BottomNav() {
  const dueCount = useDueCount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pb-[env(safe-area-inset-bottom)] z-50">
      <div className="flex justify-around max-w-lg mx-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-1.5 text-xs transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`
            }
          >
            <span className="relative text-xl mb-0.5">
              {link.icon}
              {link.to === '/review' && dueCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
                  {dueCount > 99 ? '99+' : dueCount}
                </span>
              )}
            </span>
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
