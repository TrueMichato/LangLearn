import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import LessonView from '../components/grammar/LessonView';
import { getLessonProgress } from '../db/lessons';
import type { LessonProgress } from '../db/schema';
import { getLanguageLabel } from '../lib/languages';
import { SkeletonList } from '../components/common/Skeleton';

interface LessonMeta {
  id: string;
  title: string;
  order: number;
  group?: string;
  source?: string;
}

export default function GrammarPage() {
  const navigate = useNavigate();
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const [selectedLang, setSelectedLang] = useState(activeLanguages[0] ?? 'ja');
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Map<string, LessonProgress>>(new Map());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Load lesson progress whenever language changes or returning from a lesson
  useEffect(() => {
    if (activeLessonId) return;
    getLessonProgress(selectedLang).then((items) => {
      const map = new Map<string, LessonProgress>();
      for (const item of items) map.set(item.lessonId, item);
      setProgress(map);
    });
  }, [selectedLang, activeLessonId]);

  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.BASE_URL}content/grammar/${selectedLang}/index.json`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: LessonMeta[]) => {
        setLessons(data.sort((a, b) => a.order - b.order));
        setLoading(false);
      })
      .catch(() => {
        setLessons([]);
        setLoading(false);
      });
  }, [selectedLang]);

  if (activeLessonId) {
    return (
      <LessonView
        lang={selectedLang}
        lessonId={activeLessonId}
        onBack={() => setActiveLessonId(null)}
        lessons={lessons}
        onNavigate={(id) => setActiveLessonId(id)}
      />
    );
  }

  return (
    <div>
      {!activeLessonId && (
        <button
          onClick={() => navigate('/learn')}
          className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-3 hover:underline press-feedback"
        >
          ← Back to Learn
        </button>
      )}
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Grammar Guide</h2>

      {/* Language tabs */}
      <div className="flex gap-2 mb-4">
        {activeLanguages.map((lang) => (
          <button
            key={lang}
            onClick={() => {
              setSelectedLang(lang);
              setActiveLessonId(null);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors press-feedback ${
              selectedLang === lang
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            {getLanguageLabel(lang)}
          </button>
        ))}
      </div>

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
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
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

              const renderLesson = (lesson: LessonMeta, locked: boolean) => {
                const lp = progress.get(lesson.id);
                return (
                  <button
                    key={lesson.id}
                    disabled={locked}
                    onClick={() => !locked && setActiveLessonId(lesson.id)}
                    className={`w-full text-left bg-white dark:bg-slate-800 rounded-2xl shadow p-4 transition-all duration-200 border-l-4 ${
                      locked
                        ? 'opacity-50 cursor-not-allowed border-slate-300 dark:border-slate-600'
                        : lp?.completed
                          ? 'border-green-400 dark:border-green-500 hover:-translate-y-0.5 hover:shadow-md press-feedback'
                          : 'border-indigo-400 dark:border-indigo-500 hover:-translate-y-0.5 hover:shadow-md press-feedback'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800 dark:text-slate-100">{lesson.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            Lesson {lesson.order}
                          </p>
                          {lesson.source === 'tofugu' && (
                            <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 rounded-full px-1.5 py-0.5">
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
                          <span className="text-xs text-slate-400 dark:text-slate-500">Not started</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              };

              return (
                <>
                  {/* Original (core) lessons — sequential unlock */}
                  {originalLessons.length > 0 && (
                    <div className="space-y-3 mb-6">
                      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                        Core Lessons
                      </h3>
                      {originalLessons.map((lesson) => {
                        const prevLesson = originalLessons.find((l) => l.order === lesson.order - 1);
                        const isLocked = lesson.order > 1 && !progress.get(prevLesson?.id ?? '')?.completed;
                        return renderLesson(lesson, isLocked);
                      })}
                    </div>
                  )}

                  {/* Grouped (Tofugu) lessons — collapsible groups, no locking */}
                  {groups.map((group) => {
                    const groupLessons = groupedLessons.filter((l) => l.group === group);
                    const isCollapsed = collapsedGroups.has(group);
                    const completedInGroup = groupLessons.filter((l) => progress.get(l.id)?.completed).length;

                    return (
                      <div key={group} className="mb-4">
                        <button
                          onClick={() => toggleGroup(group)}
                          className="w-full flex items-center justify-between py-2 px-1 press-feedback"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-xs transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>▶</span>
                            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                              {group}
                            </h3>
                            <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 rounded-full px-1.5 py-0.5">
                              Tofugu
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {completedInGroup}/{groupLessons.length}
                          </span>
                        </button>
                        {!isCollapsed && (
                          <div className="space-y-3 mt-2">
                            {groupLessons.map((lesson) => renderLesson(lesson, false))}
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
