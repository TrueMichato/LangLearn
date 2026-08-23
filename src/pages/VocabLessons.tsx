import { useState, useEffect } from 'react';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import LanguagePicker from '../components/common/LanguagePicker';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { getLessonProgress } from '../db/lessons';
import { getDialectInfo } from '../lib/arabic-dialects';
import VocabLessonView from '../components/vocab/VocabLessonView';
import LessonAssessment from '../components/assessment/LessonAssessment';
import type { VocabLessonMeta } from '../types/vocab';
import type { LessonProgress } from '../db/schema';
import { SkeletonList } from '../components/common/Skeleton';
import { computeTestOutRange } from '../lib/lesson-assessment';
import {
  LESSON_ORIGIN_QUERY_PARAM,
  LESSON_BROWSE_ORIGIN,
  LESSON_QUERY_PARAM,
  TEST_OUT_QUERY_PARAM,
  TEST_OUT_LESSON_QUERY_PARAM,
  vocabTestOutRoute,
  ROUTES,
} from '../lib/routes';

export default function VocabLessons() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const arabicDialect = useSettingsStore((s) => s.arabicDialect);
  const arabicColloquialFocus = useSettingsStore((s) => s.arabicColloquialFocus);
  const { language, setLanguage } = useCurrentLanguage();
  const selectedLang = language ?? 'ja';
  const [lessons, setLessons] = useState<VocabLessonMeta[]>([]);
  const [loadedLanguage, setLoadedLanguage] = useState('');
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Map<string, LessonProgress>>(new Map());
  const [progressLanguage, setProgressLanguage] = useState('');
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);
  const testOutTarget = searchParams.get(TEST_OUT_QUERY_PARAM);
  const requestedTestOutLessons = searchParams.getAll(
    TEST_OUT_LESSON_QUERY_PARAM,
  );
  const assessmentFromLearn =
    searchParams.get(LESSON_ORIGIN_QUERY_PARAM) === 'learn';
  const openedFromBrowse =
    searchParams.get(LESSON_ORIGIN_QUERY_PARAM) === LESSON_BROWSE_ORIGIN;
  const requestedLessonId = searchParams.get(LESSON_QUERY_PARAM);
  const displayedLessonId = activeLessonId ?? requestedLessonId;
  const loading = loadedLanguage !== selectedLang;

  // Determine which languages have vocab content
  useEffect(() => {
    async function checkLangs() {
      const available: string[] = [];
      for (const lang of activeLanguages) {
        try {
          const res = await fetch(`${import.meta.env.BASE_URL}content/vocab/${lang}/index.json`);
          if (res.ok) available.push(lang);
        } catch {
          // no content for this language
        }
      }
      setAvailableLangs(available);
    }
    checkLangs();
  }, [activeLanguages]);

  // Load lesson progress
  useEffect(() => {
    if (displayedLessonId) return;
    getLessonProgress(selectedLang).then((items) => {
      const map = new Map<string, LessonProgress>();
      for (const item of items) map.set(item.lessonId, item);
      setProgress(map);
      setProgressLanguage(selectedLang);
    });
  }, [selectedLang, displayedLessonId, testOutTarget]);

  // Load lesson index
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}content/vocab/${selectedLang}/index.json`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: VocabLessonMeta[]) => {
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

  // ── Arabic dialect overlay ──────────────────────────────
  // MSA is the shared core (always shown). A dialect-tagged lesson is shown
  // only when it matches the learner's chosen dialect (or is pan-dialectal
  // "all"). "Colloquial focus" surfaces those colloquial lessons first.
  // Computed above the early returns below because the test-out range must
  // be figured against this same visible, dialect-filtered order — the one
  // locking is actually based on — not the raw fetched lesson list.
  const isArabic = selectedLang === 'ar';
  const isColloquial = (l: VocabLessonMeta) =>
    !!l.dialect && l.dialect !== 'msa' && l.dialect !== 'standard';
  const dialectMatches = (l: VocabLessonMeta) => {
    if (!isArabic) return true;
    const d = l.dialect;
    if (!d || d === 'msa' || d === 'standard' || d === 'all') return true;
    return d === arabicDialect;
  };
  const hiddenDialectCount = isArabic
    ? lessons.filter((l) => isColloquial(l) && l.dialect !== 'all' && l.dialect !== arabicDialect).length
    : 0;
  const visibleLessons = lessons
    .filter(dialectMatches)
    .sort((a, b) => {
      if (isArabic && arabicColloquialFocus) {
        const ca = isColloquial(a) ? 0 : 1;
        const cb = isColloquial(b) ? 0 : 1;
        if (ca !== cb) return ca - cb;
      }
      return a.order - b.order;
    });

  const exitToLessons = () => {
    navigate(
      openedFromBrowse
        ? `${ROUTES.vocabLessons}?${LESSON_ORIGIN_QUERY_PARAM}=${LESSON_BROWSE_ORIGIN}`
        : ROUTES.vocabLessons,
      { replace: true },
    );
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
      <VocabLessonView
        lang={selectedLang}
        lessonId={displayedLessonId}
        onBack={exitToLessons}
      />
    );
  }

  if (testOutTarget && !loading && progressLanguage === selectedLang) {
    const completedIds = new Set(
      [...progress.values()].filter((p) => p.completed).map((p) => p.lessonId.replace(/^vocab\//, '')),
    );
    const range = computeTestOutRange(
      visibleLessons,
      completedIds,
      testOutTarget,
      requestedTestOutLessons,
    );
    if (range && range.length > 0) {
      const titleById = new Map(lessons.map((l) => [l.id, l.title]));
      const targetIndex = visibleLessons.findIndex(
        (lesson) => lesson.id === testOutTarget,
      );
      return (
        <LessonAssessment
          key={`test-out/${testOutTarget}`}
          lang={selectedLang}
          kind="vocab"
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
          nextLessonTitle={visibleLessons[targetIndex + 1]?.title}
        />
      );
    }
    // Nothing valid to test out of (already completed, or a bad link) —
    // fall through to the normal lesson browser instead of a dead end.
  }

  const levelColors: Record<string, string> = {
    beginner: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    elementary: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    intermediate: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    advanced: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

  return (
    <div>
      {!activeLessonId && (
        <button
          onClick={() =>
            navigate(
              openedFromBrowse ? ROUTES.browseActivities : ROUTES.learn,
            )
          }
          className="inline-flex min-h-[44px] items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-3 hover:underline press-feedback"
        >
          ← Back to {openedFromBrowse ? 'Lessons & practice' : 'Learn'}
        </button>
      )}
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Vocabulary Lessons</h2>

      <LanguagePicker
        options={availableLangs}
        value={selectedLang}
        onChange={(lang) => {
          setLanguage(lang);
          setActiveLessonId(null);
        }}
        label="Vocabulary language"
        className="mb-4"
      />

      {loading ? (
        <SkeletonList count={4} />
      ) : lessons.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-center py-8">
          No vocabulary lessons available for this language yet.
        </p>
      ) : (
        <>
          {/* Arabic dialect overlay banner */}
          {isArabic && (
            <div className="mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-3 flex items-start gap-2">
              <span className="text-lg leading-none" aria-hidden="true">🗣️</span>
              <div className="min-w-0">
                <p className="text-sm text-indigo-900 dark:text-indigo-200">
                  Showing <span className="font-semibold">Modern Standard Arabic</span>
                  {arabicDialect !== 'msa' && (
                    <> + <span className="font-semibold">{getDialectInfo(arabicDialect)?.name ?? arabicDialect}</span> {getDialectInfo(arabicDialect)?.flag}</>
                  )}
                  {arabicColloquialFocus && arabicDialect !== 'msa' && ' — colloquial first'}.
                  {hiddenDialectCount > 0 && (
                    <span className="text-indigo-700/80 dark:text-indigo-300/80"> {hiddenDialectCount} other-dialect lesson{hiddenDialectCount !== 1 ? 's' : ''} hidden.</span>
                  )}
                </p>
                <button
                  onClick={() => navigate('/settings')}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5 min-h-[32px]"
                >
                  Change dialect in Settings →
                </button>
              </div>
            </div>
          )}

          {/* Progress summary */}
          {(() => {
            const completedCount = visibleLessons.filter(
              (l) => progress.get(`vocab/${l.id}`)?.completed,
            ).length;
            const pct = visibleLessons.length ? Math.round((completedCount / visibleLessons.length) * 100) : 0;
            return (
              <div className="mb-4 rounded-2xl bg-white dark:bg-slate-800 shadow p-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  {completedCount}/{visibleLessons.length} lessons completed
                </p>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          <div className="space-y-3">
            {visibleLessons.map((lesson, idx) => {
              const lp = progress.get(`vocab/${lesson.id}`);
              // Lock relative to the visible (dialect-filtered, colloquial-sorted) list
              const prevLesson = idx > 0 ? visibleLessons[idx - 1] : null;
              const isLocked =
                prevLesson != null &&
                !progress.get(`vocab/${prevLesson.id}`)?.completed;
              const dInfo = isColloquial(lesson)
                ? (lesson.dialect === 'all' ? { flag: '🗣️', name: 'Colloquial' } : getDialectInfo(lesson.dialect!))
                : null;

              return (
                <div key={lesson.id}>
                  <button
                    disabled={isLocked}
                    onClick={() => !isLocked && setActiveLessonId(lesson.id)}
                    className={`w-full text-left bg-white dark:bg-slate-800 rounded-2xl shadow p-4 transition-all duration-200 border ${
                      isLocked
                        ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-700'
                        : lp?.completed
                          ? 'border-green-300 dark:border-green-800/60 hover:-translate-y-0.5 hover:shadow-md press-feedback'
                          : 'border-slate-200/70 dark:border-white/10 hover:-translate-y-0.5 hover:shadow-md press-feedback'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-100">{lesson.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-0.5">
                            {lesson.wordCount} words
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColors[lesson.level] ?? ''}`}
                          >
                            {lesson.level}
                          </span>
                          {dInfo && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                              {dInfo.flag} {dInfo.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {isLocked ? (
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
                  {!lp?.completed && (
                    <button
                      onClick={() =>
                        navigate(
                          vocabTestOutRoute(
                            lesson.id,
                            openedFromBrowse
                              ? LESSON_BROWSE_ORIGIN
                              : undefined,
                          ),
                        )
                      }
                      className="mt-1 inline-flex min-h-[44px] items-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline press-feedback"
                    >
                      Know this already? Test out →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
