interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  unit?: string;
}

export default function LineChart({
  data,
  height = 180,
  color = '#6366f1', // indigo-500
  unit = '%',
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">
        No data yet
      </p>
    );
  }

  const padding = { top: 16, right: 12, bottom: 32, left: 36 };
  const chartWidth = 600;
  const chartHeight = height;
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  // Round max up to nearest nice number
  const yMax = Math.ceil(maxVal / 10) * 10 || 10;

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = padding.top + innerH - (d.value / yMax) * innerH;
    return { x, y, ...d };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Y-axis labels (0, 25%, 50%, 75%, 100% of yMax)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((frac) => ({
    value: Math.round(yMax * frac),
    y: padding.top + innerH - frac * innerH,
  }));

  // Show a subset of x-axis labels to avoid crowding
  const labelStep = Math.max(1, Math.floor(data.length / 6));

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {yTicks.map((tick) => (
        <g key={tick.value}>
          <line
            x1={padding.left}
            x2={chartWidth - padding.right}
            y1={tick.y}
            y2={tick.y}
            className="stroke-slate-200 dark:stroke-slate-700"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <text
            x={padding.left - 6}
            y={tick.y + 4}
            textAnchor="end"
            className="fill-slate-400 dark:fill-slate-500"
            fontSize={10}
          >
            {tick.value}{unit}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <polygon
        points={`${points[0].x},${padding.top + innerH} ${polyline} ${points[points.length - 1].x},${padding.top + innerH}`}
        fill={color}
        opacity={0.1}
      />

      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}

      {/* X-axis labels */}
      {points.map((p, i) =>
        i % labelStep === 0 || i === points.length - 1 ? (
          <text
            key={i}
            x={p.x}
            y={chartHeight - 4}
            textAnchor="middle"
            className="fill-slate-400 dark:fill-slate-500"
            fontSize={9}
          >
            {p.label}
          </text>
        ) : null
      )}
    </svg>
  );
}
