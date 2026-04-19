interface BarChartProps {
  data: { label: string; value: number }[];
  maxValue?: number;
  gradient?: 'indigo' | 'green';
  unit?: string;
}

export default function BarChart({
  data,
  maxValue,
  gradient = 'indigo',
  unit = '',
}: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  const gradientClass =
    gradient === 'green'
      ? 'bg-gradient-to-r from-emerald-500 to-green-400'
      : 'bg-gradient-to-r from-indigo-500 to-violet-500';

  return (
    <div className="space-y-2">
      {data.map((item) => {
        const widthPercent = max > 0 ? (item.value / max) * 100 : 0;
        return (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 w-16 shrink-0 text-right truncate">
              {item.label}
            </span>
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-6 overflow-hidden relative">
              {/* Subtle grid pattern */}
              <div
                className="absolute inset-0 opacity-10 dark:opacity-5"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, transparent, transparent 24px, currentColor 24px, currentColor 25px)',
                }}
              />
              <div
                className={`${gradientClass} h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2 relative`}
                style={{ width: `${Math.max(widthPercent, item.value > 0 ? 8 : 0)}%` }}
              >
                {item.value > 0 && (
                  <span className="text-xs text-white font-medium">
                    {item.value}{unit}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
