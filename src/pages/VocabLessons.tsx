import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { getLessonProgress } from '../db/lessons';
import { getLanguageLabel } from '../lib/languages';
import VocabLessonView from '../components/vocab/VocabLessonView';
import type { VocabLessonMeta } from '../types/vocab';
import type { LessonProgress } from '../db/schema';
import { SkeletonList } from '../components/common/Skeleton';

export default function VocabLessons() {
  const navigate = useNavigate();
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const [selectedLang, setSelectedLang] = useState(activeLanguages[0] ?? 'ja');
  const [lessons, setLessons] = useState<VocabLessonMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Map<string, LessonProgress>>(new Map());
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);

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
      if (available.length > 0 && !available.includes(selectedLang)) {
        setSelectedLang(available[0]);
      }
    }
    checkLangs();
  }, [activeLanguages]);

  // Load lesson progress
  useEffect(() => {
    if (activeLessonId) return;
    getLessonProgress(selectedLang).then((items) => {
      const map = new Map<string, LessonProgress>();
      for (const item of items) map.set(item.lessonId, item);
      setProgress(map);
    });
  }, [selectedLang, activeLessonId]);

  // Load lesson index
  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.BASE_URL}content/vocab/${selectedLang}/index.json`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: VocabLessonMeta[]) => {
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
      <VocabLessonView
        lang={selectedLang}
        lessonId={activeLessonId}
        onBack={() => setActiveLessonId(null)}
      />
    );
  }

  const levelColors: Record<string, string> = {
    beginner: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    intermediate: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    advanced: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

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
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Vocabulary Lessons</h2>

      {/* Language tabs */}
      {availableLangs.length > 1 && (
        <div className="flex gap-2 mb-4">
          {availableLangs.map((lang) => (
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
      )}

      {loading ? (
        <SkeletonList count={4} />
      ) : lessons.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-center py-8">
          No vocabulary lessons available for this language yet.
        </p>
      ) : (
        <>
          {/* Progress summary */}
          {(() => {
            const completedCount = lessons.filter(
              (l) => progress.get(`vocab/${l.id}`)?.completed,
            ).length;
            const pct = Math.round((completedCount / lessons.length) * 100);
            return (
              <div className="mb-4 rounded-2xl bg-white dark:bg-slate-800 shadow p-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  {completedCount}/{lessons.length} lessons completed
                </p>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          <div className="space-y-3">
            {lessons.map((lesson) => {
              const lp = progress.get(`vocab/${lesson.id}`);
              const prevLesson = lessons.find((l) => l.order === lesson.order - 1);
              const isLocked =
                lesson.order > 1 &&
                !progress.get(`vocab/${prevLesson?.id ?? ''}`)?.completed;

              return (
                <button
                  key={lesson.id}
                  disabled={isLocked}
                  onClick={() => !isLocked && setActiveLessonId(lesson.id)}
                  className={`w-full text-left bg-white dark:bg-slate-800 rounded-2xl shadow p-4 transition-all duration-200 border-l-4 ${
                    isLocked
                      ? 'opacity-50 cursor-not-allowed border-slate-300 dark:border-slate-600'
                      : lp?.completed
                        ? 'border-green-400 dark:border-green-500 hover:-translate-y-0.5 hover:shadow-md press-feedback'
                        : 'border-rose-400 dark:border-rose-500 hover:-translate-y-0.5 hover:shadow-md press-feedback'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{lesson.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-0.5">
                          {lesson.wordCount} words
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColors[lesson.level] ?? ''}`}
                        >
                          {lesson.level}
                        </span>
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
                        <span className="text-xs text-slate-400 dark:text-slate-500">Not started</span>
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
