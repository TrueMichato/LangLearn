import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { LESSON_REMARK_PLUGINS } from '../../lib/markdown-plugins';
import GrammarQuiz from './GrammarQuiz';
import LessonCaptureModal from './LessonCaptureModal';
import { getLessonProgress, markLessonComplete, incrementAttempts } from '../../db/lessons';
import { findSavedLessonItems, reconcileSavedLessonItems, saveLessonReviewItems } from '../../db/lesson-cards';
import {
  parseLessonCandidates,
  parseLessonReviewItems,
  stripLessonReviewSources,
  indexBySourceText,
  matchCandidate,
  nodeText,
  captureTags,
} from '../../lib/lesson-capture';
import type { VocabularyReviewItem } from '../../lib/lesson-review';
import { SkeletonList } from '../common/Skeleton';

interface LessonViewProps {
  lang: string;
  lessonId: string;
  onBack: () => void;
  lessons: Array<{ id: string; title: string; order: number }>;
  onNavigate: (lessonId: string) => void;
}

interface QuizData {
  type: 'multiple-choice';
  question: string;
  options: string[];
  answer: number;
}

type Segment = { type: 'md'; content: string } | { type: 'quiz'; data: QuizData };
const QUIZ_REGEX = /<!--\s*quiz:([\s\S]*?)\s*-->/g;

function SaveFlashcardButton({
  item, lang, lessonId, alreadySaved, onSaved,
}: {
  item: VocabularyReviewItem;
  lang: string;
  lessonId: string;
  alreadySaved: boolean;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState(false);
  const lock = useRef(false);
  const saved = alreadySaved || justSaved;

  if (saved) {
    return <span className="ml-1.5 inline-flex items-center text-xs font-medium text-green-700 dark:text-green-300" title="Saved for review">✓ Saved</span>;
  }
  return (
    <span className="inline-flex items-center gap-1">
      <button type="button" disabled={pending}
        aria-label={`${error ? 'Retry saving' : 'Save'} ${item.word} as a flashcard`}
        title="Save for review"
        className="ml-1.5 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-sm text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
        onClick={async (event) => {
          event.stopPropagation();
          if (lock.current) return;
          lock.current = true;
          setPending(true);
          setError(false);
          try {
            await saveLessonReviewItems([item], lang, lessonId);
            setJustSaved(true);
            onSaved();
          } catch {
            setError(true);
          } finally {
            lock.current = false;
            setPending(false);
          }
        }}>
        {pending ? '…' : error ? 'Retry' : '＋'}
      </button>
      {error && <span role="alert" className="text-xs text-amber-800 dark:text-amber-300">Could not save</span>}
    </span>
  );
}

export default function LessonView(props: LessonViewProps) {
  return <LessonSession key={`${props.lang}/${props.lessonId}`} {...props} />;
}

function LessonSession({ lang, lessonId, onBack, lessons, onNavigate }: LessonViewProps) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadRetry, setLoadRetry] = useState(0);
  const [previousCompletion, setPreviousCompletion] = useState<{ quizScore: number } | null>(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [completionError, setCompletionError] = useState(false);
  const [completionRetry, setCompletionRetry] = useState(0);
  const [captureMode, setCaptureMode] = useState<'choose' | 'personal' | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [captureRevision, setCaptureRevision] = useState(0);
  const [savedMaterialError, setSavedMaterialError] = useState(false);
  const [savedMaterialRetry, setSavedMaterialRetry] = useState(0);
  const attemptsIncremented = useRef(false);
  const completionRecorded = useRef(false);
  const totalQuizzes = segments.filter((segment) => segment.type === 'quiz').length;
  const freshlyCompleted = segments.length > 0 && quizScore.total >= totalQuizzes;
  const completed = !!previousCompletion || freshlyCompleted;
  const parsed = useMemo(() => parseLessonReviewItems(markdown), [markdown]);
  const prose = useMemo(() => stripLessonReviewSources(markdown.replace(QUIZ_REGEX, '')), [markdown]);
  const vocabulary = useMemo(() => parsed.items.filter((item): item is VocabularyReviewItem => item.kind === 'vocabulary'), [parsed]);
  const visibleVocabulary = useMemo(() => {
    const text = prose.normalize('NFC');
    return vocabulary.filter((item) => text.includes(item.word.normalize('NFC')));
  }, [prose, vocabulary]);
  const reviewItems = completed ? parsed.items : visibleVocabulary;
  const inlineCandidates = useMemo(() => indexBySourceText(parseLessonCandidates(markdown.replace(QUIZ_REGEX, ''))), [markdown]);
  const vocabularyByWord = useMemo(() => new Map(visibleVocabulary.map((item) => [item.word, item])), [visibleVocabulary]);

  useEffect(() => {
    let active = true;
    const refreshSavedMaterial = async () => {
      try {
        if (completed) await reconcileSavedLessonItems(parsed.items, lang, lessonId);
        const saved = await findSavedLessonItems(vocabulary, lang, lessonId);
        if (active) {
          setSavedIds(saved);
          setSavedMaterialError(false);
        }
      } catch {
        if (active) setSavedMaterialError(true);
      }
    };
    void refreshSavedMaterial();
    return () => { active = false; };
  }, [completed, parsed.items, vocabulary, lang, lessonId, captureRevision, savedMaterialRetry]);

  const handleQuizAnswer = useCallback((correct: boolean) => {
    setQuizScore((previous) => ({
      correct: previous.correct + (correct ? 1 : 0),
      total: previous.total + 1,
    }));
  }, []);

  useEffect(() => {
    if (!freshlyCompleted || completionRecorded.current || (previousCompletion && quizScore.total === 0)) return;
    completionRecorded.current = true;
    const score = totalQuizzes > 0 ? Math.round((quizScore.correct / totalQuizzes) * 100) : 100;
    void markLessonComplete(lang, lessonId, score).then(() => setCompletionError(false), () => {
      completionRecorded.current = false;
      setCompletionError(true);
    });
  }, [freshlyCompleted, previousCompletion, quizScore, totalQuizzes, lang, lessonId, completionRetry]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const [response, progress] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}content/grammar/${lang}/${lessonId}.md`),
          getLessonProgress(lang),
        ]);
        if (!response.ok) throw new Error('Lesson unavailable');
        const md = await response.text();
        if (!active) return;
        const displayMd = stripLessonReviewSources(md);
        const parts: Segment[] = [];
        let lastIndex = 0;
        for (const match of displayMd.matchAll(QUIZ_REGEX)) {
          const index = match.index;
          if (index > lastIndex) parts.push({ type: 'md', content: displayMd.slice(lastIndex, index) });
          try {
            parts.push({ type: 'quiz', data: JSON.parse(match[1]) as QuizData });
          } catch {
            parts.push({ type: 'md', content: match[0] });
          }
          lastIndex = index + match[0].length;
        }
        if (lastIndex < displayMd.length) parts.push({ type: 'md', content: displayMd.slice(lastIndex) });
        setPreviousCompletion(progress.find((entry) => entry.lessonId === lessonId && entry.completed) ?? null);
        setMarkdown(md);
        setSegments(parts);
        setLoading(false);
        if (!attemptsIncremented.current) {
          attemptsIncremented.current = true;
          void incrementAttempts(lang, lessonId).catch(() => { attemptsIncremented.current = false; });
        }
      } catch {
        if (active) { setError(true); setLoading(false); }
      }
    };
    void load();
    return () => { active = false; };
  }, [lang, lessonId, loadRetry]);

  if (loading) {
    return <div className="space-y-4"><div className="skeleton h-4 w-24" /><SkeletonList count={3} /></div>;
  }
  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-slate-500 dark:text-slate-400">Could not load this lesson and its progress. Try again when the lesson is available.</p>
        <button type="button" onClick={() => setLoadRetry((previous) => previous + 1)}
          className="mr-3 min-h-[44px] font-medium text-indigo-600 dark:text-indigo-400">Retry lesson</button>
        <button type="button" onClick={onBack} className="min-h-[44px] font-medium text-indigo-600 dark:text-indigo-400">← Back to lessons</button>
      </div>
    );
  }

  const quizProgressPct = totalQuizzes > 0 ? Math.round((quizScore.total / totalQuizzes) * 100) : 0;
  const currentIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return (
    <div>
      <button type="button" onClick={onBack}
        className="mb-4 min-h-[44px] text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">← Back to lessons</button>

      {totalQuizzes > 0 && (
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
          role="progressbar" aria-label="Lesson quizzes answered" aria-valuenow={quizScore.total} aria-valuemin={0} aria-valuemax={totalQuizzes}>
          <div className="h-full rounded-full bg-indigo-600 transition-all duration-500 motion-reduce:transition-none"
            style={{ width: `${quizProgressPct}%` }} />
        </div>
      )}

      <div className="mb-4 space-y-2 border-b border-slate-200/70 pb-4 dark:border-white/10">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {completed ? 'Choose what you want to remember. Saving for review is optional.'
            : 'Save vocabulary while reading. Rule and concept suggestions unlock when the lesson is complete.'}
        </p>
        <div className="flex flex-wrap gap-x-4">
          {(reviewItems.length > 0 || completed || parsed.diagnostics.length > 0) && (
            <button type="button" onClick={() => setCaptureMode('choose')}
              className="min-h-[44px] text-sm font-medium text-indigo-600 dark:text-indigo-400">
              {completed ? 'Choose review material' : 'Save lesson vocabulary'}
            </button>
          )}
          <button type="button" onClick={() => setCaptureMode('personal')}
            className="min-h-[44px] text-sm font-medium text-indigo-600 dark:text-indigo-400">Save something else</button>
        </div>
        {savedMaterialError && <p role="alert" className="text-sm text-slate-600 dark:text-slate-300">
          Could not refresh your saved lesson material. You can keep reading.{' '}
          <button type="button" onClick={() => setSavedMaterialRetry((previous) => previous + 1)}
            className="min-h-[44px] font-medium text-indigo-600 dark:text-indigo-400">Retry saved material</button>
        </p>}
      </div>

      <div className="prose prose-sm max-w-none dark:prose-invert">
        {segments.map((segment, index) => segment.type === 'md' ? (
          <ReactMarkdown key={index} remarkPlugins={LESSON_REMARK_PLUGINS} components={{
            li: ({ children, ...props }) => {
              const candidate = matchCandidate(inlineCandidates, nodeText(children));
              const item = candidate && vocabularyByWord.get(candidate.word);
              return <li {...props}>{children}{item && <SaveFlashcardButton item={item} lang={lang} lessonId={lessonId}
                alreadySaved={savedIds.has(item.id)} onSaved={() => setCaptureRevision((previous) => previous + 1)} />}</li>;
            },
          }}>{segment.content}</ReactMarkdown>
        ) : (
          <div key={index} className="my-6 rounded-2xl border border-indigo-200 bg-indigo-50 dark:border-indigo-800/60 dark:bg-indigo-950/30">
            <GrammarQuiz {...segment.data} language={lang} captureAfterAnswer
              captureWords={vocabulary.filter((item) => {
                const correctMaterial = `${segment.data.question} ${segment.data.options[segment.data.answer] ?? ''}`.normalize('NFC');
                return correctMaterial.includes(item.word.normalize('NFC'));
              }).map((item) => ({ ...item, context: item.contextSentence, tags: captureTags(lessonId, item.isSentence) }))}
              targetOptionIndices={segment.data.options.flatMap((option, optionIndex) =>
                lang === 'ja' ? /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(option) ? [optionIndex] : []
                  : lang === 'ru' ? /\p{Script=Cyrillic}/u.test(option) ? [optionIndex] : []
                    : lang === 'ar' ? /\p{Script=Arabic}/u.test(option) ? [optionIndex] : []
                      : [])}
              onAnswer={handleQuizAnswer} />
          </div>
        ))}
      </div>

      {completed && (
        <div className="mt-6 rounded-2xl border border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <p className="font-semibold text-green-800 dark:text-green-200">
            {previousCompletion && !freshlyCompleted ? '✓ Previously completed'
              : `✓ Lesson complete! Score: ${totalQuizzes > 0 ? Math.round((quizScore.correct / quizScore.total) * 100) : 100}%`}
          </p>
          <p className="mt-2 text-sm text-green-800 dark:text-green-200">No cards are added automatically. Choose any material you want to review later.</p>
          <button type="button" onClick={() => setCaptureMode('choose')}
            className="mt-2 min-h-[44px] font-medium text-indigo-600 dark:text-indigo-400">Choose review material</button>
          {completionError && <p role="alert" className="text-sm text-amber-800 dark:text-amber-300">
            Your lesson progress could not be saved.{' '}
            <button type="button" onClick={() => setCompletionRetry((previous) => previous + 1)}
              className="min-h-[44px] font-medium underline">Retry saving progress</button>
          </p>}
        </div>
      )}

      {captureMode && <LessonCaptureModal items={reviewItems} diagnostics={parsed.diagnostics} language={lang} lessonId={lessonId}
        initialMode={captureMode} onClose={() => setCaptureMode(null)} onSaved={() => setCaptureRevision((previous) => previous + 1)} />}

      <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
        {previousLesson ? <button type="button" onClick={() => onNavigate(previousLesson.id)}
          className="min-h-[44px] max-w-[40%] truncate text-left text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">← {previousLesson.title}</button> : <div />}
        {nextLesson ? <button type="button" onClick={() => onNavigate(nextLesson.id)} disabled={!completed}
          className="min-h-[44px] max-w-[40%] truncate text-right text-sm font-medium text-indigo-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-indigo-400">{nextLesson.title} →</button> : <div />}
      </div>
    </div>
  );
}
