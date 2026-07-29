import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getDueReviews, getRandomWords, getTotalWordCount } from '../db/words';
import { processReview } from '../db/reviews';
import { useReviewStore, type QueueItem, type PracticeMode } from '../stores/reviewStore';
import { useTimerStore } from '../stores/timerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useStudySetsStore } from '../stores/studySetsStore';
import { getFilteredReviewQueue } from '../lib/filtered-review';
import { getStudySuggestions, type StudySuggestion } from '../lib/study-suggestions';
import { ROUTES } from '../lib/routes';
import { getMistakeDeck, getLeechWordIds } from '../lib/mistakes';
import { getTopicDeck } from '../lib/grammar-topics';
import { composeAdaptiveBatch } from '../lib/adaptive';
import { get7DayRetention } from '../lib/analytics';
import { getLanguageFlag } from '../lib/languages';
import Flashcard from '../components/srs/Flashcard';
import ReverseCard from '../components/srs/ReverseCard';
import ListeningCard from '../components/srs/ListeningCard';
import MultipleChoiceCard from '../components/srs/MultipleChoiceCard';
import ClozeCard from '../components/srs/ClozeCard';
import GrammarCard from '../components/srs/GrammarCard';
import StudyCard from '../components/srs/StudyCard';
import GradeButtons from '../components/srs/GradeButtons';
import AddWordModal from '../components/srs/AddWordModal';
import PracticeModeSelector from '../components/srs/PracticeModeSelector';
import { SkeletonFlashcard } from '../components/common/Skeleton';
import { assignCardType, selectDistractors } from '../lib/card-types';
import type { CardType } from '../lib/card-types';
import type { SM2Grade } from '../lib/sm2';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const PRACTICE_MODE_LABELS: Record<string, string> = {
  'word-to-meaning': 'Word → Meaning',
  'meaning-to-word': 'Meaning → Word',
  random: 'Random',
  both: 'Both sides',
};

const PRACTICE_MODE_KEY = 'langlearn-practice-mode';
const PRACTICE_MODES: PracticeMode[] = [
  'word-to-meaning',
  'meaning-to-word',
  'random',
  'both',
];

function loadRememberedMode(): PracticeMode {
  try {
    const raw = localStorage.getItem(PRACTICE_MODE_KEY);
    if (raw && (PRACTICE_MODES as string[]).includes(raw)) return raw as PracticeMode;
  } catch {
    /* storage unavailable — fall through to the default */
  }
  return 'word-to-meaning';
}

function rememberMode(mode: PracticeMode) {
  try {
    localStorage.setItem(PRACTICE_MODE_KEY, mode);
  } catch {
    /* non-fatal: the mode just won't persist */
  }
}

const CARD_TYPE_LABELS: Record<string, { label: string; bg: string }> = {
  classic: { label: 'Classic', bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' },
  reverse: { label: 'Reverse', bg: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' },
  listening: { label: 'Listening', bg: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300' },
  'multiple-choice': { label: 'Pick the meaning', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  cloze: { label: 'Fill in the blank', bg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' },
  grammar: { label: 'Grammar', bg: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' },
  study: { label: 'Study', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
};

function applyPracticeMode(_baseType: CardType, mode: PracticeMode): CardType {
  switch (mode) {
    case 'word-to-meaning':
      return 'classic';
    case 'meaning-to-word':
      return 'reverse';
    case 'both':
      return 'study' as CardType;
    case 'random':
      return Math.random() < 0.5 ? 'classic' : 'reverse';
  }
}

export default function ReviewPage() {
  const { queue, currentIndex, isFlipped, cardsReviewed, practiceMode, setQueue, flip, next, reset, setPracticeMode } =
    useReviewStore();
  const { isRunning, start, stop: stopTimer } = useTimerStore();
  const reviewBatchSize = useSettingsStore((s) => s.reviewBatchSize);
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const adaptiveReview = useSettingsStore((s) => s.adaptiveReview);
  const scheduler = useSettingsStore((s) => s.scheduler);
  const fsrsRequestRetention = useSettingsStore((s) => s.fsrsRequestRetention);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('set');
  const deck = searchParams.get('deck');
  const isMistakeDeck = deck === 'mistakes';
  const topicId = deck === 'topic' ? searchParams.get('topic') : null;
  const studySet = useStudySetsStore((s) => s.sets.find((ss) => ss.id === setId));
  const [loading, setLoading] = useState(true);
  const [totalDue, setTotalDue] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);

  const [shaking, setShaking] = useState(false);
  const [retention, setRetention] = useState<{ percent: number; reviewCount: number } | null>(null);
  const [nextUp, setNextUp] = useState<StudySuggestion | null>(null);
  /* Choosing a recall direction is meaningless before you've seen a single
     card, so it must not stand between a beginner and their first review.
     We start in the remembered mode (Word -> Meaning the first time) and put
     the chooser behind an explicit control on the review screen instead. */
  const [showModePicker, setShowModePicker] = useState(false);
  // Language filter: null = per-language (default), 'all' = cross-language
  const [reviewLanguage, setReviewLanguage] = useState<string | null>(null);

  useEffect(() => {
    get7DayRetention().then(setRetention);
  }, []);

  const loadCards = useCallback(async (mode?: PracticeMode) => {
    setLoading(true);

    let due: Array<{ word: import('../db/schema').Word; review: import('../db/schema').Review }>;
    if (topicId) {
      due = await getTopicDeck(topicId, reviewLanguage && reviewLanguage !== 'all' ? reviewLanguage : undefined);
    } else if (isMistakeDeck) {
      due = await getMistakeDeck(reviewLanguage && reviewLanguage !== 'all' ? [reviewLanguage] : activeLanguages);
    } else if (setId) {
      due = await getFilteredReviewQueue(setId);
    } else if (reviewLanguage && reviewLanguage !== 'all') {
      // Single language selected
      due = await getDueReviews(reviewLanguage);
    } else if (!reviewLanguage) {
      // Default: only cards from active languages
      const allDue: typeof due = [];
      for (const lang of activeLanguages) {
        const langDue = await getDueReviews(lang);
        allDue.push(...langDue);
      }
      due = allDue;
    } else {
      // 'all' — cross-language
      due = await getDueReviews();
    }

    // Shuffle
    for (let i = due.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [due[i], due[j]] = [due[j], due[i]];
    }
    setTotalDue(due.length);
    setTotalWords(await getTotalWordCount());

    // Adaptive composition weights the standard due queue toward weaker cards.
    // Purpose-built decks (mistakes, topic, study set) already curate their items.
    const isCuratedDeck = isMistakeDeck || !!topicId || !!setId;
    const batch =
      adaptiveReview && !isCuratedDeck
        ? composeAdaptiveBatch(due, reviewBatchSize)
        : reviewBatchSize > 0
          ? due.slice(0, reviewBatchSize)
          : due;

    const activeMode = mode ?? practiceMode;

    // Leeches get the gentler, auto-graded multiple-choice variant for support.
    const leechIds = await getLeechWordIds(
      reviewLanguage && reviewLanguage !== 'all' ? [reviewLanguage] : activeLanguages
    );

    // Assign card types and prepare distractors
    const items: QueueItem[] = [];
    for (const item of batch) {
      let cardType = activeMode
        ? applyPracticeMode(assignCardType(item.review.repetitions, item.word.type), activeMode)
        : assignCardType(item.review.repetitions, item.word.type);

      // Grammar words always use grammar card type regardless of practice mode
      if (item.word.type === 'grammar') {
        cardType = 'grammar';
      } else if (
        leechIds.has(item.word.id!) &&
        (cardType === 'classic' || cardType === 'reverse')
      ) {
        // Offer a gentler recognition card for cards the learner keeps missing.
        cardType = 'multiple-choice';
      }

      let distractors: string[] | undefined;
      if (cardType === 'cloze' && !item.word.contextSentence && item.word.word.length <= 2) {
        cardType = 'classic';
      }

      if (cardType === 'multiple-choice') {
        const others = await getRandomWords(item.word.language, [item.word.id!], 6);
        if (others.length < 3) {
          cardType = 'classic';
        } else {
          distractors = selectDistractors(item.word.meaning, others);
        }
      }

      items.push({ ...item, cardType, distractors });
    }

    setQueue(items);
    setLoading(false);
  }, [setQueue, reviewBatchSize, setId, practiceMode, reviewLanguage, activeLanguages, isMistakeDeck, topicId, adaptiveReview]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  useEffect(() => {
    if (practiceMode || showModePicker) return;
    setPracticeMode(loadRememberedMode());
  }, [practiceMode, showModePicker, setPracticeMode]);

  /* When the queue runs out the session really is over: stop the clock so the
     timer doesn't keep billing time to "Review" while the learner wanders the
     app, and work out what to point them at next. */
  const sessionOver = !loading && queue.length > 0 && currentIndex >= queue.length;
  useEffect(() => {
    if (!sessionOver) return;
    let live = true;
    stopTimer();
    getStudySuggestions(activeLanguages).then((all) => {
      if (!live) return;
      const best = all
        .filter((sug) => sug.route !== ROUTES.review)
        .sort((a, b) => b.priority - a.priority)[0];
      setNextUp(best ?? null);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionOver]);

  const handleSelectMode = (mode: PracticeMode) => {
    rememberMode(mode);
    setShowModePicker(false);
    setPracticeMode(mode);
    loadCards(mode);
  };

  const handleExit = () => {
    reset();
    navigate('/');
  };

  const handleLanguageChange = (lang: string | null) => {
    setReviewLanguage(lang);
  };

  const handleGrade = async (grade: SM2Grade) => {
    const current = queue[currentIndex];
    if (!current?.review.id) return;

    if (!isRunning) start('srs');

    await processReview(current.review.id, grade, {
      scheduler,
      requestRetention: fsrsRequestRetention,
    });

    if (grade < 3) {
      const updated = [...queue];
      updated.push(current);
      useReviewStore.setState({ queue: updated });
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }

    next();
  };

  const current = currentIndex < queue.length ? queue[currentIndex] : undefined;
  const isStudyMode = current?.cardType === ('study' as CardType);
  const isSelfGrading = current?.cardType === 'multiple-choice' || current?.cardType === 'cloze' || isStudyMode;
  const canGrade = isFlipped && !isSelfGrading;

  const GRADE_MAP: Record<string, SM2Grade> = { '1': 0, '2': 3, '3': 4, '4': 5 };

  const shortcuts = useMemo(() => {
    const map: Record<string, () => void> = {
      Escape: handleExit,
    };

    if (current && !isSelfGrading && !isFlipped) {
      map['Space'] = flip;
    }

    if (canGrade) {
      for (const [key, grade] of Object.entries(GRADE_MAP)) {
        map[key] = () => handleGrade(grade);
      }
    }

    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFlipped, isSelfGrading, canGrade, current, navigate]);

  useKeyboardShortcuts(shortcuts, !loading && !showAddModal);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div className="skeleton h-6 w-1/3" />
          <div className="skeleton h-4 w-12" />
        </div>
        <SkeletonFlashcard />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton rounded-xl min-h-[52px]" />
          ))}
        </div>
      </div>
    );
  }

  if (queue.length === 0) {
    if (isMistakeDeck) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-5xl mb-4">✨</p>
          <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">No misses to fix!</p>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            You've cleared your recent slip-ups. Beautiful work. 💪
          </p>
          <button
            onClick={() => navigate('/review')}
            className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Go to Review
          </button>
        </div>
      );
    }
    if (totalWords === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center px-6">
          <p className="text-5xl mb-4">🌱</p>
          <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">
            Nothing to review yet
          </p>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
            Reviews appear here once you've finished your first lesson.
          </p>
          <button
            onClick={() => navigate('/vocab-lessons')}
            className="mt-4 min-h-[44px] bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Start your first lesson →
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-3 min-h-[44px] px-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Add a word manually
          </button>
          <AddWordModal
            isOpen={showAddModal}
            onClose={() => { setShowAddModal(false); loadCards(); }}
          />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-5xl mb-4">🎉</p>
        <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">You're all caught up!</p>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Nothing is due right now. New cards arrive as you learn.
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 min-h-[44px] bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          ➕ Add some words
        </button>
        <AddWordModal
          isOpen={showAddModal}
          onClose={() => { setShowAddModal(false); loadCards(); }}
        />
      </div>
    );
  }

  if (showModePicker || !practiceMode) {
    return (
      <div>
        {/* Language filter — only when user has multiple active languages and no study set */}
        {!setId && activeLanguages.length > 1 && (
          <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
            <button
              onClick={() => handleLanguageChange(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                reviewLanguage === null
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              My Languages
            </button>
            {activeLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  reviewLanguage === lang
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {getLanguageFlag(lang)} {lang.toUpperCase()}
              </button>
            ))}
            <button
              onClick={() => handleLanguageChange('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                reviewLanguage === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              🌐 All
            </button>
          </div>
        )}
        <PracticeModeSelector onSelect={handleSelectMode} retention={retention} />
      </div>
    );
  }

  if (currentIndex >= queue.length) {
    return (
      <div className="page-enter text-center py-8">
        <p className="text-6xl mb-4 animate-[pop_0.5s_ease-out]">🎉</p>
        <p className="text-2xl font-bold mb-1 text-indigo-600 dark:text-indigo-400">
          Session Complete!
        </p>
        <p className="text-slate-600 dark:text-slate-300 mt-2 animate-[countUp_0.3s_ease-out]">
          You reviewed <span className="font-semibold text-slate-800 dark:text-slate-100">{cardsReviewed}</span> cards. Great effort!
        </p>

        {/* The end of a session is the one moment the app knows exactly what
            the learner just did, so it is the best place to point at what
            comes next. It used to offer only "Review Again", which is a
            cul-de-sac: the session ended and the app had nothing to say. */}
        <div className="mt-6 text-left">
          {nextUp ? (
            <button
              onClick={() => navigate(nextUp.route)}
              className="w-full flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 text-left hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors min-h-[44px]"
            >
              <span className="text-2xl shrink-0">{nextUp.icon}</span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                  Next up
                </span>
                <span className="block font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {nextUp.title}
                </span>
                <span className="block text-sm text-slate-600 dark:text-slate-300 truncate">
                  {nextUp.description}
                </span>
              </span>
              <span className="ml-auto text-indigo-600 dark:text-indigo-300 shrink-0">→</span>
            </button>
          ) : (
            <p className="rounded-2xl border border-slate-200/70 dark:border-white/10 p-4 text-sm text-slate-600 dark:text-slate-300">
              You're all caught up. New reviews appear as they come due — see
              you tomorrow. 🌱
            </p>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => navigate('/')}
            className="flex-1 min-h-[44px] rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors press-feedback"
          >
            Back to Home
          </button>
          <button
            onClick={() => {
              reset();
              loadCards();
            }}
            className="flex-1 min-h-[44px] rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors press-feedback"
          >
            🔁 Review again
          </button>
        </div>
      </div>
    );
  }

  const activeCard = current!;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleExit}
            className="p-1.5 -ml-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Exit review"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <div>
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              {isMistakeDeck ? '💪 Fix your misses' : topicId ? `🎯 ${topicId}` : studySet ? `Review: ${studySet.name}` : 'Review'}
            </h2>
            {reviewBatchSize > 0 && totalDue > queue.length && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reviewing {queue.length} of {totalDue} due cards
              </p>
            )}
            {/* The direction no longer blocks entry, so it needs to stay
                visible and reversible from inside the session. */}
            <button
              onClick={() => setShowModePicker(true)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {PRACTICE_MODE_LABELS[practiceMode] ?? 'Practice mode'} · Change
            </button>
          </div>
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {currentIndex + 1} / {queue.length}
        </span>
      </div>

      {/* Progress bar — the "N / M" counter above already states the numbers,
          so the bar stays purely visual instead of overlaying 9px text. */}
      <div className="relative w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-4 overflow-hidden">
        <div
          className="h-2.5 rounded-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${Math.round(((currentIndex) / queue.length) * 100)}%` }}
        />
      </div>

      <div className="flex justify-center mb-2">
        {(() => {
          const typeInfo = CARD_TYPE_LABELS[activeCard.cardType];
          const bg = typeInfo?.bg ?? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
          const label = typeInfo?.label ?? activeCard.cardType;
          return (
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${bg}`}>
              {label}
            </span>
          );
        })()}
      </div>

      <div className={shaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}>
        {activeCard.cardType === ('study' as CardType) && (
        <>
          <StudyCard word={activeCard.word} />
          <GradeButtons onGrade={handleGrade} />
        </>
      )}

      {activeCard.cardType === 'reverse' && (
        <>
          <ReverseCard word={activeCard.word} isFlipped={isFlipped} onFlip={flip} />
          {isFlipped && (
            <>
              <GradeButtons onGrade={handleGrade} />
              <div className="hidden sm:flex justify-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Space: flip</span>
                <span>1-4: grade</span>
                <span>Esc: exit</span>
              </div>
            </>
          )}
        </>
      )}

      {activeCard.cardType === 'listening' && (
        <>
          <ListeningCard word={activeCard.word} isFlipped={isFlipped} onFlip={flip} />
          {isFlipped && (
            <>
              <GradeButtons onGrade={handleGrade} />
              <div className="hidden sm:flex justify-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Space: flip</span>
                <span>1-4: grade</span>
                <span>Esc: exit</span>
              </div>
            </>
          )}
        </>
      )}

      {activeCard.cardType === 'multiple-choice' && activeCard.distractors && (
        <MultipleChoiceCard
          word={activeCard.word}
          distractors={activeCard.distractors}
          onGrade={handleGrade}
        />
      )}

      {activeCard.cardType === 'cloze' && (
        <ClozeCard word={activeCard.word} onGrade={handleGrade} />
      )}

      {activeCard.cardType === 'classic' && (
        <>
          <Flashcard word={activeCard.word} isFlipped={isFlipped} onFlip={flip} />
          {isFlipped && (
            <>
              <GradeButtons onGrade={handleGrade} />
              <div className="hidden sm:flex justify-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Space: flip</span>
                <span>1-4: grade</span>
                <span>Esc: exit</span>
              </div>
            </>
          )}
        </>
      )}

      {activeCard.cardType === 'grammar' && (
        <>
          <GrammarCard word={activeCard.word} isFlipped={isFlipped} onFlip={flip} />
          {isFlipped && (
            <>
              <GradeButtons onGrade={handleGrade} />
              <div className="hidden sm:flex justify-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Space: flip</span>
                <span>1-4: grade</span>
                <span>Esc: exit</span>
              </div>
            </>
          )}
        </>
      )}
      </div>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
        No worries if you didn't know — it'll come back later 💪
      </p>
    </div>
  );
}
