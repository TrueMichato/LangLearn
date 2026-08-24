import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PATH_KIND_DETAILS,
  pathNodeAccessibleLabel,
  pathNodeStatus,
} from '../../lib/path-node-presentation';
import { isRTL } from '../../lib/rtl';
import type {
  LearningPath,
  LearningPathNode,
  LearningPathStrand,
  LearningPathUnit,
} from '../../types/learning-path';

interface Props {
  path: LearningPath;
}

type CurriculumScope = 'core' | 'enrichment';
interface ExpansionState {
  key: string;
  unitId: string | null;
}

function isInScope(node: LearningPathNode, scope: CurriculumScope): boolean {
  const requirement = node.requirement ?? 'required';
  return scope === 'core'
    ? requirement === 'required'
    : requirement === 'enrichment';
}

function curriculumUnitsForScope(
  path: LearningPath,
  scope: CurriculumScope,
): LearningPathUnit[] {
  return path.units.filter((unit) =>
    unit.nodes.some((node) => isInScope(node, scope)),
  );
}

function defaultExpandedUnitId(
  path: LearningPath,
  scope: CurriculumScope,
): string | null {
  const units = curriculumUnitsForScope(path, scope);
  if (scope === 'core') {
    const current = units.find((unit) =>
      unit.nodes.some((node) => node.id === path.recommendedNodeId),
    );
    return current?.id ?? units.at(-1)?.id ?? null;
  }
  const unexplored = units.find((unit) =>
    unit.nodes.some(
      (node) => isInScope(node, scope) && node.state !== 'completed',
    ),
  );
  return unexplored?.id ?? units[0]?.id ?? null;
}

function scopedStrands(
  unit: LearningPathUnit,
  scope: CurriculumScope,
): LearningPathStrand[] {
  return unit.strands
    .map((strand) => ({
      ...strand,
      nodes: strand.nodes.filter((node) => isInScope(node, scope)),
    }))
    .filter((strand) => strand.nodes.length > 0);
}

export default function CurriculumOutline({ path }: Props) {
  const rtl = isRTL(path.language);
  const [scope, setScope] = useState<CurriculumScope>('core');
  const units = useMemo(
    () => curriculumUnitsForScope(path, scope),
    [path, scope],
  );
  const suggestedUnitId = defaultExpandedUnitId(path, scope);
  const scopeKey = `${path.language}:${scope}`;
  const [expansion, setExpansion] = useState<ExpansionState>({
    key: scopeKey,
    unitId: suggestedUnitId,
  });
  const expansionIsCurrent =
    expansion.key === scopeKey &&
    (expansion.unitId == null ||
      units.some((unit) => unit.id === expansion.unitId));
  const activeExpandedUnitId = expansionIsCurrent
    ? expansion.unitId
    : suggestedUnitId;
  const enrichmentCompleted = path.enrichmentCompletedCount ?? 0;
  const enrichmentTotal = path.enrichmentTotalCount ?? 0;
  const coreComplete = path.completedCount === path.totalCount;

  function chooseScope(nextScope: CurriculumScope) {
    if (nextScope === scope) return;
    setScope(nextScope);
    setExpansion({
      key: `${path.language}:${nextScope}`,
      unitId: defaultExpandedUnitId(path, nextScope),
    });
  }

  function renderNode(node: LearningPathNode) {
    const recommended = node.id === path.recommendedNodeId;
    const detail = PATH_KIND_DETAILS[node.kind];
    const status = pathNodeStatus(node, recommended);
    const body = (
      <>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-base text-slate-600 dark:bg-slate-700 dark:text-slate-300"
          aria-hidden="true"
        >
          {node.state === 'completed'
            ? '✓'
            : node.state === 'locked'
              ? '🔒'
              : detail.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            {detail.label} · {status}
          </span>
          <span className="block break-words text-sm font-medium text-slate-800 dark:text-slate-100">
            {node.title}
          </span>
        </span>
        {node.state !== 'locked' && (
          <span aria-hidden="true">{rtl ? '←' : '→'}</span>
        )}
      </>
    );

    return (
      <li key={node.id}>
        {node.state === 'locked' ? (
          <div
            className={`flex min-h-[52px] items-center gap-3 rounded-xl px-3 py-2 text-slate-500 dark:text-slate-400 ${
              rtl ? 'flex-row-reverse text-right' : ''
            }`}
          >
            <span className="sr-only">
              {pathNodeAccessibleLabel(node, recommended)}
            </span>
            <span className="contents" aria-hidden="true">
              {body}
            </span>
          </div>
        ) : (
          <Link
            to={node.route}
            aria-current={recommended ? 'step' : undefined}
            aria-label={pathNodeAccessibleLabel(node, recommended)}
            className={`flex min-h-[52px] items-center gap-3 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-200 dark:hover:bg-slate-700/50 ${
              rtl ? 'flex-row-reverse text-right' : ''
            }`}
          >
            {body}
          </Link>
        )}
      </li>
    );
  }

  return (
    <section aria-labelledby="curriculum-outline-heading">
      <div
        className={`mb-4 flex items-end justify-between gap-4 ${
          rtl ? 'flex-row-reverse text-right' : ''
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
            Open one unit at a time to plan without the long scroll.
          </p>
        </div>
      </div>

      <dl className="mb-4 divide-y divide-slate-200/70 border-y border-slate-200/70 text-sm dark:divide-white/10 dark:border-white/10">
        <div className="flex min-h-[44px] items-center justify-between gap-3 py-2">
          <dt className="font-medium text-slate-700 dark:text-slate-200">
            Core path
          </dt>
          <dd className="text-slate-600 dark:text-slate-300">
            {coreComplete
              ? 'Core path complete'
              : `${path.completedCount} of ${path.totalCount} required`}
          </dd>
        </div>
        <div className="flex min-h-[44px] items-center justify-between gap-3 py-2">
          <dt className="font-medium text-slate-700 dark:text-slate-200">
            Enrichment
          </dt>
          <dd className="text-slate-500 dark:text-slate-400">
            {enrichmentTotal > 0
              ? `${enrichmentCompleted} of ${enrichmentTotal} explored`
              : 'Nothing optional yet'}
          </dd>
        </div>
      </dl>

      {enrichmentTotal > 0 && (
        <div
          className="mb-4 grid grid-cols-2 gap-2"
          role="group"
          aria-label="Curriculum view"
        >
          {(['core', 'enrichment'] as const).map((option) => {
            const selected = scope === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => chooseScope(option)}
                className={`min-h-[44px] rounded-xl px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  selected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {option === 'core' ? 'Core path' : 'Enrichment'}
              </button>
            );
          })}
        </div>
      )}

      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        {scope === 'core'
          ? 'Required units unlock in order.'
          : 'Optional lessons are always open and never block your core path.'}
      </p>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-slate-800">
        {units.map((unit, unitIndex) => {
          const nodes = unit.nodes.filter((node) => isInScope(node, scope));
          const completed = nodes.filter(
            (node) => node.state === 'completed',
          ).length;
          const expanded = unit.id === activeExpandedUnitId;
          const current = nodes.some(
            (node) => node.id === path.recommendedNodeId,
          );
          const panelId = `curriculum-${scope}-${unit.id}`;
          const strands = expanded ? scopedStrands(unit, scope) : [];
          const availableNodes = expanded
            ? nodes.filter((node) => node.state === 'available')
            : [];

          return (
            <section
              key={unit.id}
              className={
                unitIndex > 0
                  ? 'border-t border-slate-200/70 dark:border-white/10'
                  : ''
              }
            >
              <h4>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={expanded ? panelId : undefined}
                  onClick={() =>
                    setExpansion({
                      key: scopeKey,
                      unitId: expanded ? null : unit.id,
                    })
                  }
                  className={`flex min-h-[60px] w-full items-center justify-between gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
                    rtl ? 'flex-row-reverse text-right' : ''
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-800 dark:text-slate-100">
                      {unit.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                      {current ? 'Current unit · ' : ''}
                      {completed === nodes.length
                        ? scope === 'core'
                          ? 'Core complete'
                          : 'Explored'
                        : `${completed} of ${nodes.length} ${
                            scope === 'core' ? 'required steps' : 'optional lessons'
                          }`}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-slate-500 transition-transform motion-reduce:transition-none dark:text-slate-400 ${
                      expanded ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>
              </h4>

              {expanded && (
                <div
                  id={panelId}
                  className="border-t border-slate-200/70 px-4 py-3 dark:border-white/10"
                >
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {unit.description}
                  </p>
                  {strands.length > 0 ? (
                    <div className="mt-3 space-y-4">
                      {strands.map((strand) => (
                        <section
                          key={strand.id}
                          aria-labelledby={`curriculum-strand-${scope}-${unit.id}-${strand.id}`}
                        >
                          <h5
                            id={`curriculum-strand-${scope}-${unit.id}-${strand.id}`}
                            className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                          >
                            {strand.title}
                          </h5>
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
                      {nodes.map(renderNode)}
                    </ol>
                  )}
                  {current &&
                    nodes.some((node) => node.state === 'locked') &&
                    strands.length === 0 && (
                      <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        Finish the current step to unlock the next core lesson.
                      </p>
                    )}
                  {scope === 'core' &&
                    availableNodes.length > 1 &&
                    strands.length > 1 && (
                      <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        These strands are both required, but either can come first.
                      </p>
                    )}
                  {scope === 'core' &&
                    availableNodes.length === 0 &&
                    completed === 0 && (
                      <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        Complete the earlier units to unlock this part of the course.
                      </p>
                    )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
