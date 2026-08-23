import { useState, useEffect, useRef, useMemo } from 'react';
import type { VocabLesson, VocabExercise, TypingItem, ListeningItem } from '../../types/vocab';
import { speak, TTS_SPEEDS, type TTSSpeed } from '../../lib/tts';
import { isRTL } from '../../lib/rtl';
import { saveWordsKey, saveWordsToVocabulary, wordExists } from '../../db/words';
import { markLessonComplete } from '../../db/lessons';
import { useTimerStore } from '../../stores/timerStore';
import { useXPStore } from '../../stores/xpStore';
import MatchExercise from './MatchExercise';
import FillBlankExercise from './FillBlankExercise';
import VocabQuiz from './VocabQuiz';
import { SkeletonList } from '../common/Skeleton';
import TypingExercise from './TypingExercise';
import ListeningExercise from './ListeningExercise';
import ClickableText from './ClickableText';
import AddAllWordsButton, { type AddAllWordsResult } from './AddAllWordsButton';

const XP_PER_VOCAB_LESSON = 25;
const XP_PER_EXERCISE_CORRECT = 2;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateTypingExercise(words: VocabLesson['words']): VocabExercise {
  const selected = shuffle(words).slice(0, Math.min(4, words.length));
  const items: TypingItem[] = selected.map((w) => ({
    prompt: w.meaning,
    answer: w.word,
    hint: w.word[0] + '…',
  }));
  return { type: 'typing', items };
}

function generateListeningExercise(words: VocabLesson['words']): VocabExercise {
  const selected = shuffle(words).slice(0, Math.min(4, words.length));
  const items: ListeningItem[] = selected.map((w) => {
    const distractors = shuffle(words.filter((o) => o.word !== w.word))
      .slice(0, 3)
      .map((o) => o.meaning);
    const options = shuffle([w.meaning, ...distractors]);
    return { word: w.word, options, answer: options.indexOf(w.meaning) };
  });
  return { type: 'listening', items };
}

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
  const [savedWords, setSavedWords] = useState<Record<string, 'saving' | 'saved' | 'exists'>>({});
  const [wordSaveError, setWordSaveError] = useState('');
  const [bulkSaveError, setBulkSaveError] = useState('');
  const [ttsSpeed, setTtsSpeed] = useState<TTSSpeed>(0.75);
  const timerStarted = useRef(false);
  const start = useTimerStore((s) => s.start);
  const stop = useTimerStore((s) => s.stop);
  // Guards a synchronous double-click before the "saving" state has even
  // committed, and stops either save path from writing to state once the
  // learner has already navigated away.
  const addingAllRef = useRef(false);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      start('vocab');
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
    setWordSaveError('');
    setSavedWords((prev) => ({ ...prev, [w.word]: 'saving' }));
    try {
      const result = await saveWordsToVocabulary([
        {
          language: lang,
          word: w.word,
          reading: w.reading,
          meaning: w.meaning,
          contextSentence: w.example,
          sourceTextId: null,
          tags: ['vocab-lesson', lessonId],
        },
      ]);
      if (!isMountedRef.current) return;
      setSavedWords((prev) => ({
        ...prev,
        [w.word]: result.added === 1 ? 'saved' : 'exists',
      }));
    } catch (error) {
      console.error('Could not save lesson word', error);
      if (!isMountedRef.current) return;
      setSavedWords((prev) => {
        const next = { ...prev };
        delete next[w.word];
        return next;
      });
      setWordSaveError(`Couldn’t save ${w.word}. Please try again.`);
    }
  }

  const exercises: VocabExercise[] = useMemo(() => {
    if (!lesson) return [];
    return [
      ...lesson.exercises,
      ...(lesson.words.length >= 4
        ? [generateTypingExercise(lesson.words), generateListeningExercise(lesson.words)]
        : []),
    ];
  }, [lesson]);
  const currentExercise: VocabExercise | undefined = exercises[exerciseIdx];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-4 w-24" />
        <SkeletonList count={3} />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500 dark:text-slate-400 mb-4">Lesson not found.</p>
        <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 font-medium">
          ← Back to lessons
        </button>
      </div>
    );
  }

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

  async function handleAddAllWords() {
    if (!lesson || addingAllRef.current) return;
    addingAllRef.current = true;
    setBulkSaveError('');
    setSavedWords((prev) => {
      const next = { ...prev };
      for (const w of lesson.words) {
        if (!next[w.word]) next[w.word] = 'saving';
      }
      return next;
    });

    try {
      const result = await saveWordsToVocabulary(
        lesson.words.map((w) => ({
          language: lang,
          word: w.word,
          reading: w.reading,
          meaning: w.meaning,
          contextSentence: w.example,
          sourceTextId: null,
          tags: ['vocab-lesson', lessonId],
        })),
      );

      if (!isMountedRef.current) return;
      setSavedWords((prev) => {
        const next = { ...prev };
        for (const w of lesson.words) {
          const key = saveWordsKey(w.word, lang);
          next[w.word] = result.outcomes[key] === 'added' ? 'saved' : 'exists';
        }
        return next;
      });
    } catch (error) {
      console.error('Could not save all lesson words', error);
      if (!isMountedRef.current) return;
      setSavedWords((prev) => {
        const next = { ...prev };
        for (const w of lesson.words) {
          if (next[w.word] === 'saving') delete next[w.word];
        }
        return next;
      });
      setBulkSaveError('Your words are still safe. Try adding them again.');
    } finally {
      addingAllRef.current = false;
    }
  }

  // Individual saves and the bulk action share this one `savedWords` map, so
  // the bulk button's state is always in sync with whatever has been saved so
  // far — one word at a time, all at once, or a mix of both.
  const totalWords = lesson?.words.length ?? 0;
  const savedCount = lesson ? lesson.words.filter((w) => savedWords[w.word] === 'saved').length : 0;
  const existsCount = lesson ? lesson.words.filter((w) => savedWords[w.word] === 'exists').length : 0;
  const savingCount = lesson ? lesson.words.filter((w) => savedWords[w.word] === 'saving').length : 0;
  const allWordsAccountedFor = totalWords > 0 && savedCount + existsCount === totalWords;
  const bulkStatus: 'idle' | 'saving' | 'done' | 'error' =
    savingCount > 0
      ? 'saving'
      : allWordsAccountedFor
        ? 'done'
        : bulkSaveError
          ? 'error'
          : 'idle';
  const bulkResult: AddAllWordsResult | null =
    allWordsAccountedFor ? { added: savedCount, alreadySaved: existsCount } : null;

  // Step 1: Word Introduction
  if (step === 'words') {
    const word = lesson.words[wordCardIdx];
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">
            ← Back
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {wordCardIdx + 1} / {lesson.words.length}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-4">
          <div className="text-center space-y-3">
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100" dir={isRTL(lang) ? 'rtl' : undefined}>{word.word}</p>
            <div className="inline-flex items-center gap-1">
              <button
                onClick={() => speak(word.word, lang, ttsSpeed)}
                className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-600 transition-colors min-h-[44px] px-2"
              >
                🔊 Listen
              </button>
              <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                {TTS_SPEEDS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => {
                      setTtsSpeed(s.value);
                      speak(word.word, lang, s.value);
                    }}
                    className={`px-2 py-1 text-xs font-medium transition-colors min-h-[32px] ${
                      ttsSpeed === s.value
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-lg text-slate-500 dark:text-slate-400">{word.reading}</p>
            <p className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">{word.meaning}</p>
            <button
              onClick={() => handleSaveWord(word)}
              disabled={!!savedWords[word.word]}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                savedWords[word.word] === 'saved'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : savedWords[word.word] === 'exists'
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    : savedWords[word.word] === 'saving'
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-400'
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
            {wordSaveError && (
              <p role="alert" className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                {wordSaveError}
              </p>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              Example <span className="text-xs">(tap words to look up)</span>:
            </p>
            <ClickableText
              text={word.example}
              language={lang}
              className="text-base text-slate-800 dark:text-slate-100"
            />
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{word.exampleMeaning}</p>
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
                    : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="mb-4">
          <AddAllWordsButton status={bulkStatus} result={bulkResult} onClick={handleAddAllWords} />
          {bulkSaveError && (
            <p role="alert" className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              {bulkSaveError}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setWordCardIdx((i) => Math.max(0, i - 1))}
            disabled={wordCardIdx === 0}
            className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium disabled:opacity-40 min-h-[44px]"
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
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Exercise {exerciseIdx + 1} / {exercises.length}
          </span>
        </div>

        <div className="mb-4">
          <AddAllWordsButton status={bulkStatus} result={bulkResult} onClick={handleAddAllWords} />
          {bulkSaveError && (
            <p role="alert" className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              {bulkSaveError}
            </p>
          )}
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
        {currentExercise.type === 'typing' && (
          <TypingExercise items={currentExercise.items} onComplete={handleExerciseComplete} />
        )}
        {currentExercise.type === 'listening' && (
          <ListeningExercise items={currentExercise.items} language={lang} onComplete={handleExerciseComplete} />
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
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Lesson Complete!</h2>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 mb-4 space-y-2">
        <p className="text-slate-600 dark:text-slate-300">
          Score: <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalCorrect}/{totalQuestions}</span> correct ({score}%)
        </p>
        <p className="text-slate-600 dark:text-slate-300">
          XP earned: <span className="font-bold text-yellow-600 dark:text-yellow-400">+{xpEarned} XP</span>
        </p>
      </div>

      <div className="space-y-3">
        <AddAllWordsButton status={bulkStatus} result={bulkResult} onClick={handleAddAllWords} />
        {bulkSaveError && (
          <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">
            {bulkSaveError}
          </p>
        )}

        <button
          onClick={() => {
            stop();
            timerStarted.current = false;
            onBack();
          }}
          className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[44px]"
        >
          ← Back to Lessons
        </button>
      </div>
    </div>
  );
}
