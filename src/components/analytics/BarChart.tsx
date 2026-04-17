interface BarChartProps {
  data: { label: string; value: number }[];
  maxValue?: number;
  color?: string;
  unit?: string;
}

export default function BarChart({
  data,
  maxValue,
  color = 'bg-indigo-500',
  unit = '',
}: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-2">
      {data.map((item) => {
        const widthPercent = max > 0 ? (item.value / max) * 100 : 0;
        return (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 w-16 shrink-0 text-right truncate">
              {item.label}
            </span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
              <div
                className={`${color} h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
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
