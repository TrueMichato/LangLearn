import { useEffect, useRef, useState } from 'react';
import type { LearningPath as LearningPathModel } from '../../types/learning-path';
import { isRTL } from '../../lib/rtl';
import PathNode from './PathNode';
import PathTestOutPanel from './PathTestOutPanel';

interface Props {
  path: LearningPathModel;
  focusCurrent?: boolean;
}

export default function LearningPath({ path, focusCurrent = false }: Props) {
  const complete = path.completedCount === path.totalCount;
  const rtl = isRTL(path.language);
  const sectionRef = useRef<HTMLElement>(null);
  const [showFuture, setShowFuture] = useState(false);
  const currentUnitIndex = path.units.findIndex((unit) =>
    unit.nodes.some((node) => node.state === 'available'),
  );
  const currentUnitId = path.units[currentUnitIndex]?.id;
  const visibleUnits =
    currentUnitIndex >= 0
      ? path.units.slice(0, currentUnitIndex + 1)
      : path.units;
  const futureUnits =
    currentUnitIndex >= 0
      ? path.units.slice(currentUnitIndex + 1)
      : [];
  const testOutOptions = path.testOutOptions.filter(
    (option) => option.state === 'available',
  );

  useEffect(() => {
    if (!focusCurrent) return;
    const frame = window.requestAnimationFrame(() => {
      const current = sectionRef.current?.querySelector<HTMLElement>(
        '[aria-current="step"]',
      );
      if (!current) return;
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      current.focus({ preventScroll: true });
      current.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'center',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusCurrent, path.completedCount, path.language]);

  function renderUnit(
    unit: LearningPathModel['units'][number],
    unitIndex: number,
  ) {
    return (
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
              rtl={rtl}
            />
          ))}
        </ol>
        {unit.id === currentUnitId && testOutOptions.length > 0 && (
          <PathTestOutPanel
            key={`${path.language}/${unit.id}`}
            options={testOutOptions}
            rtl={rtl}
          />
        )}
      </section>
    );
  }

  return (
    <section ref={sectionRef} aria-labelledby="learning-path-heading">
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
        {visibleUnits.map(renderUnit)}
        {futureUnits.length > 0 && (
          <div
            id={`future-path-units-${path.language}`}
            hidden={!showFuture}
          >
            {futureUnits.map((unit, index) =>
              renderUnit(unit, visibleUnits.length + index),
            )}
          </div>
        )}
        {futureUnits.length > 0 && (
          <div className="border-t border-slate-200/70 p-3 dark:border-white/10">
            <button
              type="button"
              onClick={() => setShowFuture((visible) => !visible)}
              aria-expanded={showFuture}
              aria-controls={`future-path-units-${path.language}`}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-700/50"
            >
              {showFuture
                ? 'Hide future units'
                : `See the rest of your route (${futureUnits.length} ${
                    futureUnits.length === 1 ? 'unit' : 'units'
                  })`}
              <span aria-hidden="true">{showFuture ? '↑' : '↓'}</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
