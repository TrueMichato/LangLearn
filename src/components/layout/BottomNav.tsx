import { NavLink, useLocation } from 'react-router-dom';
import { useDueCount } from '../../hooks/useDueCount';
import { useRef, useEffect, useState } from 'react';

const links = [
  { to: '/', label: 'Home', icon: '📊' },
  { to: '/review', label: 'Review', icon: '🃏' },
  { to: '/words', label: 'Words', icon: '📚' },
  { to: '/reader', label: 'Reader', icon: '📖' },
  { to: '/learn', label: 'Learn', icon: '🎓' },
];

export default function BottomNav() {
  const dueCount = useDueCount();
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
    if (activeEl) {
      const navRect = navRef.current.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      setIndicatorStyle({
        left: elRect.left - navRect.left + elRect.width / 2 - 16,
        width: 32,
      });
    }
  }, [location.pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div ref={navRef} className="app-frame relative flex h-[var(--shell-bottom-clearance)] justify-around glass border-t md:border-x border-slate-200/60 pb-[var(--safe-bottom)] dark:border-white/10">
        {/* Sliding active indicator */}
        <div
          className="absolute top-0 h-[3px] rounded-full bg-indigo-500 transition-all duration-300 ease-out"
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />
        {links.map((link) => {
          const path = location.pathname;
          const isActive = link.to === '/' ? path === '/' : path.startsWith(link.to);
          return (
            <NavLink
              key={link.to}
              to={link.to}
              data-active={isActive}
              className={`flex flex-col items-center min-w-[44px] py-2 px-1.5 text-xs transition-all duration-200 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
              }`}
            >
              <span className={`relative text-xl mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                {link.icon}
                {link.to === '/review' && dueCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold px-1 leading-none animate-[pop_0.3s_ease-out]">
                    {dueCount > 99 ? '99+' : dueCount}
                  </span>
                )}
              </span>
              {link.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
