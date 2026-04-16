import { useMemo } from 'react';
import type { StudySession } from '../../db/schema';

export interface HeatMapProps {
  studySessions: StudySession[];
}

const DAY_LABELS: { index: number; label: string }[] = [
  { index: 0, label: 'Mon' },
  { index: 2, label: 'Wed' },
  { index: 4, label: 'Fri' },
];

const CELL_SIZE = 14;
const GAP = 2;
const WEEKS = 12;

function getColorClass(minutes: number): string {
  if (minutes === 0) return 'bg-gray-100 dark:bg-gray-800';
  if (minutes <= 15) return 'bg-green-200 dark:bg-green-900';
  if (minutes <= 30) return 'bg-green-400 dark:bg-green-700';
  if (minutes <= 60) return 'bg-green-500 dark:bg-green-500';
  return 'bg-green-700 dark:bg-green-400';
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  // getDay(): 0=Sun, 1=Mon ... 6=Sat → shift so Mon=0
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

export default function HeatMap({ studySessions }: HeatMapProps) {
  const minutesByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of studySessions) {
      const dateKey = formatDate(new Date(session.startTime));
      map.set(dateKey, (map.get(dateKey) ?? 0) + session.durationSeconds / 60);
    }
    return map;
  }, [studySessions]);

  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from the Monday of the week (WEEKS-1) weeks ago
    const start = toMonday(today);
    start.setDate(start.getDate() - (WEEKS - 1) * 7);

    const columns: { date: Date; key: string }[][] = [];
    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;

    const cursor = new Date(start);
    while (cursor <= today) {
      const week: { date: Date; key: string }[] = [];
      for (let dow = 0; dow < 7; dow++) {
        const d = new Date(cursor);
        d.setDate(cursor.getDate() + dow);
        if (d > today) break;
        week.push({ date: d, key: formatDate(d) });

        const m = d.getMonth();
        if (m !== lastMonth) {
          labels.push({
            col: columns.length,
            label: d.toLocaleString('default', { month: 'short' }),
          });
          lastMonth = m;
        }
      }
      columns.push(week);
      cursor.setDate(cursor.getDate() + 7);
    }

    return { grid: columns, monthLabels: labels };
  }, []);

  const totalCols = grid.length;
  const labelColWidth = 28;
  const gridWidth = totalCols * (CELL_SIZE + GAP);

  return (
    <div>
      <div className="overflow-x-auto">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${labelColWidth}px repeat(${totalCols}, ${CELL_SIZE}px)`,
            gap: `${GAP}px`,
            width: labelColWidth + GAP + gridWidth,
          }}
        >
          {/* Month labels row */}
          <div />
          {Array.from({ length: totalCols }, (_, col) => {
            const label = monthLabels.find((m) => m.col === col);
            return (
              <div
                key={`month-${col}`}
                className="text-[10px] text-gray-500 dark:text-gray-400 leading-none"
                style={{ height: 14 }}
              >
                {label?.label ?? ''}
              </div>
            );
          })}

          {/* Grid rows (0=Mon … 6=Sun) */}
          {Array.from({ length: 7 }, (_, row) => (
            <>
              {/* Day label */}
              <div
                key={`label-${row}`}
                className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center"
                style={{ height: CELL_SIZE }}
              >
                {DAY_LABELS.find((d) => d.index === row)?.label ?? ''}
              </div>

              {/* Cells for this row across all weeks */}
              {grid.map((week, col) => {
                const cell = week[row];
                if (!cell) {
                  return (
                    <div
                      key={`empty-${col}-${row}`}
                      style={{ width: CELL_SIZE, height: CELL_SIZE }}
                    />
                  );
                }
                const mins = minutesByDate.get(cell.key) ?? 0;
                const minsRounded = Math.round(mins);
                const tooltip = `${cell.date.toLocaleDateString()}: ${minsRounded} min`;
                return (
                  <div
                    key={cell.key}
                    title={tooltip}
                    className={`rounded-sm ${getColorClass(mins)}`}
                    style={{ width: CELL_SIZE, height: CELL_SIZE }}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-3 text-[10px] text-gray-500 dark:text-gray-400 justify-end">
        <span>Less</span>
        {[
          'bg-gray-100 dark:bg-gray-800',
          'bg-green-200 dark:bg-green-900',
          'bg-green-400 dark:bg-green-700',
          'bg-green-500 dark:bg-green-500',
          'bg-green-700 dark:bg-green-400',
        ].map((cls, i) => (
          <div
            key={i}
            className={`rounded-sm ${cls}`}
            style={{ width: 12, height: 12 }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
