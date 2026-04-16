import { useEffect, useState, useCallback } from 'react';
import { getDueReviews, getRandomWords } from '../db/words';
import { processReview } from '../db/reviews';
import { useReviewStore, type QueueItem } from '../stores/reviewStore';
import { useTimerStore } from '../stores/timerStore';
import { useSettingsStore } from '../stores/settingsStore';
import Flashcard from '../components/srs/Flashcard';
import ReverseCard from '../components/srs/ReverseCard';
import ListeningCard from '../components/srs/ListeningCard';
import MultipleChoiceCard from '../components/srs/MultipleChoiceCard';
import GradeButtons from '../components/srs/GradeButtons';
import AddWordModal from '../components/srs/AddWordModal';
import { assignCardType, selectDistractors } from '../lib/card-types';
import type { SM2Grade } from '../lib/sm2';

const CARD_TYPE_LABELS: Record<string, string> = {
  classic: 'Classic',
  reverse: 'Reverse',
  listening: 'Listening',
  'multiple-choice': 'Pick the meaning',
};

export default function ReviewPage() {
  const { queue, currentIndex, isFlipped, cardsReviewed, setQueue, flip, next, reset } =
    useReviewStore();
  const { isRunning, start } = useTimerStore();
  const reviewBatchSize = useSettingsStore((s) => s.reviewBatchSize);
  const [loading, setLoading] = useState(true);
  const [totalDue, setTotalDue] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadCards = useCallback(async () => {
    setLoading(true);
    const due = await getDueReviews();
    // Shuffle
    for (let i = due.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [due[i], due[j]] = [due[j], due[i]];
    }
    setTotalDue(due.length);
    const batch = reviewBatchSize > 0 ? due.slice(0, reviewBatchSize) : due;

    // Assign card types and prepare distractors
    const items: QueueItem[] = [];
    for (const item of batch) {
      let cardType = assignCardType(item.review.repetitions);

      let distractors: string[] | undefined;
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
  }, [setQueue, reviewBatchSize]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleGrade = async (grade: SM2Grade) => {
    const current = queue[currentIndex];
    if (!current?.review.id) return;

    if (!isRunning) start('srs');

    await processReview(current.review.id, grade);

    if (grade < 3) {
      // Put failed card at end of queue
      const updated = [...queue];
      updated.push(current);
      useReviewStore.setState({ queue: updated });
    }

    next();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 dark:text-gray-500">Loading cards...</p>
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

  if (currentIndex >= queue.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-5xl mb-4">✨</p>
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">Session complete!</p>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          You reviewed {cardsReviewed} cards. Great effort!
        </p>
        <button
          onClick={() => {
            reset();
            loadCards();
          }}
          className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Review again
        </button>
      </div>
    );
  }

  const current = queue[currentIndex];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Review</h2>
          {reviewBatchSize > 0 && totalDue > queue.length && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Reviewing {queue.length} of {totalDue} due cards
            </p>
          )}
        </div>
        <span className="text-sm text-gray-400 dark:text-gray-500">
          {currentIndex + 1} / {queue.length}
        </span>
      </div>

      <div className="flex justify-center mb-2">
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
          {CARD_TYPE_LABELS[current.cardType]}
        </span>
      </div>

      {current.cardType === 'reverse' && (
        <>
          <ReverseCard word={current.word} isFlipped={isFlipped} onFlip={flip} />
          {isFlipped && <GradeButtons onGrade={handleGrade} />}
        </>
      )}

      {current.cardType === 'listening' && (
        <>
          <ListeningCard word={current.word} isFlipped={isFlipped} onFlip={flip} />
          {isFlipped && <GradeButtons onGrade={handleGrade} />}
        </>
      )}

      {current.cardType === 'multiple-choice' && current.distractors && (
        <MultipleChoiceCard
          word={current.word}
          distractors={current.distractors}
          onGrade={handleGrade}
        />
      )}

      {current.cardType === 'classic' && (
        <>
          <Flashcard word={current.word} isFlipped={isFlipped} onFlip={flip} />
          {isFlipped && <GradeButtons onGrade={handleGrade} />}
        </>
      )}

      <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
        No worries if you didn't know — it'll come back later 💪
      </p>
    </div>
  );
}
