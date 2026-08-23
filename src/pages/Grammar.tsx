import { useState, useEffect } from 'react';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import LanguagePicker from '../components/common/LanguagePicker';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LessonView from '../components/grammar/LessonView';
import LessonAssessment from '../components/assessment/LessonAssessment';
import { getLessonProgress } from '../db/lessons';
import type { LessonProgress } from '../db/schema';
import { SkeletonList } from '../components/common/Skeleton';
import { computeTestOutRange } from '../lib/lesson-assessment';
import {
  LESSON_ORIGIN_QUERY_PARAM,
  LESSON_QUERY_PARAM,
  TEST_OUT_QUERY_PARAM,
  grammarTestOutRoute,
  ROUTES,
} from '../lib/routes';

interface LessonMeta {
  id: string;
  title: string;
  order: number;
  group?: string;
  source?: string;
}

export default function GrammarPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language, setLanguage, options } = useCurrentLanguage();
  const selectedLang = language ?? 'ja';
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [loadedLanguage, setLoadedLanguage] = useState('');
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Map<string, LessonProgress>>(new Map());
  const [progressLanguage, setProgressLanguage] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const testOutTarget = searchParams.get(TEST_OUT_QUERY_PARAM);
  const assessmentFromLearn =
    searchParams.get(LESSON_ORIGIN_QUERY_PARAM) === 'learn';
  const requestedLessonId = searchParams.get(LESSON_QUERY_PARAM);
  const displayedLessonId = activeLessonId ?? requestedLessonId;
  const loading = loadedLanguage !== selectedLang;

  // Load lesson progress whenever language changes or returning from a lesson
  useEffect(() => {
    if (displayedLessonId) return;
    getLessonProgress(selectedLang).then((items) => {
      const map = new Map<string, LessonProgress>();
      for (const item of items) map.set(item.lessonId, item);
      setProgress(map);
      setProgressLanguage(selectedLang);
    });
  }, [selectedLang, displayedLessonId, testOutTarget]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}content/grammar/${selectedLang}/index.json`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: LessonMeta[]) => {
        setLessons(data.sort((a, b) => a.order - b.order));
        setLoadedLanguage(selectedLang);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLessons([]);
        setLoadedLanguage(selectedLang);
      });
    return () => controller.abort();
  }, [selectedLang]);

  const exitToLessons = () => {
    navigate(ROUTES.grammar, { replace: true });
    setActiveLessonId(null);
  };
  const returnFromAssessment = () => {
    if (assessmentFromLearn) {
      navigate(ROUTES.learn, {
        replace: true,
        state: { focusCurrentPathStep: true },
      });
      return;
    }
    exitToLessons();
  };

  if (displayedLessonId) {
    return (
      <LessonView
        // Remount per lesson: navigating between lessons otherwise carries the
        // previous lesson's quiz score and completion state into the next one.
        key={`${selectedLang}/${displayedLessonId}`}
        lang={selectedLang}
        lessonId={displayedLessonId}
        onBack={exitToLessons}
        lessons={lessons}
        onNavigate={(id) => setActiveLessonId(id)}
      />
    );
  }

  if (testOutTarget && !loading && progressLanguage === selectedLang) {
    // Imported Tofugu references are supplemental. Native lessons form the
    // ordered test-out track even when their index uses curriculum groups.
    const originalLessons = lessons.filter((l) => l.source !== 'tofugu');
    const completedIds = new Set(
      [...progress.values()].filter((p) => p.completed).map((p) => p.lessonId),
    );
    const range = computeTestOutRange(originalLessons, completedIds, testOutTarget);
    if (range && range.length > 0) {
      const titleById = new Map(lessons.map((l) => [l.id, l.title]));
      return (
        <LessonAssessment
          key={`test-out/${testOutTarget}`}
          lang={selectedLang}
          kind="grammar"
          lessons={range.map((id) => ({ id, title: titleById.get(id) ?? id }))}
          onExit={returnFromAssessment}
          returnLabel={assessmentFromLearn ? 'Back to path' : 'Back to lessons'}
          onPass={returnFromAssessment}
          passActionLabel={
            assessmentFromLearn ? 'Continue on your path' : 'Continue'
          }
          failActionLabel={
            assessmentFromLearn ? 'Back to path' : 'Study the lessons'
          }
        />
      );
    }
    // Nothing valid to test out of (already completed, or a bad link) —
    // fall through to the normal lesson browser instead of a dead end.
  }

  return (
    <div>
      {!activeLessonId && (
        <button
          onClick={() => navigate('/learn')}
          className="inline-flex min-h-[44px] items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-3 hover:underline press-feedback"
        >
          ← Back to Learn
        </button>
      )}
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Grammar Guide</h2>

      <LanguagePicker
        options={options}
        value={selectedLang}
        onChange={(lang) => {
          setLanguage(lang);
          setActiveLessonId(null);
        }}
        label="Grammar language"
        className="mb-4"
      />

      {/* Lesson list */}
      {loading ? (
        <SkeletonList count={4} />
      ) : lessons.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-center py-8">
          No lessons available for this language yet.
        </p>
      ) : (
        <>
          {/* Progress summary */}
          {(() => {
            const completedCount = lessons.filter((l) => progress.get(l.id)?.completed).length;
            const pct = Math.round((completedCount / lessons.length) * 100);
            return (
              <div className="mb-4 rounded-2xl bg-white dark:bg-slate-800 shadow p-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  {completedCount}/{lessons.length} lessons completed
                </p>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          <div className="space-y-3">
            {(() => {
              // Separate original lessons from grouped (Tofugu) lessons
              const originalLessons = lessons.filter((l) => !l.group);
              const groupedLessons = lessons.filter((l) => l.group);
              const groups = [...new Set(groupedLessons.map((l) => l.group!))];

              const toggleGroup = (group: string) => {
                setCollapsedGroups((prev) => {
                  const next = new Set(prev);
                  if (next.has(group)) next.delete(group);
                  else next.add(group);
                  return next;
                });
              };

              const renderLesson = (lesson: LessonMeta, locked: boolean, showTestOut: boolean) => {
                const lp = progress.get(lesson.id);
                return (
                  <div key={lesson.id}>
                    <button
                      disabled={locked}
                      onClick={() => !locked && setActiveLessonId(lesson.id)}
                      className={`w-full text-left bg-white dark:bg-slate-800 rounded-2xl shadow p-4 transition-all duration-200 border ${
                        locked
                          ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-700'
                          : lp?.completed
                            ? 'border-green-300 dark:border-green-800/60 hover:-translate-y-0.5 hover:shadow-md press-feedback'
                            : 'border-slate-200/70 dark:border-white/10 hover:-translate-y-0.5 hover:shadow-md press-feedback'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-800 dark:text-slate-100">{lesson.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Lesson {lesson.order}
                            </p>
                            {lesson.source === 'tofugu' && (
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-full px-1.5 py-0.5">
                                Tofugu
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {locked ? (
                            <span className="text-lg">🔒</span>
                          ) : lp?.completed ? (
                            <>
                              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 rounded-full px-2 py-0.5">
                                {lp.quizScore}%
                              </span>
                              <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold">✓</span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 dark:text-slate-400">Not started</span>
                          )}
                        </div>
                      </div>
                    </button>
                    {showTestOut && !lp?.completed && (
                      <button
                        onClick={() => navigate(grammarTestOutRoute(lesson.id))}
                        className="mt-1 inline-flex min-h-[44px] items-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline press-feedback"
                      >
                        Know this already? Test out →
                      </button>
                    )}
                  </div>
                );
              };

              return (
                <>
                  {/* Original (core) lessons — sequential unlock */}
                  {originalLessons.length > 0 && (
                    <div className="space-y-3 mb-6">
                      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Core Lessons
                      </h3>
                      {originalLessons.map((lesson) => {
                        const prevLesson = originalLessons.find((l) => l.order === lesson.order - 1);
                        const isLocked = lesson.order > 1 && !progress.get(prevLesson?.id ?? '')?.completed;
                        return renderLesson(lesson, isLocked, true);
                      })}
                    </div>
                  )}

                  {/* Grouped (Tofugu) lessons — collapsible groups, no locking */}
                  {groups.map((group) => {
                    const groupLessons = groupedLessons.filter((l) => l.group === group);
                    const isCollapsed = collapsedGroups.has(group);
                    const completedInGroup = groupLessons.filter((l) => progress.get(l.id)?.completed).length;
                    const isTofuguGroup = groupLessons.some((l) => l.source === 'tofugu');

                    return (
                      <div key={group} className="mb-4">
                        <button
                          onClick={() => toggleGroup(group)}
                          className="w-full min-h-[44px] flex items-center justify-between py-2 px-1 press-feedback"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-xs transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>▶</span>
                            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                              {group}
                            </h3>
                            {isTofuguGroup && (
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-full px-1.5 py-0.5">
                                Tofugu
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {completedInGroup}/{groupLessons.length}
                          </span>
                        </button>
                        {!isCollapsed && (
                          <div className="space-y-3 mt-2">
                            {groupLessons.map((lesson) =>
                              renderLesson(lesson, false, !isTofuguGroup),
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
