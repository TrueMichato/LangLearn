import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import type { LearningPath as LearningPathModel } from '../../types/learning-path';
import { isRTL } from '../../lib/rtl';
import { ROUTES } from '../../lib/routes';
import { shouldCompactContinuationUnit } from '../../lib/path-unit-presentation';
import PathNode from './PathNode';
import PathTestOutPanel from './PathTestOutPanel';

interface Props {
  path: LearningPathModel;
  focusCurrent?: boolean;
}

type PathView = 'current' | 'full';

export default function LearningPath({ path, focusCurrent = false }: Props) {
  const complete = path.completedCount === path.totalCount;
  const rtl = isRTL(path.language);
  const sectionRef = useRef<HTMLElement>(null);
  const landmarkUnitRef = useRef<HTMLElement>(null);
  const landmarkHeadingRef = useRef<HTMLHeadingElement>(null);
  const completionSummaryRef = useRef<HTMLDivElement>(null);
  const stickyToolbarRef = useRef<HTMLDivElement>(null);
  const fullPathJumpRef = useRef<HTMLButtonElement>(null);
  const phaseHeadingRefs = useRef(new Map<string, HTMLHeadingElement>());
  const anchorTopBeforeExpansion = useRef<number | null>(null);
  const navigationFrameRef = useRef<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [viewState, setViewState] = useState<{
    language: string;
    view: PathView;
  }>({
    language: path.language,
    view: 'current',
  });
  const view =
    viewState.language === path.language ? viewState.view : 'current';
  const showFullPath = view === 'full';
  const requiredUnits = path.units.filter((unit) =>
    unit.nodes.some(
      (node) => (node.requirement ?? 'required') === 'required',
    ),
  );
  const phases =
    path.phases && path.phases.length > 0
      ? path.phases
      : [
          {
            id: 'guided-path',
            title: 'Guided path',
            description:
              'Follow the curriculum from foundations to broader practice.',
          },
        ];
  const phaseForUnit = (unit: LearningPathModel['units'][number]) =>
    unit.phase ?? phases[0];
  const currentUnit = path.units.find((unit) =>
    unit.nodes.some((node) => node.id === path.recommendedNodeId),
  );
  const currentUnitIndex = requiredUnits.findIndex(
    (unit) => unit.id === currentUnit?.id,
  );
  const currentUnitId = currentUnit?.id;
  const landmarkUnit = currentUnit ?? (complete ? requiredUnits.at(-1) : undefined);
  const landmarkUnitId = landmarkUnit?.id;
  const landmarkPhase = landmarkUnit ? phaseForUnit(landmarkUnit) : phases[0];
  const landmarkPhaseIndex = Math.max(
    0,
    phases.findIndex((phase) => phase.id === landmarkPhase.id),
  );
  const landmarkRequiredUnitIndex = Math.max(
    0,
    requiredUnits.findIndex((unit) => unit.id === landmarkUnitId),
  );
  const previousUnits =
    currentUnitIndex > 0
      ? requiredUnits.slice(0, currentUnitIndex)
      : complete
        ? requiredUnits
        : [];
  const visibleUnits = showFullPath
    ? requiredUnits
    : currentUnit
      ? [currentUnit]
      : [];
  const futureUnits =
    currentUnitIndex >= 0
      ? requiredUnits.slice(currentUnitIndex + 1)
      : [];
  const currentRequiredNodes =
    currentUnit?.nodes.filter(
      (node) => (node.requirement ?? 'required') === 'required',
    ) ?? [];
  const currentUnitCompleted =
    currentRequiredNodes.filter((node) => node.state === 'completed').length;
  const testOutOptions = path.testOutOptions.filter(
    (option) => option.state === 'available',
  );
  const completedAheadCount = path.completedAheadCount;
  const showAheadAcknowledgment = !complete && completedAheadCount > 0;
  const optionalPracticeTotal = path.enrichmentTotalCount ?? 0;
  const aheadArrow = rtl ? '←' : '→';
  const landmarkName =
    landmarkUnit?.title ?? (complete ? 'the latest unit' : 'the current unit');
  const aheadMessage =
    completedAheadCount === 1
      ? "You've already finished 1 lesson ahead of this step."
      : `You've already finished ${completedAheadCount} lessons ahead of this step.`;

  useEffect(() => {
    if (!focusCurrent) return;
    const frame = window.requestAnimationFrame(() => {
      const current = sectionRef.current?.querySelector<HTMLElement>(
        '[aria-current="step"]',
      ) ?? sectionRef.current?.querySelector<HTMLElement>(
        '[data-path-focus-fallback]',
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

  useLayoutEffect(() => {
    if (!showFullPath || anchorTopBeforeExpansion.current == null) return;
    const landmark = landmarkUnitRef.current;
    if (!landmark) {
      anchorTopBeforeExpansion.current = null;
      return;
    }
    const minimumVisibleTop =
      (stickyToolbarRef.current?.getBoundingClientRect().bottom ?? 0) + 12;
    const desiredTop = Math.max(
      anchorTopBeforeExpansion.current,
      minimumVisibleTop,
    );
    const topDelta = landmark.getBoundingClientRect().top - desiredTop;
    window.scrollBy({ top: topDelta, behavior: 'auto' });
    anchorTopBeforeExpansion.current = null;
    fullPathJumpRef.current?.focus({ preventScroll: true });
  }, [landmarkUnitId, path.language, showFullPath]);

  useEffect(
    () => () => {
      if (navigationFrameRef.current != null) {
        window.cancelAnimationFrame(navigationFrameRef.current);
      }
    },
    [],
  );

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function showFullPathView() {
    const anchor = landmarkUnitRef.current ?? completionSummaryRef.current;
    anchorTopBeforeExpansion.current =
      anchor?.getBoundingClientRect().top ?? null;
    setViewState({ language: path.language, view: 'full' });
    setAnnouncement(
      `Full path shown. ${requiredUnits.length} units. ${
        landmarkName
      } kept in view.`,
    );
  }

  function showCurrentView() {
    setViewState({ language: path.language, view: 'current' });
    setAnnouncement(complete ? 'Path summary shown.' : 'Current unit shown.');
    navigationFrameRef.current = window.requestAnimationFrame(() => {
      const target = complete
        ? sectionRef.current?.querySelector<HTMLElement>(
            '[data-path-focus-fallback]',
          )
        : landmarkHeadingRef.current;
      if (!target) return;
      target.focus({ preventScroll: true });
      target.scrollIntoView({
        behavior: reducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  }

  function jumpToLandmark() {
    const target = landmarkHeadingRef.current;
    if (!target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({
      behavior: reducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
    setAnnouncement(
      `Moved to ${landmarkName}.`,
    );
  }

  function jumpToPhase(phaseId: string) {
    const phase = phases.find((item) => item.id === phaseId);
    const target = phaseHeadingRefs.current.get(phaseId);
    if (!phase || !target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({
      behavior: reducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
    setAnnouncement(`Moved to ${phase.title}.`);
  }

  function renderUnit(
    unit: LearningPathModel['units'][number],
    unitIndex: number,
  ) {
    const UnitHeading = showFullPath ? 'h5' : 'h4';
    const StrandHeading = showFullPath ? 'h6' : 'h5';
    const requiredNodes = unit.nodes.filter(
      (node) => (node.requirement ?? 'required') === 'required',
    );
    const recommendedNode = unit.nodes.find(
      (node) => node.id === path.recommendedNodeId,
    );
    const hasLockedSteps = requiredNodes.some(
      (node) => node.state === 'locked',
    );
    const unitComplete = requiredNodes.every(
      (node) => node.state === 'completed',
    );
    const completedRequired = requiredNodes.filter(
      (node) => node.state === 'completed',
    ).length;
    const isLandmark = unit.id === landmarkUnitId;
    const compactContinuation = shouldCompactContinuationUnit(
      showFullPath,
      unit.presentation,
      isLandmark,
    );
    const phase = phaseForUnit(unit);
    const previousUnit = requiredUnits[unitIndex - 1];
    const startsPhase =
      unitIndex === 0 ||
      (previousUnit && phaseForUnit(previousUnit).id !== phase.id);
    const phaseIndex = Math.max(
      0,
      phases.findIndex((item) => item.id === phase.id),
    );
    const lessonCount = unit.nodes.filter(
      (node) => node.kind === 'grammar' || node.kind === 'vocab',
    ).length;
    const practiceCount = unit.nodes.length - lessonCount;
    const continuationSummary = [
      lessonCount > 0
        ? `${lessonCount} ${lessonCount === 1 ? 'lesson' : 'lessons'}`
        : null,
      practiceCount > 0
        ? `${practiceCount} ${
            practiceCount === 1 ? 'practice session' : 'practice sessions'
          }`
        : null,
    ]
      .filter(Boolean)
      .join(' · ');
    const parallel = unit.strands.length > 0;
    const requiredStrands = unit.strands.filter((strand) =>
      strand.nodes.some(
        (node) => (node.requirement ?? 'required') === 'required',
      ),
    );
    const visualFork = unit.strands.length === 2;
    const renderNodes = (
      nodes: typeof unit.nodes,
      layout: 'winding' | 'branch' = 'winding',
    ) => (
      <ol className="mt-3 space-y-2">
        {nodes.map((node, index) => (
          <PathNode
            key={node.id}
            node={node}
            recommended={node.id === path.recommendedNodeId}
            layout={layout}
            isLast={index === nodes.length - 1}
            position={index % 3}
            nextPosition={
              index < nodes.length - 1 ? (index + 1) % 3 : undefined
            }
            rtl={rtl}
          />
        ))}
      </ol>
    );
    return (
      <Fragment key={unit.id}>
        {showFullPath && startsPhase && (
          <div
            data-path-phase={phase.id}
            className={`bg-slate-50 px-4 py-4 dark:bg-slate-900/60 ${
              unitIndex > 0
                ? 'border-t border-slate-200/70 dark:border-white/10'
                : ''
            }`}
          >
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Phase {phaseIndex + 1} of {phases.length}
            </p>
            <h4
              ref={(element) => {
                if (element) {
                  phaseHeadingRefs.current.set(phase.id, element);
                } else {
                  phaseHeadingRefs.current.delete(phase.id);
                }
              }}
              id={`path-phase-${phase.id}`}
              tabIndex={-1}
              className="scroll-mt-[calc(var(--shell-header-height)+8.5rem)] text-base font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-100"
            >
              {phase.title}
            </h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {phase.description}
            </p>
          </div>
        )}
      <section
        key={unit.id}
        ref={isLandmark ? landmarkUnitRef : undefined}
        data-path-landmark={isLandmark ? true : undefined}
        data-path-presentation={unit.presentation ?? 'standard'}
        data-path-density={compactContinuation ? 'compact' : 'standard'}
        aria-labelledby={`path-unit-${unit.id}`}
        className={`${compactContinuation ? 'px-4 py-3' : 'p-4'} ${
          unitIndex > 0 && !startsPhase
            ? 'border-t border-slate-200/70 dark:border-white/10'
            : ''
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <UnitHeading
            ref={isLandmark ? landmarkHeadingRef : undefined}
            id={`path-unit-${unit.id}`}
            tabIndex={isLandmark ? -1 : undefined}
            className={`font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-100 ${
              showFullPath
                ? 'scroll-mt-[calc(var(--shell-header-height)+8.5rem)]'
                : 'scroll-mt-[calc(var(--shell-header-height)+4rem)]'
            } ${
              compactContinuation ? 'text-sm' : 'text-base'
            }`}
          >
            {unit.title}
          </UnitHeading>
          {showFullPath && isLandmark && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {complete ? 'Latest unit' : 'Current unit'}
            </span>
          )}
        </div>
        <p
          className={`mt-1 text-slate-500 dark:text-slate-400 ${
            compactContinuation ? 'text-xs' : 'text-sm'
          }`}
        >
          {compactContinuation ? continuationSummary : unit.description}
        </p>
        {parallel ? (
          <div
            className={compactContinuation ? 'mt-2' : 'mt-4'}
            data-path-branch-density={
              compactContinuation ? 'compact' : 'standard'
            }
          >
            {!compactContinuation && (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {requiredStrands.length > 1
                  ? 'Both tracks are open. Finish both to unlock the next unit.'
                  : 'Follow the main strand, and explore the optional strand whenever you like.'}
              </p>
            )}
            <p
              className={`text-xs text-slate-500 dark:text-slate-400 ${
                compactContinuation ? '' : 'mt-1'
              }`}
            >
              {completedRequired} of {requiredNodes.length} complete
            </p>
            {visualFork && !compactContinuation && (
              <svg
                viewBox="0 0 100 24"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="mt-3 h-6 w-full text-slate-200 dark:text-slate-700"
              >
                <path
                  d="M 50 0 V 6 C 50 14, 25 12, 25 24 M 50 6 C 50 14, 75 12, 75 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            )}
            <div
              className={`grid items-stretch gap-3 ${
                visualFork
                  ? `grid-cols-2 ${compactContinuation ? 'mt-2' : ''}`
                  : `${compactContinuation ? 'mt-2' : 'mt-3'} grid-cols-1`
              }`}
              style={{ direction: rtl ? 'rtl' : 'ltr' }}
              role="group"
              aria-label="Parallel learning paths"
            >
              {unit.strands.map((strand) => (
                <section
                  key={strand.id}
                  aria-labelledby={`path-strand-${unit.id}-${strand.id}`}
                  className="flex min-w-0 flex-col"
                  dir="ltr"
                >
                  <StrandHeading
                    id={`path-strand-${unit.id}-${strand.id}`}
                    className={`text-center font-semibold leading-snug text-slate-800 dark:text-slate-100 ${
                      compactContinuation ? 'text-xs' : 'text-sm'
                    }`}
                  >
                    {strand.title}
                  </StrandHeading>
                  <p
                    className={`text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400 ${
                      compactContinuation
                        ? 'mt-0.5 min-h-10'
                        : 'mt-1 min-h-14'
                    }`}
                  >
                    {strand.description}
                  </p>
                  {renderNodes(strand.nodes, 'branch')}
                  <span
                    aria-hidden="true"
                    className={`mx-auto w-px flex-1 bg-slate-200 dark:bg-slate-700 ${
                      compactContinuation ? 'min-h-2' : 'min-h-4'
                    }`}
                  />
                </section>
              ))}
            </div>
            {visualFork && !compactContinuation && (
              <svg
                viewBox="0 0 100 24"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="h-6 w-full text-slate-200 dark:text-slate-700"
              >
                <path
                  d="M 25 0 C 25 12, 50 10, 50 18 M 75 0 C 75 12, 50 10, 50 18 V 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            )}
            {!compactContinuation &&
              unit.id === currentUnitId &&
              !unitComplete && (
                <p className="mt-1 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Both tracks rejoin before the next unit.
                </p>
              )}
          </div>
        ) : (
          renderNodes(unit.nodes)
        )}
        {unit.id === currentUnitId && testOutOptions.length > 0 && (
          <PathTestOutPanel
            key={`${path.language}/${unit.id}`}
            options={testOutOptions}
            language={path.language}
            rtl={rtl}
          />
        )}
        {unit.id === currentUnitId &&
          !parallel &&
          recommendedNode &&
          hasLockedSteps && (
          <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Complete {recommendedNode.title} to unlock the next lesson.
          </p>
        )}
      </section>
      </Fragment>
    );
  }

  return (
    <section ref={sectionRef} aria-labelledby="learning-path-heading">
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
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
              ? 'Every path step is complete. Optional practice stays open.'
              : `${landmarkPhase.title} · ${currentUnit?.title ?? 'Current unit'} · ${currentUnitCompleted} of ${
                  currentRequiredNodes.length
                } steps complete`}
          </p>
        </div>
        {!showFullPath && (
          <button
            type="button"
            aria-controls="learning-path-units"
            aria-label="Show full path to revisit completed units and preview what is ahead"
            onClick={showFullPathView}
            className="min-h-[44px] shrink-0 rounded-xl px-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            Full path
          </button>
        )}
      </div>

      {showFullPath && (
        <div
          ref={stickyToolbarRef}
          className="sticky top-[var(--shell-header-height)] z-30 -mx-1 mb-3 grid min-h-[60px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50 p-2 shadow-sm dark:border-white/10 dark:bg-slate-900"
          role="group"
          aria-label="Full path controls"
        >
          <span className="min-w-0 px-1">
            <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
              {landmarkPhase.title}
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              Phase {landmarkPhaseIndex + 1} of {phases.length} · Unit{' '}
              {landmarkRequiredUnitIndex + 1} of {requiredUnits.length}
            </span>
          </span>
          <span className={`flex shrink-0 gap-1 ${rtl ? 'flex-row-reverse' : ''}`}>
            <button
              ref={fullPathJumpRef}
              type="button"
              onClick={jumpToLandmark}
              className="min-h-[44px] rounded-lg px-2 text-xs font-semibold text-slate-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Jump to {complete ? 'latest' : 'current'}
            </button>
            <button
              type="button"
              aria-controls="learning-path-units"
              onClick={showCurrentView}
              className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {complete ? 'Show summary' : 'Current only'}
            </button>
          </span>
          {phases.length > 1 && (
            <label className="col-span-2 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              Jump to phase
              <select
                defaultValue=""
                onChange={(event) => {
                  jumpToPhase(event.currentTarget.value);
                  event.currentTarget.value = '';
                }}
                className="min-h-[44px] min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="" disabled>
                  Choose a phase
                </option>
                {phases.map((phase, index) => (
                  <option key={phase.id} value={phase.id}>
                    {index + 1}. {phase.title}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      {previousUnits.length > 0 && !complete && !showFullPath && (
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          <span
            className="mr-2 text-green-600 dark:text-green-400"
            aria-hidden="true"
          >
            ✓
          </span>
          {previousUnits.length}{' '}
          {previousUnits.length === 1 ? 'earlier unit' : 'earlier units'} complete
        </p>
      )}
      <div
        id="learning-path-units"
        className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-slate-800"
      >
        {complete && !showFullPath ? (
          <div
            ref={completionSummaryRef}
            className="p-4"
            data-path-focus-fallback
            tabIndex={-1}
          >
            <h4 className="font-semibold text-slate-800 dark:text-slate-100">
              Path complete
            </h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              You can revisit any lesson or explore optional practice at
              your own pace.
            </p>
          </div>
        ) : (
          <>
            {visibleUnits.map(renderUnit)}
            {showFullPath && (
              <div className="border-t border-slate-200/70 px-4 py-4 dark:border-white/10">
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  That&apos;s the whole path for now.
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {complete
                    ? 'Every lesson stays open whenever you want to revisit it.'
                    : `Jump back to ${landmarkName} when you're ready to keep learning.`}
                </p>
                <button
                  type="button"
                  onClick={jumpToLandmark}
                  className="mt-2 min-h-[44px] rounded-xl px-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                >
                  Back to {complete ? 'latest' : 'current'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {((!showFullPath &&
        (futureUnits.length > 0 || showAheadAcknowledgment)) ||
        optionalPracticeTotal > 0) && (
        <div className="mt-4 border-t border-slate-200/70 pt-4 dark:border-white/10">
          {futureUnits.length > 0 && !showFullPath && (
            <>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Coming next
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {futureUnits
                  .slice(0, 2)
                  .map((unit) => unit.title)
                  .join(' · ')}
                {futureUnits.length > 2 ? ' · and more' : ''}
              </p>
            </>
          )}
          {showAheadAcknowledgment && !showFullPath && (
            <p
              className={`text-sm text-slate-500 dark:text-slate-400 ${
                futureUnits.length > 0 && !showFullPath ? 'mt-2' : ''
              }`}
            >
              {aheadMessage}
            </p>
          )}
          {optionalPracticeTotal > 0 && (
            <Link
              to={ROUTES.learnCurriculum}
              className={`mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-xl px-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:bg-indigo-950/40 ${
                rtl ? 'flex-row-reverse' : ''
              }`}
            >
              Explore optional practice
              <span aria-hidden="true">{aheadArrow}</span>
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
