import { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import LessonView from '../components/grammar/LessonView';

interface LessonMeta {
  id: string;
  title: string;
  order: number;
}

const LANG_LABELS: Record<string, string> = {
  ja: '🇯🇵 Japanese',
  ru: '🇷🇺 Russian',
};

export default function GrammarPage() {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const [selectedLang, setSelectedLang] = useState(activeLanguages[0] ?? 'ja');
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

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
            {LANG_LABELS[lang] ?? lang}
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
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => setActiveLessonId(lesson.id)}
              className="w-full text-left bg-white dark:bg-gray-800 rounded-2xl shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">{lesson.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Lesson {lesson.order}
                  </p>
                </div>
                <span className="text-gray-400 dark:text-gray-500 text-lg">→</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
