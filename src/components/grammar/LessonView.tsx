import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import GrammarQuiz from './GrammarQuiz';
import { markLessonComplete, incrementAttempts } from '../../db/lessons';

interface LessonViewProps {
  lang: string;
  lessonId: string;
  onBack: () => void;
}

interface QuizData {
  type: 'multiple-choice';
  question: string;
  options: string[];
  answer: number;
}

const QUIZ_REGEX = /<!--\s*quiz:(.*?)\s*-->/g;

export default function LessonView({ lang, lessonId, onBack }: LessonViewProps) {
  const [segments, setSegments] = useState<Array<{ type: 'md'; content: string } | { type: 'quiz'; data: QuizData }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [completed, setCompleted] = useState(false);
  const attemptsIncremented = useRef(false);

  // Count total quizzes in the lesson
  const totalQuizzes = segments.filter((s) => s.type === 'quiz').length;

  const handleQuizAnswer = useCallback(
    (correct: boolean) => {
      setQuizScore((prev) => {
        const next = { correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 };
        // Check if this was the last quiz
        if (next.total === totalQuizzes) {
          const score = Math.round((next.correct / next.total) * 100);
          markLessonComplete(lang, lessonId, score);
          setCompleted(true);
        }
        return next;
      });
    },
    [totalQuizzes, lang, lessonId],
  );

  useEffect(() => {
    setLoading(true);
    setError(false);

    fetch(`${import.meta.env.BASE_URL}content/grammar/${lang}/${lessonId}.md`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .then((md) => {
        const parts: typeof segments = [];
        let lastIndex = 0;

        // Reset regex state
        QUIZ_REGEX.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = QUIZ_REGEX.exec(md)) !== null) {
          if (match.index > lastIndex) {
            parts.push({ type: 'md', content: md.slice(lastIndex, match.index) });
          }
          try {
            const data = JSON.parse(match[1]) as QuizData;
            parts.push({ type: 'quiz', data });
          } catch {
            // If JSON parse fails, keep as markdown
            parts.push({ type: 'md', content: match[0] });
          }
          lastIndex = match.index + match[0].length;
        }

        if (lastIndex < md.length) {
          parts.push({ type: 'md', content: md.slice(lastIndex) });
        }

        setSegments(parts);
        setLoading(false);

        // Increment attempts when lesson loads
        if (!attemptsIncremented.current) {
          attemptsIncremented.current = true;
          incrementAttempts(lang, lessonId);
        }

        // If no quizzes, mark complete immediately
        const hasQuizzes = parts.some((p) => p.type === 'quiz');
        if (!hasQuizzes) {
          markLessonComplete(lang, lessonId, 100);
          setCompleted(true);
        }
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [lang, lessonId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 dark:text-gray-500">Loading lesson...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Lesson not found.</p>
        <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 font-medium">
          ← Back to lessons
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="text-indigo-600 dark:text-indigo-400 font-medium text-sm mb-4 hover:underline"
      >
        ← Back to lessons
      </button>
      <div className="prose prose-sm max-w-none dark:prose-invert">
        {segments.map((seg, i) =>
          seg.type === 'md' ? (
            <ReactMarkdown key={i}>{seg.content}</ReactMarkdown>
          ) : (
            <GrammarQuiz key={i} {...seg.data} onAnswer={handleQuizAnswer} />
          )
        )}
      </div>
      {completed && (
        <div className="mt-6 rounded-2xl border border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-800 p-4 text-center">
          <p className="text-green-800 dark:text-green-200 font-semibold">
            ✅ Lesson complete! Score: {totalQuizzes > 0 ? Math.round((quizScore.correct / quizScore.total) * 100) : 100}%
          </p>
        </div>
      )}
    </div>
  );
}
