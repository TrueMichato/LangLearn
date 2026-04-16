import { useState, useCallback, useMemo } from 'react';
import type { Character } from '../../data/alphabets';
import { updateCharacterProgress } from '../../db/characters';
import { speak } from '../../lib/tts';
import { XP_PER_QUIZ_CORRECT } from '../../lib/xp';
import { useTimerStore } from '../../stores/timerStore';

interface Props {
  characters: Character[];
  alphabetName: string;
  language: string;
  onProgress: () => void;
}

type Round = 'char-to-romanji' | 'romanji-to-char' | 'listen-to-char';

const QUESTIONS_PER_ROUND = 10;
const ROUNDS: { type: Round; label: string }[] = [
  { type: 'char-to-romanji', label: 'Character → Romanji' },
  { type: 'romanji-to-char', label: 'Romanji → Character' },
  { type: 'listen-to-char', label: 'Listen → Character' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestions(characters: Character[], count: number) {
  const shuffled = shuffle(characters);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function getDistractors(correct: Character, all: Character[], count: number): Character[] {
  const others = all.filter((c) => c.char !== correct.char);
  return shuffle(others).slice(0, count);
}

export default function RecognitionQuiz({ characters, alphabetName, language, onProgress }: Props) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [finished, setFinished] = useState(false);
  const [xpToast, setXpToast] = useState(false);
  const [hasStartedTimer, setHasStartedTimer] = useState(false);
  const timerStart = useTimerStore((s) => s.start);
  const timerIsRunning = useTimerStore((s) => s.isRunning);

  const questions = useMemo(
    () => generateQuestions(characters, QUESTIONS_PER_ROUND),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [characters, roundIndex],
  );

  const currentQuestion = questions[questionIndex];
  const currentRound = ROUNDS[roundIndex];

  const options = useMemo(() => {
    if (!currentQuestion) return [];
    const distractors = getDistractors(currentQuestion, characters, 3);
    const all = [currentQuestion, ...distractors];
    return shuffle(all);
  }, [currentQuestion, characters]);

  const startTimer = useCallback(() => {
    if (!hasStartedTimer && !timerIsRunning) {
      timerStart('grammar');
      setHasStartedTimer(true);
    }
  }, [hasStartedTimer, timerIsRunning, timerStart]);

  async function handleAnswer(option: Character) {
    if (showResult) return;
    startTimer();

    const correct = option.char === currentQuestion.char;
    setSelected(option.char);
    setShowResult(true);

    const id = `${language}/${alphabetName}/${currentQuestion.char}`;
    await updateCharacterProgress(id, language, currentQuestion.char, currentQuestion.romanji, correct);

    if (correct) {
      setScore((s) => s + 1);
      setTotalScore((s) => s + 1);
      setXpToast(true);
      setTimeout(() => setXpToast(false), 1200);
    }

    onProgress();

    setTimeout(() => {
      setSelected(null);
      setShowResult(false);

      if (questionIndex + 1 >= questions.length) {
        if (roundIndex + 1 >= ROUNDS.length) {
          setFinished(true);
        } else {
          setRoundIndex((r) => r + 1);
          setQuestionIndex(0);
          setScore(0);
        }
      } else {
        setQuestionIndex((q) => q + 1);
      }
    }, 1500);
  }

  function handleRestart() {
    setRoundIndex(0);
    setQuestionIndex(0);
    setScore(0);
    setTotalScore(0);
    setFinished(false);
  }

  // Play TTS for listen round
  function playAudio() {
    if (currentQuestion) {
      speak(currentQuestion.char, language);
    }
  }

  if (finished) {
    const totalQuestions = ROUNDS.length * QUESTIONS_PER_ROUND;
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-5xl">🎉</p>
        <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Quiz Complete!
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          {totalScore}/{Math.min(totalQuestions, characters.length * ROUNDS.length)} correct
        </p>
        <p className="text-sm text-indigo-600 dark:text-indigo-400">
          +{totalScore * XP_PER_QUIZ_CORRECT} XP earned
        </p>
        <button
          onClick={handleRestart}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const isCorrect = selected === currentQuestion.char;

  return (
    <div className="space-y-4">
      {/* Round indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          Round {roundIndex + 1}/3: {currentRound.label}
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          {questionIndex + 1}/{questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="text-center py-4">
        {currentRound.type === 'char-to-romanji' && (
          <span className="text-7xl">{currentQuestion.char}</span>
        )}
        {currentRound.type === 'romanji-to-char' && (
          <span className="text-4xl font-bold text-gray-800 dark:text-gray-100">{currentQuestion.romanji}</span>
        )}
        {currentRound.type === 'listen-to-char' && (
          <button
            onClick={playAudio}
            className="text-6xl p-4 rounded-full bg-indigo-100 dark:bg-indigo-900/40 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors"
          >
            🔊
          </button>
        )}
      </div>

      {/* Auto-play TTS for listen round */}
      {currentRound.type === 'listen-to-char' && (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500">Tap to hear again</p>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isThis = selected === option.char;
          const isCorrectAnswer = option.char === currentQuestion.char;

          let btnClass = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100';
          if (showResult) {
            if (isCorrectAnswer) {
              btnClass = 'bg-green-100 dark:bg-green-900/50 border-green-400 dark:border-green-600 text-green-800 dark:text-green-200';
            } else if (isThis && !isCorrect) {
              btnClass = 'bg-red-100 dark:bg-red-900/50 border-red-400 dark:border-red-600 text-red-800 dark:text-red-200';
            }
          }

          const display = currentRound.type === 'char-to-romanji' ? option.romanji : option.char;

          return (
            <button
              key={option.char}
              onClick={() => handleAnswer(option)}
              disabled={showResult}
              className={`p-4 rounded-xl border-2 font-medium text-xl transition-colors ${btnClass} ${
                !showResult ? 'hover:border-indigo-400 dark:hover:border-indigo-500 active:scale-95' : ''
              }`}
            >
              {display}
            </button>
          );
        })}
      </div>

      {/* Score */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Score: {score}/{questionIndex + (showResult ? 1 : 0)}
      </p>

      {/* XP toast */}
      {xpToast && (
        <div className="fixed top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-medium animate-bounce z-50">
          +{XP_PER_QUIZ_CORRECT} XP
        </div>
      )}
    </div>
  );
}
