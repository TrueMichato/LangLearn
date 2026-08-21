import { Link } from 'react-router-dom';
import type { LearningPathNode as LearningPathNodeModel } from '../../types/learning-path';

interface Props {
  node: LearningPathNodeModel;
  isLast: boolean;
}

const KIND_DETAILS = {
  letters: { emoji: '🔤', label: 'Letters' },
  vocab: { emoji: '📝', label: 'Vocabulary' },
  grammar: { emoji: '📖', label: 'Grammar' },
} as const;

function nodeClasses(node: LearningPathNodeModel): string {
  const base =
    'group relative flex min-h-[56px] w-full items-center gap-3 rounded-xl px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800';

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

function Body({ node }: { node: LearningPathNodeModel }) {
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
          →
        </span>
      )}
    </>
  );
}

export default function PathNode({ node, isLast }: Props) {
  return (
    <li className="relative">
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute bottom-[-0.5rem] left-[1.84rem] top-[2.75rem] w-px bg-slate-200 dark:bg-slate-700"
        />
      )}
      {node.state === 'locked' ? (
        <button
          type="button"
          disabled
          className={nodeClasses(node)}
          aria-label={`${node.title}, locked`}
        >
          <Body node={node} />
        </button>
      ) : (
        <Link
          to={node.route}
          className={nodeClasses(node)}
          aria-current={node.state === 'available' ? 'step' : undefined}
        >
          <Body node={node} />
        </Link>
      )}
    </li>
  );
}
