import { Link } from 'react-router-dom';
import type { LearningPathCheckpoint } from '../../types/learning-path';

interface Props {
  checkpoint: LearningPathCheckpoint;
  unitTitle: string;
}

const LABELS = {
  grammar: 'Grammar',
  vocab: 'Vocabulary',
} as const;

export default function PathCheckpoint({ checkpoint, unitTitle }: Props) {
  const label = LABELS[checkpoint.kind];

  if (checkpoint.state === 'locked') {
    return (
      <span
        className="inline-flex min-h-[44px] items-center rounded-xl px-3 text-sm text-slate-500 dark:text-slate-400"
        aria-label={`${label} test-out locked until letter practice is complete`}
      >
        {label} test-out locked
      </span>
    );
  }

  if (checkpoint.state === 'completed') {
    return (
      <span className="inline-flex min-h-[44px] items-center rounded-xl px-3 text-sm font-medium text-green-700 dark:text-green-300">
        <span aria-hidden="true">✓&nbsp;</span>
        {label} complete
      </span>
    );
  }

  return (
    <Link
      to={checkpoint.route}
      className="inline-flex min-h-[44px] items-center rounded-xl px-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-200"
      aria-label={`Test out of ${label.toLowerCase()} through ${unitTitle}`}
    >
      Test {label}
    </Link>
  );
}
