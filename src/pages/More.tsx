import { Link } from 'react-router-dom';

const items = [
  { to: '/grammar', icon: '📝', label: 'Grammar Guide', desc: 'Review grammar rules and patterns' },
  { to: '/settings', icon: '⚙️', label: 'Settings', desc: 'Languages, goals, and preferences' },
];

export default function MorePage() {
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">More</h1>
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
        >
          <span className="text-3xl">{item.icon}</span>
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">{item.label}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
