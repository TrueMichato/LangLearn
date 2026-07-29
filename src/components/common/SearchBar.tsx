import { useState, useEffect } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = 'Search…' }: SearchBarProps) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 300);
    return () => clearTimeout(timer);
  }, [local, value, onChange]);

  return (
    <div className="relative bg-white dark:bg-slate-800 shadow-sm rounded-xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:shadow-md transition-all">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none">
        🔍
      </span>
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full min-h-[44px] pl-10 pr-11 py-2 rounded-xl bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none"
      />
      {local && (
        <button
          onClick={() => { setLocal(''); onChange(''); }}
          className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 press-feedback"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
