import { Link } from 'react-router-dom';
import type { LearningPathNode as LearningPathNodeModel } from '../../types/learning-path';

interface Props {
  node: LearningPathNodeModel;
  isLast: boolean;
  position: number;
  nextPosition?: number;
  rtl?: boolean;
}

const KIND_DETAILS = {
  letters: { emoji: '🔤', label: 'Letters' },
  vocab: { emoji: '📝', label: 'Vocabulary' },
  grammar: { emoji: '📖', label: 'Grammar' },
} as const;

function nodeClasses(node: LearningPathNodeModel, rtl: boolean): string {
  const base =
    `group relative z-10 flex min-h-[56px] items-center gap-3 rounded-xl px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 ${rtl ? 'flex-row-reverse' : ''}`;

  if (node.state === 'available') {
    return `${base} bg-indigo-50 text-indigo-950 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-100 dark:hover:bg-indigo-500/15 press-feedback`;
  }
  if (node.state === 'completed') {
    return `${base} text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50 press-feedback`;
  }
  return `${base} cursor-not-allowed text-slate-500 dark:text-slate-400`;
}

function Marker({ node }: { node: LearningPathNodeModel }) {
  const detail = KIND_DETAILS[node.kind];
  const markerClasses =
    node.state === 'available'
      ? 'bg-indigo-600 text-white shadow-sm'
      : node.state === 'completed'
        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';

  return (
    <span
      className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${markerClasses}`}
      aria-hidden="true"
    >
      {node.state === 'completed' ? '✓' : node.state === 'locked' ? '🔒' : detail.emoji}
    </span>
  );
}

function Body({ node, rtl }: { node: LearningPathNodeModel; rtl: boolean }) {
  const detail = KIND_DETAILS[node.kind];
  const labelClasses =
    node.state === 'available'
      ? 'text-indigo-700 dark:text-indigo-300'
      : 'text-slate-500 dark:text-slate-400';
  const titleClasses =
    node.state === 'available'
      ? 'text-indigo-950 dark:text-indigo-100'
      : 'text-slate-800 dark:text-slate-100';
  const arrowClasses =
    node.state === 'available'
      ? 'text-indigo-600 dark:text-indigo-300'
      : 'text-slate-500 dark:text-slate-400';
  return (
    <>
      <Marker node={node} />
      <span className="min-w-0 flex-1">
        <span className={`block text-xs font-medium ${labelClasses}`}>
          {detail.label}
          {node.state === 'available' ? ' · Up next' : ''}
        </span>
        <span className={`mt-0.5 block text-sm font-semibold leading-snug ${titleClasses}`}>
          {node.title}
        </span>
      </span>
      {node.state !== 'locked' && (
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
  isLast,
  position,
  nextPosition,
  rtl = false,
}: Props) {
  const visualPosition = rtl ? 2 - position : position;
  const visualNextPosition =
    nextPosition == null ? visualPosition : rtl ? 2 - nextPosition : nextPosition;
  const positionClass =
    POSITION_CLASSES[visualPosition] ?? POSITION_CLASSES[0];
  const startX = (POSITION_OFFSET[visualPosition] ?? 0) + 22;
  const endX =
    (POSITION_OFFSET[visualNextPosition] ??
      POSITION_OFFSET[visualPosition] ??
      0) +
    22;

  return (
    <li className="relative">
      {!isLast && (
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
        <button
          type="button"
          disabled
          className={`${nodeClasses(node, rtl)} ${positionClass}`}
          aria-label={`${node.title}, locked`}
        >
          <Body node={node} rtl={rtl} />
        </button>
      ) : (
        <Link
          to={node.route}
          className={`${nodeClasses(node, rtl)} ${positionClass}`}
          aria-current={node.state === 'available' ? 'step' : undefined}
        >
          <Body node={node} rtl={rtl} />
        </Link>
      )}
    </li>
  );
}
