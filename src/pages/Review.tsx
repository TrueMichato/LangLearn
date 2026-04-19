import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getDueReviews, getRandomWords } from '../db/words';
import { processReview } from '../db/reviews';
import { useReviewStore, type QueueItem, type PracticeMode } from '../stores/reviewStore';
import { useTimerStore } from '../stores/timerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useStudySetsStore } from '../stores/studySetsStore';
import { getFilteredReviewQueue } from '../lib/filtered-review';
import Flashcard from '../components/srs/Flashcard';
import ReverseCard from '../components/srs/ReverseCard';
import ListeningCard from '../components/srs/ListeningCard';
import MultipleChoiceCard from '../components/srs/MultipleChoiceCard';
import ClozeCard from '../components/srs/ClozeCard';
import StudyCard from '../components/srs/StudyCard';
import GradeButtons from '../components/srs/GradeButtons';
import AddWordModal from '../components/srs/AddWordModal';
import PracticeModeSelector from '../components/srs/PracticeModeSelector';
import { SkeletonFlashcard } from '../components/common/Skeleton';
import { assignCardType, selectDistractors } from '../lib/card-types';
import type { CardType } from '../lib/card-types';
import type { SM2Grade } from '../lib/sm2';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const CARD_TYPE_LABELS: Record<string, { label: string; bg: string }> = {
  classic: { label: 'Classic', bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' },
  reverse: { label: 'Reverse', bg: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' },
  listening: { label: 'Listening', bg: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300' },
  'multiple-choice': { label: 'Pick the meaning', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  cloze: { label: 'Fill in the blank', bg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' },
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
  const { isRunning, start } = useTimerStore();
  const reviewBatchSize = useSettingsStore((s) => s.reviewBatchSize);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('set');
  const studySet = useStudySetsStore((s) => s.sets.find((ss) => ss.id === setId));
  const [loading, setLoading] = useState(true);
  const [totalDue, setTotalDue] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);

  const [shaking, setShaking] = useState(false);

  const loadCards = useCallback(async (mode?: PracticeMode) => {
    setLoading(true);

    let due: Array<{ word: import('../db/schema').Word; review: import('../db/schema').Review }>;
    if (setId) {
      due = await getFilteredReviewQueue(setId);
    } else {
      due = await getDueReviews();
    }

    // Shuffle
    for (let i = due.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [due[i], due[j]] = [due[j], due[i]];
    }
    setTotalDue(due.length);
    const batch = reviewBatchSize > 0 ? due.slice(0, reviewBatchSize) : due;

    const activeMode = mode ?? practiceMode;

    // Assign card types and prepare distractors
    const items: QueueItem[] = [];
    for (const item of batch) {
      let cardType = activeMode
        ? applyPracticeMode(assignCardType(item.review.repetitions), activeMode)
        : assignCardType(item.review.repetitions);

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
  }, [setQueue, reviewBatchSize, setId, practiceMode]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleSelectMode = (mode: PracticeMode) => {
    setPracticeMode(mode);
    loadCards(mode);
  };

  const handleGrade = async (grade: SM2Grade) => {
    const current = queue[currentIndex];
    if (!current?.review.id) return;

    if (!isRunning) start('srs');

    await processReview(current.review.id, grade);

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
      Escape: () => navigate('/'),
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
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-5xl mb-4">🎉</p>
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">No cards to review!</p>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Add words from the Reader or check back later.
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
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

  if (!practiceMode) {
    return <PracticeModeSelector onSelect={handleSelectMode} />;
  }

  if (currentIndex >= queue.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-6xl mb-4 animate-[pop_0.5s_ease-out]">🎉</p>
        <p className="text-2xl font-bold mb-1 bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
          Session Complete!
        </p>
        <p className="text-slate-500 dark:text-slate-400 mt-2 animate-[countUp_0.3s_ease-out]">
          You reviewed <span className="font-semibold text-slate-700 dark:text-slate-200">{cardsReviewed}</span> cards. Great effort!
        </p>
        <button
          onClick={() => {
            reset();
            loadCards();
          }}
          className="mt-5 gradient-primary text-white px-6 py-2.5 rounded-xl press-feedback hover:opacity-90 transition-opacity font-medium"
        >
          🔁 Review Again
        </button>
      </div>
    );
  }

  const activeCard = current!;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            {studySet ? `Review: ${studySet.name}` : 'Review'}
          </h2>
          {reviewBatchSize > 0 && totalDue > queue.length && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Reviewing {queue.length} of {totalDue} due cards
            </p>
          )}
        </div>
        <span className="text-sm text-slate-400 dark:text-slate-500">
          {currentIndex + 1} / {queue.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-4 overflow-hidden">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
          style={{ width: `${Math.round(((currentIndex) / queue.length) * 100)}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-slate-600 dark:text-slate-300 leading-none">
          {Math.round(((currentIndex) / queue.length) * 100)}%
        </span>
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
              <div className="hidden sm:flex justify-center gap-4 mt-2 text-xs text-slate-400 dark:text-slate-500">
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
              <div className="hidden sm:flex justify-center gap-4 mt-2 text-xs text-slate-400 dark:text-slate-500">
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
              <div className="hidden sm:flex justify-center gap-4 mt-2 text-xs text-slate-400 dark:text-slate-500">
                <span>Space: flip</span>
                <span>1-4: grade</span>
                <span>Esc: exit</span>
              </div>
            </>
          )}
        </>
      )}
      </div>

      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
        No worries if you didn't know — it'll come back later 💪
      </p>
    </div>
  );
}
