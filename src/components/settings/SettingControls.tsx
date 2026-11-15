import type { ReactNode } from 'react';

export function SettingToggle({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  description?: ReactNode;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <label id={`${id}-label`} htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </label>
        {description && (
          <p id={`${id}-help`} className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        name={id}
        type="button"
        role="switch"
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-help` : undefined}
        aria-checked={checked}
        disabled={disabled}
        onClick={onChange}
        className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span
          aria-hidden="true"
          className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            checked ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        >
          <span className={`h-4 w-4 rounded-full bg-white dark:bg-slate-100 shadow-sm transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </span>
      </button>
    </div>
  );
}

export function SettingRange({
  id,
  label,
  description,
  value,
  valueText,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  value: number;
  valueText: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </label>
        <output htmlFor={id} className="text-sm tabular-nums text-slate-600 dark:text-slate-300">
          {valueText}
        </output>
      </div>
      {description && (
        <p id={`${id}-help`} className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {description}
        </p>
      )}
      <input
        id={id}
        name={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        aria-describedby={description ? `${id}-help` : undefined}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full min-h-[44px] accent-indigo-600 dark:accent-indigo-400"
      />
    </div>
  );
}
