import { Link } from 'react-router-dom';
import {
  PATH_KIND_DETAILS,
  pathNodeAccessibleLabel,
  pathNodeStatus,
} from '../../lib/path-node-presentation';
import type { LearningPathNode as LearningPathNodeModel } from '../../types/learning-path';

interface Props {
  node: LearningPathNodeModel;
  recommended?: boolean;
  layout?: 'winding' | 'branch';
  isLast: boolean;
  position: number;
  nextPosition?: number;
  rtl?: boolean;
}

function nodeClasses(
  node: LearningPathNodeModel,
  recommended: boolean,
  layout: 'winding' | 'branch',
  rtl: boolean,
): string {
  const base = `group relative z-10 flex scroll-mb-[var(--shell-bottom-clearance)] rounded-xl px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 ${
    layout === 'branch'
      ? 'min-h-[88px] w-full flex-col items-center justify-center gap-1 text-center'
      : `min-h-[56px] items-center gap-3 text-left ${rtl ? 'flex-row-reverse' : ''}`
  }`;

  if (recommended) {
    return `${base} bg-indigo-50 text-indigo-950 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-100 dark:hover:bg-indigo-500/15 press-feedback`;
  }
  if (node.requirement === 'enrichment') {
    return `${base} text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/40 press-feedback`;
  }
  if (node.state === 'available') {
    return `${base} bg-slate-50 text-slate-800 hover:bg-slate-100 dark:bg-slate-700/50 dark:text-slate-100 dark:hover:bg-slate-700 press-feedback`;
  }
  if (node.state === 'completed') {
    return `${base} text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50 press-feedback`;
  }
  return `${base} cursor-not-allowed text-slate-500 dark:text-slate-400`;
}

function Marker({
  node,
  recommended,
  compact = false,
}: {
  node: LearningPathNodeModel;
  recommended: boolean;
  compact?: boolean;
}) {
  const detail = PATH_KIND_DETAILS[node.kind];
  const markerClasses =
    recommended
      ? 'bg-indigo-600 text-white shadow-sm'
      : node.requirement === 'enrichment' && node.state === 'available'
        ? 'bg-transparent text-slate-500 ring-1 ring-inset ring-slate-200 dark:text-slate-400 dark:ring-slate-600'
      : node.state === 'available'
        ? 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600'
      : node.state === 'completed'
        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';

  return (
    <span
      className={`relative z-10 flex shrink-0 items-center justify-center rounded-full ${
        compact ? 'h-10 w-10' : 'h-11 w-11'
      } ${markerClasses}`}
      aria-hidden="true"
    >
      {node.state === 'completed' ? '✓' : node.state === 'locked' ? '🔒' : detail.emoji}
    </span>
  );
}

function Body({
  node,
  recommended,
  layout,
  rtl,
}: {
  node: LearningPathNodeModel;
  recommended: boolean;
  layout: 'winding' | 'branch';
  rtl: boolean;
}) {
  const detail = PATH_KIND_DETAILS[node.kind];
  const status = pathNodeStatus(node, recommended);
  const labelClasses =
    recommended
      ? 'text-indigo-700 dark:text-indigo-300'
      : node.state === 'available'
        ? 'text-slate-600 dark:text-slate-300'
      : 'text-slate-500 dark:text-slate-400';
  const titleClasses =
    recommended
      ? 'text-indigo-950 dark:text-indigo-100'
      : 'text-slate-800 dark:text-slate-100';
  const arrowClasses =
    recommended
      ? 'text-indigo-600 dark:text-indigo-300'
      : 'text-slate-500 dark:text-slate-400';
  return (
    <>
      <Marker
        node={node}
        recommended={recommended}
        compact={layout === 'branch'}
      />
      <span className="min-w-0 flex-1">
        <span className={`block text-xs font-medium ${labelClasses}`}>
          {detail.label} · {status}
        </span>
        <span className={`mt-0.5 block text-sm font-semibold leading-snug ${titleClasses}`}>
          {node.title}
        </span>
      </span>
      {layout === 'winding' && node.state !== 'locked' && (
        <span className={`shrink-0 ${arrowClasses}`} aria-hidden="true">
          {rtl ? '←' : '→'}
        </span>
      )}
    </>
  );
}

const POSITION_CLASSES = ['mr-14', 'mx-7', 'ml-14'] as const;
const POSITION_OFFSET = [0, 28, 56] as const;

export default function PathNode({
  node,
  recommended = false,
  layout = 'winding',
  isLast,
  position,
  nextPosition,
  rtl = false,
}: Props) {
  const visualPosition = rtl ? 2 - position : position;
  const visualNextPosition =
    nextPosition == null ? visualPosition : rtl ? 2 - nextPosition : nextPosition;
  const positionClass =
    layout === 'branch'
      ? 'w-full'
      : (POSITION_CLASSES[visualPosition] ?? POSITION_CLASSES[0]);
  const startX = (POSITION_OFFSET[visualPosition] ?? 0) + 22;
  const endX =
    (POSITION_OFFSET[visualNextPosition] ??
      POSITION_OFFSET[visualPosition] ??
      0) +
    22;

  return (
    <li className="relative">
      {layout === 'branch' && !isLast && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-2 left-1/2 top-[5rem] z-0 w-px bg-slate-200 dark:bg-slate-700"
        />
      )}
      {layout === 'winding' && !isLast && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-[2.75rem] z-0 h-8 w-full overflow-visible text-slate-200 dark:text-slate-700"
          preserveAspectRatio="none"
        >
          <path
            d={`M ${startX} 0 C ${startX} 16, ${endX} 16, ${endX} 32`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      )}
      {node.state === 'locked' ? (
        <div
          className={`${nodeClasses(node, recommended, layout, rtl)} ${positionClass}`}
        >
          <span className="sr-only">
            {pathNodeAccessibleLabel(node, recommended)}
          </span>
          <span className="contents" aria-hidden="true">
            <Body
              node={node}
              recommended={recommended}
              layout={layout}
              rtl={rtl}
            />
          </span>
        </div>
      ) : (
        <Link
          to={node.route}
          className={`${nodeClasses(node, recommended, layout, rtl)} ${positionClass}`}
          aria-current={recommended ? 'step' : undefined}
          aria-label={pathNodeAccessibleLabel(node, recommended)}
        >
          <Body
            node={node}
            recommended={recommended}
            layout={layout}
            rtl={rtl}
          />
        </Link>
      )}
    </li>
  );
}
