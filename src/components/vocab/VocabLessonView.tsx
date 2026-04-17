import { useState, useEffect, useRef } from 'react';
import type { VocabLesson, VocabExercise } from '../../types/vocab';
import { speak } from '../../lib/tts';
import { addWord, wordExists } from '../../db/words';
import { markLessonComplete } from '../../db/lessons';
import { useTimerStore } from '../../stores/timerStore';
import { useXPStore } from '../../stores/xpStore';
import MatchExercise from './MatchExercise';
import FillBlankExercise from './FillBlankExercise';
import VocabQuiz from './VocabQuiz';

const XP_PER_VOCAB_LESSON = 25;
const XP_PER_EXERCISE_CORRECT = 2;

type Step = 'words' | 'exercise' | 'summary';

interface Props {
  lang: string;
  lessonId: string;
  onBack: () => void;
}

export default function VocabLessonView({ lang, lessonId, onBack }: Props) {
  const [lesson, setLesson] = useState<VocabLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('words');
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [wordCardIdx, setWordCardIdx] = useState(0);
  const [addingWords, setAddingWords] = useState(false);
  const [wordsAdded, setWordsAdded] = useState(false);
  const [savedWords, setSavedWords] = useState<Record<string, 'saving' | 'saved' | 'exists'>>({});
  const timerStarted = useRef(false);
  const start = useTimerStore((s) => s.start);
  const stop = useTimerStore((s) => s.stop);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}content/vocab/${lang}/${lessonId}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: VocabLesson | null) => {
        setLesson(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lang, lessonId]);

  useEffect(() => {
    if (!timerStarted.current && lesson) {
      start('grammar');
      timerStarted.current = true;
    }
    return () => {
      if (timerStarted.current) {
        stop();
        timerStarted.current = false;
      }
    };
  }, [lesson, start, stop]);

  // Check which words already exist in SRS when lesson loads
  useEffect(() => {
    if (!lesson) return;
    (async () => {
      const existing: Record<string, 'exists'> = {};
      for (const w of lesson.words) {
        if (await wordExists(w.word, lang)) {
          existing[w.word] = 'exists';
        }
      }
      if (Object.keys(existing).length > 0) {
        setSavedWords((prev) => ({ ...prev, ...existing }));
      }
    })();
  }, [lesson, lang]);

  async function handleSaveWord(w: VocabLesson['words'][number]) {
    if (savedWords[w.word]) return;
    setSavedWords((prev) => ({ ...prev, [w.word]: 'saving' }));
    const exists = await wordExists(w.word, lang);
    if (exists) {
      setSavedWords((prev) => ({ ...prev, [w.word]: 'exists' }));
      return;
    }
    await addWord({
      language: lang,
      word: w.word,
      reading: w.reading,
      meaning: w.meaning,
      contextSentence: w.example,
      sourceTextId: null,
      tags: ['vocab-lesson', lessonId],
    });
    setSavedWords((prev) => ({ ...prev, [w.word]: 'saved' }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-gray-400 dark:text-gray-500">Loading lesson...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Lesson not found.</p>
        <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 font-medium">
          ← Back to lessons
        </button>
      </div>
    );
  }

  const exercises = lesson.exercises;
  const currentExercise: VocabExercise | undefined = exercises[exerciseIdx];

  function handleExerciseComplete(correct: number) {
    const ex = exercises[exerciseIdx];
    const questionCount =
      ex.type === 'match'
        ? ex.pairs
        : ex.type === 'fill-blank'
          ? ex.items.length
          : ex.items.length;

    setTotalCorrect((c) => c + correct);
    setTotalQuestions((q) => q + questionCount);

    const nextIdx = exerciseIdx + 1;
    if (nextIdx >= exercises.length) {
      const finalCorrect = totalCorrect + correct;
      const finalTotal = totalQuestions + questionCount;
      const score = finalTotal > 0 ? Math.round((finalCorrect / finalTotal) * 100) : 100;
      markLessonComplete(lang, `vocab/${lessonId}`, score);
      const xp = XP_PER_VOCAB_LESSON + finalCorrect * XP_PER_EXERCISE_CORRECT;
      useXPStore.getState().addXP(xp);
      setStep('summary');
    } else {
      setExerciseIdx(nextIdx);
    }
  }

  async function handleAddWords() {
    if (!lesson || addingWords) return;
    setAddingWords(true);
    let added = 0;
    for (const w of lesson.words) {
      const exists = await wordExists(w.word, lang);
      if (!exists) {
        await addWord({
          language: lang,
          word: w.word,
          reading: w.reading,
          meaning: w.meaning,
          contextSentence: w.example,
          sourceTextId: null,
          tags: ['vocab-lesson', lessonId],
        });
        added++;
      }
    }
    setWordsAdded(true);
    setAddingWords(false);
  }

  // Step 1: Word Introduction
  if (step === 'words') {
    const word = lesson.words[wordCardIdx];
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">
            ← Back
          </button>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {wordCardIdx + 1} / {lesson.words.length}
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-4">
          <div className="text-center space-y-3">
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{word.word}</p>
            <button
              onClick={() => speak(word.word, lang)}
              className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-600 transition-colors min-h-[44px]"
            >
              🔊 Listen
            </button>
            <p className="text-lg text-gray-500 dark:text-gray-400">{word.reading}</p>
            <p className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">{word.meaning}</p>
            <button
              onClick={() => handleSaveWord(word)}
              disabled={!!savedWords[word.word]}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[36px] ${
                savedWords[word.word] === 'saved'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : savedWords[word.word] === 'exists'
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    : savedWords[word.word] === 'saving'
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
              }`}
            >
              {savedWords[word.word] === 'saved'
                ? '✓ Saved'
                : savedWords[word.word] === 'exists'
                  ? '✓ Already saved'
                  : savedWords[word.word] === 'saving'
                    ? 'Saving…'
                    : '➕ Save to flashcards'}
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Example:</p>
            <p className="text-base text-gray-800 dark:text-gray-100">{word.example}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{word.exampleMeaning}</p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1 mb-4 flex-wrap">
          {lesson.words.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === wordCardIdx
                  ? 'bg-indigo-500'
                  : i < wordCardIdx
                    ? 'bg-indigo-300 dark:bg-indigo-700'
                    : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setWordCardIdx((i) => Math.max(0, i - 1))}
            disabled={wordCardIdx === 0}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium disabled:opacity-40 min-h-[44px]"
          >
            ← Previous
          </button>
          {wordCardIdx < lesson.words.length - 1 ? (
            <button
              onClick={() => setWordCardIdx((i) => i + 1)}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => setStep('exercise')}
              className="flex-1 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors min-h-[44px]"
            >
              Start Exercises →
            </button>
          )}
        </div>
      </div>
    );
  }

  // Step 2-4: Exercises
  if (step === 'exercise' && currentExercise) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">
            ← Back
          </button>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            Exercise {exerciseIdx + 1} / {exercises.length}
          </span>
        </div>

        {currentExercise.type === 'match' && (
          <MatchExercise
            words={lesson.words}
            pairCount={currentExercise.pairs}
            onComplete={handleExerciseComplete}
          />
        )}
        {currentExercise.type === 'fill-blank' && (
          <FillBlankExercise
            items={currentExercise.items}
            onComplete={handleExerciseComplete}
          />
        )}
        {currentExercise.type === 'multiple-choice' && (
          <VocabQuiz items={currentExercise.items} onComplete={handleExerciseComplete} />
        )}
      </div>
    );
  }

  // Step 5: Summary
  const xpEarned = XP_PER_VOCAB_LESSON + totalCorrect * XP_PER_EXERCISE_CORRECT;
  const score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 100;

  return (
    <div className="text-center py-6">
      <p className="text-4xl mb-3">🎉</p>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Lesson Complete!</h2>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 mb-4 space-y-2">
        <p className="text-gray-600 dark:text-gray-300">
          Score: <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalCorrect}/{totalQuestions}</span> correct ({score}%)
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          XP earned: <span className="font-bold text-yellow-600 dark:text-yellow-400">+{xpEarned} XP</span>
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleAddWords}
          disabled={addingWords || wordsAdded}
          className={`w-full py-3 rounded-xl font-medium transition-colors min-h-[44px] ${
            wordsAdded
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {wordsAdded
            ? '✅ Words added to vocabulary'
            : addingWords
              ? 'Adding words...'
              : '📚 Add words to vocabulary'}
        </button>

        <button
          onClick={() => {
            stop();
            timerStarted.current = false;
            onBack();
          }}
          className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-h-[44px]"
        >
          ← Back to Lessons
        </button>
      </div>
    </div>
  );
}
