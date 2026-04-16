import { useEffect, useState, useCallback } from 'react';
import { getDueReviews } from '../db/words';
import { processReview } from '../db/reviews';
import { useReviewStore } from '../stores/reviewStore';
import { useTimerStore } from '../stores/timerStore';
import Flashcard from '../components/srs/Flashcard';
import GradeButtons from '../components/srs/GradeButtons';
import type { SM2Grade } from '../lib/sm2';

export default function ReviewPage() {
  const { queue, currentIndex, isFlipped, cardsReviewed, setQueue, flip, next, reset } =
    useReviewStore();
  const { isRunning, start } = useTimerStore();
  const [loading, setLoading] = useState(true);

  const loadCards = useCallback(async () => {
    setLoading(true);
    const due = await getDueReviews();
    // Shuffle
    for (let i = due.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [due[i], due[j]] = [due[j], due[i]];
    }
    setQueue(due);
    setLoading(false);
  }, [setQueue]);

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
        <p className="text-gray-400">Loading cards...</p>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-5xl mb-4">🎉</p>
        <p className="text-xl font-semibold text-gray-700">No cards to review!</p>
        <p className="text-gray-500 mt-2">
          Add words from the Reader or check back later.
        </p>
      </div>
    );
  }

  if (currentIndex >= queue.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-5xl mb-4">✨</p>
        <p className="text-xl font-semibold text-gray-700">Session complete!</p>
        <p className="text-gray-500 mt-2">
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
        <h2 className="text-lg font-semibold text-gray-700">Review</h2>
        <span className="text-sm text-gray-400">
          {currentIndex + 1} / {queue.length}
        </span>
      </div>

      <Flashcard word={current.word} isFlipped={isFlipped} onFlip={flip} />

      {isFlipped && <GradeButtons onGrade={handleGrade} />}

      <p className="text-center text-xs text-gray-400 mt-6">
        No worries if you didn't know — it'll come back later 💪
      </p>
    </div>
  );
}
