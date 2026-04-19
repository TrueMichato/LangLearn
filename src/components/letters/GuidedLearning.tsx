import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Character } from '../../data/alphabets';
import { updateCharacterProgress } from '../../db/characters';
import { speak } from '../../lib/tts';
import { XP_PER_CHARACTER_PRACTICE, XP_PER_QUIZ_CORRECT } from '../../lib/xp';
import { useXPStore } from '../../stores/xpStore';

interface Props {
  characters: Character[];
  alphabetName: string;
  language: string;
  onProgress: () => void;
}

type Phase = 'overview' | 'learning' | 'quiz' | 'result';

const PASS_THRESHOLD = 0.8;
const QUIZ_OPTIONS_COUNT = 4;

// Stable ordering of groups for guided learning
const GROUP_ORDER = [
  'Vowels', 'K-row', 'S-row', 'T-row', 'N-row',
  'H-row', 'M-row', 'Y-row', 'R-row', 'W-row',
  'Dakuten', 'Handakuten',
  'Yōon', 'Yōon-Dakuten', 'Yōon-Handakuten', 'Sokuon',
];

function getStorageKey(alphabetName: string, language: string) {
  return `langlearn-guided-${language}-${alphabetName}`;
}

function loadCompletedColumns(alphabetName: string, language: string): Set<string> {
  try {
    const raw = localStorage.getItem(getStorageKey(alphabetName, language));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveCompletedColumns(alphabetName: string, language: string, completed: Set<string>) {
  localStorage.setItem(getStorageKey(alphabetName, language), JSON.stringify([...completed]));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function GuidedLearning({ characters, alphabetName, language, onProgress }: Props) {
  const [completed, setCompleted] = useState(() => loadCompletedColumns(alphabetName, language));
  const [phase, setPhase] = useState<Phase>('overview');
  const [activeGroup, setActiveGroup] = useState('');

  // Learning state
  const [cardIndex, setCardIndex] = useState(0);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<
    { character: Character; options: string[]; correct: number }[]
  >([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Result state
  const [quizScore, setQuizScore] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [missedChars, setMissedChars] = useState<Character[]>([]);

  // Reset when alphabet/language changes
  useEffect(() => {
    const cols = loadCompletedColumns(alphabetName, language);
    setCompleted(cols);
    setPhase('overview');
  }, [alphabetName, language]);

  // Build ordered groups from characters
  const orderedGroups = useMemo(() => {
    const groupSet = new Set(characters.map((c) => c.group));
    const ordered = GROUP_ORDER.filter((g) => groupSet.has(g));
    // Append any groups not in GROUP_ORDER at the end
    for (const g of groupSet) {
      if (!ordered.includes(g)) ordered.push(g);
    }
    return ordered;
  }, [characters]);

  const groupCharacters = useCallback(
    (group: string) => characters.filter((c) => c.group === group),
    [characters],
  );

  // Determine unlock status: a column is unlocked if all previous columns are completed
  const getStatus = useCallback(
    (group: string): 'completed' | 'unlocked' | 'locked' => {
      if (completed.has(group)) return 'completed';
      const idx = orderedGroups.indexOf(group);
      if (idx === 0) return 'unlocked';
      const prev = orderedGroups[idx - 1];
      return completed.has(prev) ? 'unlocked' : 'locked';
    },
    [completed, orderedGroups],
  );

  // All characters from completed columns (for cumulative quizzing)
  const allCompletedChars = useMemo(
    () => characters.filter((c) => completed.has(c.group)),
    [characters, completed],
  );

  // --- Handlers ---

  const startLearning = useCallback(
    (group: string) => {
      if (getStatus(group) === 'locked') return;
      setActiveGroup(group);
      setCardIndex(0);
      setPhase('learning');
    },
    [getStatus],
  );

  const activeChars = useMemo(
    () => groupCharacters(activeGroup),
    [activeGroup, groupCharacters],
  );

  const handleNextCard = useCallback(() => {
    const char = activeChars[cardIndex];
    if (char) {
      // Award XP for viewing the character
      useXPStore.getState().addXP(XP_PER_CHARACTER_PRACTICE);
      const charId = `${language}/${alphabetName}/${char.char}`;
      updateCharacterProgress(charId, language, char.char, char.romanji, true);
    }
    if (cardIndex + 1 < activeChars.length) {
      setCardIndex(cardIndex + 1);
    } else {
      // Transition to quiz
      buildQuiz();
    }
  }, [cardIndex, activeChars, language, alphabetName]);

  const buildQuiz = useCallback(() => {
    // Quiz pool = current column + all previously completed columns
    const quizPool = [...activeChars, ...allCompletedChars];
    // All characters for distractor options
    const allChars = characters.length > 0 ? characters : quizPool;

    // Build questions: quiz each character from current column, plus a random sample from completed
    const currentQuestions = shuffle(activeChars);
    const extraPool = shuffle(allCompletedChars).slice(0, Math.min(5, allCompletedChars.length));
    const allQuestionChars = [...currentQuestions, ...extraPool];

    const questions = allQuestionChars.map((char) => {
      // Build 4 MC options: 1 correct + 3 distractors
      const correctAnswer = char.romanji;
      const distractors = shuffle(
        allChars.filter((c) => c.romanji !== correctAnswer),
      )
        .slice(0, QUIZ_OPTIONS_COUNT - 1)
        .map((c) => c.romanji);
      const options = shuffle([correctAnswer, ...distractors]);
      return {
        character: char,
        options,
        correct: options.indexOf(correctAnswer),
      };
    });

    setQuizQuestions(questions);
    setQuizIndex(0);
    setQuizAnswers(new Array(questions.length).fill(null));
    setSelectedOption(null);
    setPhase('quiz');
  }, [activeChars, allCompletedChars, characters]);

  const handleQuizAnswer = useCallback(
    (optionIndex: number) => {
      if (selectedOption !== null) return; // Already answered
      setSelectedOption(optionIndex);

      const q = quizQuestions[quizIndex];
      const isCorrect = optionIndex === q.correct;

      // Record progress
      const charId = `${language}/${alphabetName}/${q.character.char}`;
      updateCharacterProgress(charId, language, q.character.char, q.character.romanji, isCorrect);

      if (isCorrect) {
        useXPStore.getState().addXP(XP_PER_QUIZ_CORRECT);
      }

      const newAnswers = [...quizAnswers];
      newAnswers[quizIndex] = optionIndex;
      setQuizAnswers(newAnswers);

      // Auto-advance after a short delay
      setTimeout(() => {
        if (quizIndex + 1 < quizQuestions.length) {
          setQuizIndex(quizIndex + 1);
          setSelectedOption(null);
        } else {
          // Tally results
          const correctCount = newAnswers.filter(
            (a, i) => a === quizQuestions[i].correct,
          ).length;
          const total = quizQuestions.length;
          const missed = quizQuestions
            .filter((q, i) => newAnswers[i] !== q.correct)
            .map((q) => q.character);
          const totalXP =
            activeChars.length * XP_PER_CHARACTER_PRACTICE +
            correctCount * XP_PER_QUIZ_CORRECT;

          setQuizScore(correctCount);
          setQuizTotal(total);
          setXpEarned(totalXP);
          setMissedChars(missed);

          if (correctCount / total >= PASS_THRESHOLD) {
            // Unlock next column
            const newCompleted = new Set(completed);
            newCompleted.add(activeGroup);
            setCompleted(newCompleted);
            saveCompletedColumns(alphabetName, language, newCompleted);
            onProgress();
          }

          setPhase('result');
        }
      }, 800);
    },
    [
      selectedOption, quizQuestions, quizIndex, quizAnswers,
      language, alphabetName, activeGroup, completed, activeChars, onProgress,
    ],
  );

  const handleRetry = useCallback(() => {
    setCardIndex(0);
    setPhase('learning');
  }, []);

  const handleBackToOverview = useCallback(() => {
    setPhase('overview');
    setActiveGroup('');
  }, []);

  // --- Render ---

  if (phase === 'overview') {
    return (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">
          Learn {alphabetName} — Column by Column
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Master each column before moving to the next. Complete the quiz with ≥80% to unlock the next column.
        </p>
        {orderedGroups.map((group) => {
          const status = getStatus(group);
          const chars = groupCharacters(group);
          return (
            <button
              key={group}
              onClick={() => startLearning(group)}
              disabled={status === 'locked'}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors min-h-[44px] press-feedback ${
                status === 'locked'
                  ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800'
                  : status === 'completed'
                    ? 'bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-900/70'
                    : 'bg-white dark:bg-slate-800 shadow hover:bg-indigo-50 dark:hover:bg-slate-700'
              }`}
            >
              <span className="text-xl" aria-hidden>
                {status === 'completed' ? '✅' : status === 'unlocked' ? '🔓' : '🔒'}
              </span>
              <div className="flex-1 min-w-0">
                <span className={`font-medium text-sm ${
                  status === 'completed'
                    ? 'text-green-800 dark:text-green-200'
                    : status === 'unlocked'
                      ? 'text-slate-800 dark:text-slate-100'
                      : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {group}
                </span>
                <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                  {chars.length} characters
                </span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
                {chars.map((c) => c.char).join(' ')}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (phase === 'learning') {
    const char = activeChars[cardIndex];
    if (!char) return null;

    return (
      <div className="space-y-4">
        <button
          onClick={handleBackToOverview}
          className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline press-feedback"
        >
          ← Back to columns
        </button>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
          {activeGroup}
        </h3>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 text-center">
          <p className="text-7xl mb-4 select-none text-slate-900 dark:text-slate-100">{char.char}</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
            {char.romanji}
          </p>
          {char.imageUrl && (
            <div className="flex justify-center mb-3">
              <img
                src={char.imageUrl}
                alt={`Mnemonic for ${char.char}`}
                className="max-w-[180px] max-h-[140px] rounded-xl"
                loading="lazy"
              />
            </div>
          )}
          {char.hint && (
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-1 italic">
              💡 {char.hint}
            </p>
          )}
          {char.mnemonic && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              {char.mnemonic}
            </p>
          )}
          {(char.hint || char.mnemonic) && char.source === 'tofugu' && (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">
              Content from Tofugu.com
            </p>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            {char.strokes} stroke{char.strokes !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => speak(char.char, language)}
            className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2 rounded-xl font-medium min-h-[44px] press-feedback hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            🔊 Listen
          </button>
          <button
            onClick={handleNextCard}
            className="flex-1 bg-indigo-600 text-white px-5 py-2 rounded-xl font-medium min-h-[44px] press-feedback hover:bg-indigo-700 transition-colors"
          >
            {cardIndex + 1 < activeChars.length ? '→ Next' : '→ Start Quiz'}
          </button>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-1.5">
          {activeChars.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === cardIndex
                  ? 'bg-indigo-600 dark:bg-indigo-400'
                  : i < cardIndex
                    ? 'bg-indigo-300 dark:bg-indigo-700'
                    : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'quiz') {
    const q = quizQuestions[quizIndex];
    if (!q) return null;

    return (
      <div className="space-y-4">
        <button
          onClick={handleBackToOverview}
          className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline press-feedback"
        >
          ← Back to columns
        </button>

        {/* Progress */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Quiz — {activeGroup}
          </h3>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {quizIndex + 1} / {quizQuestions.length}
          </span>
        </div>

        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            What is the reading of:
          </p>
          <p className="text-6xl mb-4 select-none text-slate-900 dark:text-slate-100">{q.character.char}</p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((opt, i) => {
            let style = 'bg-white dark:bg-slate-800 shadow text-slate-800 dark:text-slate-100 hover:bg-indigo-50 dark:hover:bg-slate-700';
            if (selectedOption !== null) {
              if (i === q.correct) {
                style = 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 ring-2 ring-green-500';
              } else if (i === selectedOption) {
                style = 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 ring-2 ring-red-500';
              } else {
                style = 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500';
              }
            }
            return (
              <button
                key={i}
                onClick={() => handleQuizAnswer(i)}
                disabled={selectedOption !== null}
                className={`p-4 rounded-xl font-medium text-lg min-h-[44px] press-feedback transition-colors ${style}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Result phase
  const passed = quizScore / quizTotal >= PASS_THRESHOLD;

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl p-6 text-center ${
        passed
          ? 'bg-green-100 dark:bg-green-900/50'
          : 'bg-amber-100 dark:bg-amber-900/50'
      }`}>
        <p className="text-4xl mb-2">{passed ? '🎉' : '💪'}</p>
        <h3 className={`text-lg font-bold mb-1 ${
          passed
            ? 'text-green-800 dark:text-green-200'
            : 'text-amber-800 dark:text-amber-200'
        }`}>
          {passed ? 'Column Complete!' : 'Almost there!'}
        </h3>
        <p className={`text-sm ${
          passed
            ? 'text-green-700 dark:text-green-300'
            : 'text-amber-700 dark:text-amber-300'
        }`}>
          {quizScore} / {quizTotal} correct ({Math.round((quizScore / quizTotal) * 100)}%)
        </p>
        {passed && (
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-2">
            +{xpEarned} XP earned!
          </p>
        )}
        {!passed && (
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            Need ≥80% to unlock the next column. Review the characters and try again!
          </p>
        )}
      </div>

      {/* Show missed characters */}
      {missedChars.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
            Review these characters:
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {missedChars.map((c) => (
              <div
                key={c.char}
                className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg"
              >
                <p className="text-2xl text-slate-900 dark:text-slate-100">{c.char}</p>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                  {c.romanji}
                </p>
                {c.hint && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    {c.hint}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {!passed && (
          <button
            onClick={handleRetry}
            className="flex-1 bg-indigo-600 text-white px-5 py-2 rounded-xl font-medium min-h-[44px] press-feedback hover:bg-indigo-700 transition-colors"
          >
            🔄 Try Again
          </button>
        )}
        <button
          onClick={handleBackToOverview}
          className={`${passed ? 'flex-1' : ''} bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2 rounded-xl font-medium min-h-[44px] press-feedback hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors`}
        >
          {passed ? '→ Continue' : '← Columns'}
        </button>
      </div>
    </div>
  );
}
