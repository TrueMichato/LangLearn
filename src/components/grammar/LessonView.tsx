import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import GrammarQuiz from './GrammarQuiz';
import { markLessonComplete, incrementAttempts } from '../../db/lessons';
import { addWord } from '../../db/words';
import { db } from '../../db/schema';
import { useXPStore } from '../../stores/xpStore';
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

interface GrammarCardData {
  rule: string;
  hint?: string;
  example?: string;
  answer?: string;
  explanation: string;
}

/** Extract grammar-card blocks from lesson markdown. */
function extractGrammarCards(md: string): GrammarCardData[] {
  const cards: GrammarCardData[] = [];
  GRAMMAR_CARD_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = GRAMMAR_CARD_REGEX.exec(md)) !== null) {
    try {
      cards.push(JSON.parse(match[1]) as GrammarCardData);
    } catch { /* skip malformed blocks */ }
  }
  return cards;
}

/** Auto-generate grammar cards from quiz data when no explicit grammar-card blocks exist. */
function cardsFromQuizzes(quizzes: QuizData[], lessonTitle: string): GrammarCardData[] {
  return quizzes.map((q) => ({
    rule: lessonTitle,
    hint: q.question,
    example: q.question,
    answer: q.options[q.answer],
    explanation: `Correct answer: ${q.options[q.answer]}`,
  }));
}

/** Add grammar Word entries for SRS review, skipping duplicates. */
async function createGrammarCards(
  cards: GrammarCardData[],
  lang: string,
  lessonId: string,
): Promise<number> {
  // Check if cards for this lesson already exist (match by tags)
  const existing = await db.words
    .where('type')
    .equals('grammar')
    .filter((w) => w.tags.includes(lessonId) && w.language === lang)
    .count();
  if (existing > 0) return 0;

  let added = 0;
  for (const card of cards) {
    await addWord({
      word: card.rule,
      reading: card.hint ?? '',
      meaning: card.explanation,
      language: lang,
      contextSentence: card.answer ?? card.example ?? '',
      sourceTextId: null,
      tags: ['grammar', lessonId],
      type: 'grammar',
    });
    added++;
  }

  if (added > 0) {
    useXPStore.getState().addXP(added * 5);
  }

  return added;
}

/** Extract target sentence, romanization, and English translation from a markdown list item. */
function parseExampleSentence(children: ReactNode): {
  word: string;
  reading: string;
  meaning: string;
  fullText: string;
} | null {
  // Flatten children text content
  const extractText = (node: ReactNode): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractText).join('');
    if (node && typeof node === 'object' && 'props' in node) {
      return extractText((node as { props: { children?: ReactNode } }).props.children ?? '');
    }
    return '';
  };

  const text = extractText(children).trim();
  // Match: TargetSentence (romanization) — English translation
  // The bold markers are already stripped by react-markdown, so we look for the text pattern.
  // Pattern: start with text, then (romanization), then — or - followed by English
  const match = text.match(/^(.+?)\s*\(([^)]+)\)\s*[—–-]\s*(.+)$/);
  if (!match) return null;

  const word = match[1].trim();
  const reading = match[2].trim();
  const meaning = match[3].trim();

  // Sanity: word should be non-latin (has CJK/Cyrillic/etc) or at least non-empty
  if (!word || !meaning) return null;

  return { word, reading, meaning, fullText: text };
}

function SaveFlashcardButton({
  word,
  reading,
  meaning,
  fullText,
  lang,
}: {
  word: string;
  reading: string;
  meaning: string;
  fullText: string;
  lang: string;
}) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state !== 'idle') return;
    setState('saving');
    try {
      await addWord({
        word,
        reading,
        meaning,
        language: lang,
        contextSentence: fullText,
        sourceTextId: null,
        tags: ['grammar'],
      });
      setState('saved');
    } catch {
      setState('idle');
    }
  };

  if (state === 'saved') {
    return (
      <span className="inline-flex items-center ml-1.5 text-green-600 dark:text-green-400 text-xs font-medium select-none">
        ✓
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === 'saving'}
      title="Save as flashcard"
      className="inline-flex items-center ml-1.5 text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs opacity-60 hover:opacity-100 transition-opacity cursor-pointer select-none disabled:opacity-30"
    >
      ➕
    </button>
  );
}

export default function LessonView({ lang, lessonId, onBack, lessons, onNavigate }: LessonViewProps) {
  const [segments, setSegments] = useState<Array<{ type: 'md'; content: string } | { type: 'quiz'; data: QuizData }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [completed, setCompleted] = useState(false);
  const [grammarCardsAdded, setGrammarCardsAdded] = useState(0);
  const attemptsIncremented = useRef(false);
  const rawMarkdown = useRef<string>('');

  // Count total quizzes in the lesson
  const totalQuizzes = segments.filter((s) => s.type === 'quiz').length;
  const lessonTitle = lessons.find((l) => l.id === lessonId)?.title ?? lessonId;

  /** Extract and save grammar cards from the lesson content. */
  const extractAndSaveGrammarCards = useCallback(async () => {
    const md = rawMarkdown.current;
    if (!md) return;

    // Try explicit grammar-card blocks first
    let cards = extractGrammarCards(md);

    // Fall back to auto-generating from quizzes
    if (cards.length === 0) {
      const quizzes = segments
        .filter((s): s is { type: 'quiz'; data: QuizData } => s.type === 'quiz')
        .map((s) => s.data);
      if (quizzes.length > 0) {
        cards = cardsFromQuizzes(quizzes, lessonTitle);
      }
    }

    if (cards.length > 0) {
      const added = await createGrammarCards(cards, lang, lessonId);
      if (added > 0) setGrammarCardsAdded(added);
    }
  }, [lang, lessonId, lessonTitle, segments]);

  const handleQuizAnswer = useCallback(
    (correct: boolean) => {
      setQuizScore((prev) => {
        const next = { correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 };
        // Check if this was the last quiz
        if (next.total === totalQuizzes) {
          const score = Math.round((next.correct / next.total) * 100);
          markLessonComplete(lang, lessonId, score);
          setCompleted(true);
          extractAndSaveGrammarCards();
        }
        return next;
      });
    },
    [totalQuizzes, lang, lessonId, extractAndSaveGrammarCards],
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
        rawMarkdown.current = md;
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

        // If no quizzes, mark complete immediately and extract grammar cards
        const hasQuizzes = parts.some((p) => p.type === 'quiz');
        if (!hasQuizzes) {
          markLessonComplete(lang, lessonId, 100);
          setCompleted(true);
          const cards = extractGrammarCards(md);
          if (cards.length > 0) {
            createGrammarCards(cards, lang, lessonId).then((added) => {
              if (added > 0) setGrammarCardsAdded(added);
            });
          }
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
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            style={{ width: `${quizProgressPct}%` }}
          />
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
                  const parsed = parseExampleSentence(children);
                  if (parsed) {
                    return (
                      <li {...props}>
                        {children}
                        <SaveFlashcardButton {...parsed} lang={lang} />
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
            <div key={i} className="my-6 border-l-4 border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 rounded-r-2xl pl-0">
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
          {grammarCardsAdded > 0 && (
            <p className="text-violet-700 dark:text-violet-300 text-sm mt-2 font-medium">
              🃏 Added {grammarCardsAdded} grammar point{grammarCardsAdded > 1 ? 's' : ''} for SRS review
            </p>
          )}
        </div>
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
