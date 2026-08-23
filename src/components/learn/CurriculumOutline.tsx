import { Link } from 'react-router-dom';
import { isRTL } from '../../lib/rtl';
import type { LearningPath } from '../../types/learning-path';

interface Props {
  path: LearningPath;
}

const KIND_LABELS = {
  letters: 'Letters',
  vocab: 'Vocabulary',
  grammar: 'Grammar',
} as const;

export default function CurriculumOutline({ path }: Props) {
  const rtl = isRTL(path.language);
  const availableUnitIndex = path.units.findIndex((unit) =>
    unit.nodes.some((node) => node.id === path.recommendedNodeId),
  );
  const currentUnitIndex =
    availableUnitIndex >= 0 ? availableUnitIndex : path.units.length - 1;

  return (
    <section aria-labelledby="curriculum-outline-heading">
      <div
        className={`mb-4 flex items-end justify-between gap-4 ${
          rtl ? 'flex-row-reverse' : ''
        }`}
      >
        <div>
          <h3
            id="curriculum-outline-heading"
            className="text-base font-semibold text-slate-800 dark:text-slate-100"
          >
            Course outline
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Plan ahead without crowding today’s next step.
          </p>
        </div>
        <p className="shrink-0 text-sm font-medium text-slate-600 dark:text-slate-300">
          {path.completedCount} of {path.totalCount}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-slate-800">
        {path.units.map((unit, unitIndex) => {
          const completed = unit.nodes.filter(
            (node) => node.state === 'completed',
          ).length;
          const availableNodes = unit.nodes.filter(
            (node) => node.state === 'available',
          );
          const current = unitIndex === currentUnitIndex;
          const renderNode = (node: (typeof unit.nodes)[number]) => {
            const recommended = node.id === path.recommendedNodeId;
            const body = (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                    {KIND_LABELS[node.kind]}
                    {recommended
                      ? ' · Up next'
                      : node.state === 'available'
                        ? ' · Also available'
                        : ''}
                  </span>
                  <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">
                    {node.title}
                  </span>
                </span>
                <span aria-hidden="true">
                  {node.state === 'completed'
                    ? '✓'
                    : node.state === 'available'
                      ? rtl
                        ? '←'
                        : '→'
                      : '🔒'}
                </span>
              </>
            );
            return (
              <li key={node.id}>
                {node.state === 'locked' ? (
                  <div
                    aria-label={`${node.title}, locked`}
                    className={`flex min-h-[52px] items-center gap-3 rounded-xl px-3 py-2 text-slate-500 dark:text-slate-400 ${
                      rtl ? 'flex-row-reverse text-right' : ''
                    }`}
                  >
                    {body}
                  </div>
                ) : (
                  <Link
                    to={node.route}
                    aria-current={recommended ? 'step' : undefined}
                    className={`flex min-h-[52px] items-center gap-3 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-200 dark:hover:bg-slate-700/50 ${
                      rtl ? 'flex-row-reverse text-right' : ''
                    }`}
                  >
                    {body}
                  </Link>
                )}
              </li>
            );
          };
          return (
            <details
              key={unit.id}
              open={current}
              className={
                unitIndex > 0
                  ? 'border-t border-slate-200/70 dark:border-white/10'
                  : ''
              }
            >
              <summary
                className={`flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
                  rtl ? 'flex-row-reverse text-right' : ''
                }`}
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-800 dark:text-slate-100">
                    {unit.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                    {current ? 'Current unit · ' : ''}
                    {completed} of {unit.nodes.length} steps
                  </span>
                </span>
                <span
                  className="shrink-0 text-slate-500 dark:text-slate-400"
                  aria-hidden="true"
                >
                  ▾
                </span>
              </summary>
              <div className="border-t border-slate-200/70 px-4 py-3 dark:border-white/10">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {unit.description}
                </p>
                {unit.strands.length > 0 ? (
                  <div className="mt-3 space-y-4">
                    {unit.strands.map((strand) => (
                      <section
                        key={strand.id}
                        aria-labelledby={`curriculum-strand-${unit.id}-${strand.id}`}
                      >
                        <h4
                          id={`curriculum-strand-${unit.id}-${strand.id}`}
                          className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                        >
                          {strand.title}
                        </h4>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {strand.description}
                        </p>
                        <ol className="mt-2 space-y-1">
                          {strand.nodes.map(renderNode)}
                        </ol>
                      </section>
                    ))}
                  </div>
                ) : (
                  <ol className="mt-3 space-y-1">
                    {unit.nodes.map(renderNode)}
                  </ol>
                )}
                {availableNodes.length > 0 &&
                  unit.nodes.some((node) => node.state === 'locked') &&
                  unit.strands.length === 0 && (
                    <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      Complete {availableNodes[0].title} to unlock the next
                      lesson.
                    </p>
                  )}
                {availableNodes.length > 0 && unit.strands.length > 0 && (
                  <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Both strands are required, but you can choose which one to
                    work on first.
                  </p>
                )}
                {availableNodes.length === 0 && completed === 0 && (
                  <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Complete the earlier units to unlock this part of the course.
                  </p>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
