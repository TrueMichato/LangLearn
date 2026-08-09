import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import GrammarQuiz from './GrammarQuiz';
import LessonCaptureModal from './LessonCaptureModal';
import { markLessonComplete, incrementAttempts } from '../../db/lessons';
import {
  syncLessonGrammarCards,
  saveCandidates,
  findSavedCandidates,
  type GrammarCardSync,
} from '../../db/lesson-cards';
import { useXPStore } from '../../stores/xpStore';
import { type GrammarCardSource } from '../../lib/grammar-cards';
import {
  parseLessonCandidates,
  indexBySourceText,
  matchCandidate,
  nodeText,
  type CaptureCandidate,
} from '../../lib/lesson-capture';
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

const QUIZ_REGEX = /<!--\s*quiz:(.*?)\s*-->/g;
const GRAMMAR_CARD_REGEX = /<!--\s*grammar-card:\s*(.*?)\s*-->/g;

/** Extract grammar-card blocks from lesson markdown. */
function extractGrammarCards(md: string): GrammarCardSource[] {
  const cards: GrammarCardSource[] = [];
  GRAMMAR_CARD_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = GRAMMAR_CARD_REGEX.exec(md)) !== null) {
    try {
      cards.push(JSON.parse(match[1]) as GrammarCardSource);
    } catch { /* skip malformed blocks */ }
  }
  return cards;
}

/** Add or repair this lesson's grammar cards. */
async function syncGrammarCards(
  cards: GrammarCardSource[],
  lang: string,
  lessonId: string,
): Promise<GrammarCardSync> {
  const result = await syncLessonGrammarCards(cards, lang, lessonId);
  if (result.added > 0) {
    useXPStore.getState().addXP(result.added * 5);
  }
  return result;
}

function SaveFlashcardButton({
  candidate,
  lang,
  lessonId,
  alreadySaved,
}: {
  candidate: CaptureCandidate;
  lang: string;
  lessonId: string;
  alreadySaved: boolean;
}) {
  // Saved-ness is derived rather than mirrored into state: the lesson re-checks
  // the deck after every capture, so copying the prop into state would leave two
  // sources of truth that drift apart during a bulk save.
  const [pending, setPending] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const saved = alreadySaved || justSaved;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved || pending) return;
    setPending(true);
    try {
      await saveCandidates([candidate], lang, lessonId);
      setJustSaved(true);
    } finally {
      setPending(false);
    }
  };

  if (saved) {
    return (
      <span
        className="inline-flex items-center ml-1.5 text-green-600 dark:text-green-400 text-xs font-medium select-none"
        title="Saved to your deck"
      >
        ✓
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label={`Save ${candidate.word} as a flashcard`}
      title="Save as flashcard"
      className="inline-flex items-center ml-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs opacity-60 hover:opacity-100 transition-opacity cursor-pointer select-none disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 rounded"
    >
      ➕
    </button>
  );
}

export default function LessonView({ lang, lessonId, onBack, lessons, onNavigate }: LessonViewProps) {
  const [segments, setSegments] = useState<Array<{ type: 'md'; content: string } | { type: 'quiz'; data: QuizData }>>([]);
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [cardSync, setCardSync] = useState<GrammarCardSync | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [capturedCount, setCapturedCount] = useState(0);
  const attemptsIncremented = useRef(false);
  const completionRecorded = useRef(false);
  const rawMarkdown = useRef<string>('');

  // Count total quizzes in the lesson
  const totalQuizzes = segments.filter((s) => s.type === 'quiz').length;

  // Derived rather than stored: the lesson is finished once its content has
  // loaded and every quiz has been answered. A lesson with no quizzes is
  // complete on arrival, which is how it has always behaved.
  const completed = segments.length > 0 && quizScore.total >= totalQuizzes;

  const candidates = useMemo(() => parseLessonCandidates(markdown), [markdown]);
  const candidatesByLine = useMemo(() => indexBySourceText(candidates), [candidates]);

  // Terms already in the deck render as saved, so re-opening a lesson never
  // offers to add the same word twice.
  useEffect(() => {
    let active = true;
    findSavedCandidates(candidates, lang).then((saved) => {
      if (active) setSavedIds(saved);
    });
    return () => {
      active = false;
    };
  }, [candidates, lang, capturedCount]);

  /**
   * Add or repair this lesson's grammar cards.
   *
   * Lessons without grammar-card blocks produce no cards. Cards used to be
   * invented from the quiz questions instead, which produced prompts like
   * "Which particle marks the topic?" with the lesson title as the rule —
   * technically a card, but not something anyone could learn from.
   */
  const syncCards = useCallback(async () => {
    const md = rawMarkdown.current;
    if (!md) return;
    const cards = extractGrammarCards(md);
    if (cards.length === 0) return;
    const result = await syncGrammarCards(cards, lang, lessonId);
    if (result.added > 0 || result.repaired > 0) setCardSync(result);
  }, [lang, lessonId]);

  const handleQuizAnswer = useCallback((correct: boolean) => {
    // Scoring only. Completion is handled in an effect below, because React may
    // call a state updater more than once and running the completion work here
    // duplicated every grammar card and double-counted the attempt.
    setQuizScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
  }, []);

  useEffect(() => {
    if (!completed || completionRecorded.current) return;
    completionRecorded.current = true;
    const score = totalQuizzes > 0 ? Math.round((quizScore.correct / totalQuizzes) * 100) : 100;
    markLessonComplete(lang, lessonId, score);
    syncCards();
  }, [completed, quizScore, totalQuizzes, lang, lessonId, syncCards]);

  useEffect(() => {
    setLoading(true);
    setError(false);

    fetch(`${import.meta.env.BASE_URL}content/grammar/${lang}/${lessonId}.md`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .then((md) => {
        rawMarkdown.current = md;
        setMarkdown(md);
        // Grammar-card blocks are SRS metadata only — strip them from the
        // displayed markdown so they never render as raw text. The full md
        // (with the blocks) is kept in rawMarkdown.current for card extraction.
        GRAMMAR_CARD_REGEX.lastIndex = 0;
        const displayMd = md.replace(GRAMMAR_CARD_REGEX, '');
        const parts: typeof segments = [];
        let lastIndex = 0;

        // Reset regex state
        QUIZ_REGEX.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = QUIZ_REGEX.exec(displayMd)) !== null) {
          if (match.index > lastIndex) {
            parts.push({ type: 'md', content: displayMd.slice(lastIndex, match.index) });
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

        if (lastIndex < displayMd.length) {
          parts.push({ type: 'md', content: displayMd.slice(lastIndex) });
        }

        setSegments(parts);
        setLoading(false);

        // Increment attempts when lesson loads
        if (!attemptsIncremented.current) {
          attemptsIncremented.current = true;
          incrementAttempts(lang, lessonId);
        }
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [lang, lessonId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-4 w-24" />
        <SkeletonList count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400 mb-4">Lesson not found.</p>
        <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 font-medium press-feedback">
          ← Back to lessons
        </button>
      </div>
    );
  }

  const quizProgressPct = totalQuizzes > 0 ? Math.round((quizScore.total / totalQuizzes) * 100) : 0;
  const unsavedCount = candidates.filter((c) => !savedIds.has(c.id)).length;

  return (
    <div>
      <button
        onClick={onBack}
        className="text-indigo-600 dark:text-indigo-400 font-medium text-sm mb-4 hover:underline press-feedback"
      >
        ← Back to lessons
      </button>

      {/* Quiz progress bar */}
      {totalQuizzes > 0 && (
        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${quizProgressPct}%` }}
          />
        </div>
      )}

      {candidates.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-800 p-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {unsavedCount > 0
              ? `${unsavedCount} word${unsavedCount === 1 ? '' : 's'} to save from this lesson`
              : 'All words from this lesson are in your deck'}
          </p>
          <button
            onClick={() => setCaptureOpen(true)}
            disabled={unsavedCount === 0}
            className="shrink-0 min-h-[44px] px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Save vocabulary
          </button>
        </div>
      )}

      <div className="prose prose-sm max-w-none dark:prose-invert">
        {segments.map((seg, i) =>
          seg.type === 'md' ? (
            <ReactMarkdown
              key={i}
              remarkPlugins={[remarkGfm]}
              components={{
                li: ({ children, ...props }) => {
                  const candidate = matchCandidate(candidatesByLine, nodeText(children));
                  if (candidate) {
                    return (
                      <li {...props}>
                        {children}
                        <SaveFlashcardButton
                          candidate={candidate}
                          lang={lang}
                          lessonId={lessonId}
                          alreadySaved={savedIds.has(candidate.id)}
                        />
                      </li>
                    );
                  }
                  return <li {...props}>{children}</li>;
                },
              }}
            >
              {seg.content}
            </ReactMarkdown>
          ) : (
            <div key={i} className="my-6 border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl">
              <GrammarQuiz {...seg.data} onAnswer={handleQuizAnswer} />
            </div>
          )
        )}
      </div>
      {completed && (
        <div className="mt-6 rounded-2xl border border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-800 p-4 text-center">
          <p className="text-green-800 dark:text-green-200 font-semibold">
            ✅ Lesson complete! Score: {totalQuizzes > 0 ? Math.round((quizScore.correct / quizScore.total) * 100) : 100}%
          </p>
          {cardSync && cardSync.added > 0 && (
            <p className="text-indigo-700 dark:text-indigo-300 text-sm mt-2 font-medium">
              🃏 Added {cardSync.added} grammar point{cardSync.added > 1 ? 's' : ''} for SRS review
            </p>
          )}
          {cardSync && cardSync.repaired > 0 && (
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
              Updated {cardSync.repaired} existing grammar card
              {cardSync.repaired > 1 ? 's' : ''} with the latest wording.
            </p>
          )}
        </div>
      )}

      {captureOpen && (
        <LessonCaptureModal
          candidates={candidates}
          language={lang}
          lessonId={lessonId}
          onClose={() => setCaptureOpen(false)}
          onSaved={(count) => setCapturedCount((prev) => prev + count)}
        />
      )}
      {(() => {
        const currentIndex = lessons.findIndex((l) => l.id === lessonId);
        const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
        const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
        return (
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
            {prevLesson ? (
              <button
                onClick={() => onNavigate(prevLesson.id)}
                className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline truncate max-w-[40%] text-left press-feedback"
              >
                ← {prevLesson.title}
              </button>
            ) : (
              <div />
            )}
            {nextLesson ? (
              <button
                onClick={() => onNavigate(nextLesson.id)}
                disabled={!completed}
                className={`text-sm font-medium truncate max-w-[40%] text-right press-feedback ${completed ? 'text-indigo-600 dark:text-indigo-400 hover:underline' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
              >
                {nextLesson.title} →
              </button>
            ) : (
              <div />
            )}
          </div>
        );
      })()}
    </div>
  );
}
