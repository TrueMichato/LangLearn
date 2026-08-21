import type { LearningPath as LearningPathModel } from '../../types/learning-path';
import PathNode from './PathNode';

interface Props {
  path: LearningPathModel;
}

export default function LearningPath({ path }: Props) {
  const complete = path.completedCount === path.totalCount;

  return (
    <section aria-labelledby="learning-path-heading">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h3
            id="learning-path-heading"
            className="text-base font-semibold text-slate-800 dark:text-slate-100"
          >
            Your learning path
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {complete
              ? 'You completed every step on this path.'
              : 'One clear next step, with everything else waiting patiently.'}
          </p>
        </div>
        <p className="shrink-0 text-sm font-medium text-slate-600 dark:text-slate-300">
          {path.completedCount}/{path.totalCount}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-slate-800">
        {path.units.map((unit, unitIndex) => (
          <section
            key={unit.id}
            aria-labelledby={`path-unit-${unit.id}`}
            className={`p-4 ${
              unitIndex > 0
                ? 'border-t border-slate-200/70 dark:border-white/10'
                : ''
            }`}
          >
            <h4
              id={`path-unit-${unit.id}`}
              className="text-base font-semibold text-slate-800 dark:text-slate-100"
            >
              {unit.title}
            </h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {unit.description}
            </p>
            <ol className="mt-3 space-y-2">
              {unit.nodes.map((node, index) => (
                <PathNode
                  key={node.id}
                  node={node}
                  isLast={index === unit.nodes.length - 1}
                  position={index % 3}
                  nextPosition={
                    index < unit.nodes.length - 1 ? (index + 1) % 3 : undefined
                  }
                />
              ))}
            </ol>
          </section>
        ))}
      </div>
    </section>
  );
}
