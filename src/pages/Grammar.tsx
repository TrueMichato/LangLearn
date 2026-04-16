import { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import LessonView from '../components/grammar/LessonView';
import { getLessonProgress } from '../db/lessons';
import type { LessonProgress } from '../db/schema';
import { getLanguageLabel } from '../lib/languages';

interface LessonMeta {
  id: string;
  title: string;
  order: number;
}

export default function GrammarPage() {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const [selectedLang, setSelectedLang] = useState(activeLanguages[0] ?? 'ja');
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Map<string, LessonProgress>>(new Map());

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
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Grammar Guide</h2>

      {/* Language tabs */}
      <div className="flex gap-2 mb-4">
        {activeLanguages.map((lang) => (
          <button
            key={lang}
            onClick={() => {
              setSelectedLang(lang);
              setActiveLessonId(null);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedLang === lang
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {getLanguageLabel(lang)}
          </button>
        ))}
      </div>

      {/* Lesson list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-400 dark:text-gray-500">Loading lessons...</p>
        </div>
      ) : lessons.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No lessons available for this language yet.
        </p>
      ) : (
        <>
          {/* Progress summary */}
          {(() => {
            const completedCount = lessons.filter((l) => progress.get(l.id)?.completed).length;
            const pct = Math.round((completedCount / lessons.length) * 100);
            return (
              <div className="mb-4 rounded-2xl bg-white dark:bg-gray-800 shadow p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {completedCount}/{lessons.length} lessons completed
                </p>
                <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          <div className="space-y-3">
            {lessons.map((lesson) => {
              const lp = progress.get(lesson.id);
              const prevLesson = lessons.find((l) => l.order === lesson.order - 1);
              const isLocked = lesson.order > 1 && !progress.get(prevLesson?.id ?? '')?.completed;
              return (
                <button
                  key={lesson.id}
                  disabled={isLocked}
                  onClick={() => !isLocked && setActiveLessonId(lesson.id)}
                  className={`w-full text-left bg-white dark:bg-gray-800 rounded-2xl shadow p-4 transition-shadow ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">{lesson.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Lesson {lesson.order}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLocked ? (
                        <span className="text-lg">🔒</span>
                      ) : lp?.completed ? (
                        <>
                          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 rounded-full px-2 py-0.5">
                            {lp.quizScore}%
                          </span>
                          <span className="text-green-500 text-lg">✅</span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">Not started</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
