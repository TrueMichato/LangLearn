interface Segment {
  label: string;
  value: number;
  color: string;
}

interface SegmentedBarProps {
  segments: Segment[];
}

export default function SegmentedBar({ segments }: SegmentedBarProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
        No data yet
      </p>
    );
  }

  return (
    <div>
      {/* Bar */}
      <div className="flex h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
        {segments.map((seg) => {
          const pct = (seg.value / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={seg.label}
              className={`${seg.color} transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>

      {/* Legend.
          The percentage used to sit inside its own segment in white, which
          only cleared AA on the darkest tints — white on bg-yellow-500
          measured 1.91:1. Reading it here instead means the bar can use any
          tint the palette wants and the number is always legible. */}
      <div className="flex flex-wrap gap-4 mt-3 justify-center">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span
              className={`inline-block w-3 h-3 rounded-full ${seg.color}`}
            />
            <span className="text-xs text-slate-600 dark:text-slate-300">
              {seg.label}: {seg.value} ({Math.round((seg.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
