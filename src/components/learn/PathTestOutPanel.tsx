import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  LearningPathCheckpoint,
  LearningPathLessonKind,
} from '../../types/learning-path';

interface Props {
  options: LearningPathCheckpoint[];
  rtl?: boolean;
}

const TRACK_LABELS: Record<LearningPathLessonKind, string> = {
  grammar: 'Grammar',
  vocab: 'Vocabulary',
};

function scopePresets(
  options: LearningPathCheckpoint[],
): LearningPathCheckpoint[] {
  if (options.length <= 3) return options;
  const middleIndex = Math.min(2, options.length - 2);
  return [options[0], options[middleIndex], options[options.length - 1]];
}

export default function PathTestOutPanel({ options, rtl = false }: Props) {
  const tracks = useMemo(
    () => [...new Set(options.map((option) => option.kind))],
    [options],
  );
  const [expanded, setExpanded] = useState(false);
  const [track, setTrack] = useState<LearningPathLessonKind>(
    tracks[0] ?? 'vocab',
  );
  const trackOptions = options.filter((option) => option.kind === track);
  const presets = scopePresets(trackOptions);
  const [targetId, setTargetId] = useState(
    () => trackOptions[0]?.lessonId ?? '',
  );
  const selected =
    trackOptions.find((option) => option.lessonId === targetId) ??
    trackOptions[0];

  function chooseTrack(nextTrack: LearningPathLessonKind) {
    setTrack(nextTrack);
    const firstOption = options.find((option) => option.kind === nextTrack);
    setTargetId(firstOption?.lessonId ?? '');
  }

  return (
    <div className="mt-4 border-t border-slate-200/70 pt-3 dark:border-white/10">
      <button
        type="button"
        onClick={() => setExpanded((visible) => !visible)}
        aria-expanded={expanded}
        className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-200 dark:hover:bg-slate-700/50 ${
          rtl ? 'flex-row-reverse text-right' : 'text-left'
        }`}
      >
        <span>
          <span aria-hidden="true">🧭&nbsp;</span>
          Check what you already know
        </span>
        <span aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && selected && (
        <div className="px-3 pb-2 pt-3" dir="ltr">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Choose a track and how far you want to check. Passing marks that
            range complete; if you do not pass, nothing changes.
          </p>

          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              What would you like to check?
            </p>
            <div className="mt-2 flex gap-2">
              {tracks.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => chooseTrack(kind)}
                  aria-pressed={track === kind}
                  className={`min-h-[44px] flex-1 rounded-xl px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    track === kind
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {TRACK_LABELS[kind]}
                </button>
              ))}
            </div>
          </div>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Pick a comfortable scope
            </legend>
            <div className="mt-2 space-y-2">
              {presets.map((option, index) => {
                const active = selected.lessonId === option.lessonId;
                const label =
                  index === 0
                    ? 'Start small'
                    : index === presets.length - 1
                      ? 'Everything remaining'
                      : 'Go a little further';
                return (
                  <button
                    key={option.lessonId}
                    type="button"
                    onClick={() => setTargetId(option.lessonId)}
                    aria-pressed={active}
                    className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      active
                        ? 'bg-indigo-50 text-indigo-950 dark:bg-indigo-500/10 dark:text-indigo-100'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-700/50 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {option.lessonCount}{' '}
                        {option.lessonCount === 1 ? 'lesson' : 'lessons'} through{' '}
                        {option.unitTitle}
                      </span>
                    </span>
                    <span aria-hidden="true">{active ? '✓' : '○'}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {trackOptions.length > presets.length && (
            <details className="mt-3">
              <summary className="flex min-h-[44px] cursor-pointer items-center text-sm font-medium text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300">
                Choose a specific unit
              </summary>
              <label className="mt-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Unit
                <select
                  value={selected.lessonId}
                  onChange={(event) => setTargetId(event.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  {trackOptions.map((option) => (
                    <option key={option.lessonId} value={option.lessonId}>
                      {option.unitTitle}
                    </option>
                  ))}
                </select>
              </label>
            </details>
          )}

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {selected.lessonCount}{' '}
            {selected.lessonCount === 1 ? 'lesson' : 'lessons'}: from{' '}
            <span className="font-medium text-slate-800 dark:text-slate-100">
              {selected.firstLessonTitle}
            </span>{' '}
            through{' '}
            <span className="font-medium text-slate-800 dark:text-slate-100">
              {selected.lastLessonTitle}
            </span>
            .
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Testing out does not grant normal lesson XP.
          </p>

          <Link
            to={selected.route}
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
          >
            {rtl && (
              <span className="mr-2" aria-hidden="true">
                ←
              </span>
            )}
            <span>Start {TRACK_LABELS[track].toLowerCase()} check</span>
            {!rtl && (
              <span className="ml-2" aria-hidden="true">
                →
              </span>
            )}
          </Link>
        </div>
      )}
    </div>
  );
}
