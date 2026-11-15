import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import type { VocabLesson } from '../../types/vocab';
import { speak, TTS_SPEEDS, type TTSSpeed } from '../../lib/tts';
import { isRTL } from '../../lib/rtl';
import { saveWordsKey, saveWordsToVocabulary, wordExists } from '../../db/words';
import { useTimerStore } from '../../stores/timerStore';
import { VocabLessonSession } from '../../lib/vocab-lesson-session';
import { vocabAttemptScore, summarizeVocabAttempt } from '../../lib/vocab-lesson-attempt';
import { vocabExerciseFinished, type VocabExerciseState } from '../../lib/vocab-lesson-state';
import VocabLessonProgress from './VocabLessonProgress';
import MatchExercise from './MatchExercise';
import PracticeWordCapture from '../common/PracticeWordCapture';
import FillBlankExercise from './FillBlankExercise';
import VocabQuiz from './VocabQuiz';
import { SkeletonList } from '../common/Skeleton';
import TypingExercise from './TypingExercise';
import ListeningExercise from './ListeningExercise';
import ClickableText from './ClickableText';
import AddAllWordsButton, { type AddAllWordsResult } from './AddAllWordsButton';

interface Props {
  lang: string;
  lessonId: string;
  title?: string;
  onBack: () => void;
}

export default function VocabLessonView(props: Props) {
  return <ActiveVocabLessonView key={`${props.lang}/${props.lessonId}`} {...props} />;
}

function ActiveVocabLessonView({ lang, lessonId, title, onBack }: Props) {
  const [session] = useState(() => new VocabLessonSession(lang, lessonId));
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const { attempt, phase, saveStatus, message, resumed } = snapshot;
  const lesson = attempt?.lesson ?? null;
  const step = attempt?.step ?? 'words';
  const exerciseIdx = attempt?.exerciseIndex ?? 0;
  const wordCardIdx = attempt?.wordIndex ?? 0;
  const exercises = attempt?.exercises ?? [];
  const currentExercise = exercises[exerciseIdx];
  const currentState = attempt?.states[exerciseIdx];
  const ready = phase === 'ready' && !!lesson;
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
    session.setTitle(title);
  }, [session, title]);

  useEffect(() => {
    void session.load();
  }, [session]);

  useEffect(() => {
    if (!timerStarted.current && ready) {
      start('vocab');
      timerStarted.current = true;
    }
    return () => {
      if (timerStarted.current) {
        stop();
        timerStarted.current = false;
      }
    };
  }, [ready, start, stop]);

  // Check which words already exist in SRS when lesson loads
  useEffect(() => {
    if (!lesson) return;
    let active = true;
    (async () => {
      const existing: Record<string, 'exists'> = {};
      for (const w of lesson.words) {
        if (await wordExists(w.word, lang)) {
          existing[w.word] = 'exists';
        }
      }
      if (active && Object.keys(existing).length > 0) {
        setSavedWords((prev) => ({ ...prev, ...existing }));
      }
    })().catch(() => {
      // Saving itself rechecks duplicates transactionally; a failed display
      // lookup must not block the lesson or report a successful word save.
    });
    return () => { active = false; };
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

  if (phase === 'loading') {
    return (
      <div className="space-y-4">
        <div className="skeleton h-4 w-24" />
        <SkeletonList count={3} />
      </div>
    );
  }

  if (phase !== 'ready' || !lesson || !attempt) {
    return (
      <div className="py-6 space-y-3">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          {phase === 'recovery' ? 'Your saved lesson is still here' : 'Let’s get your lesson ready'}
        </h2>
        <p role="status" className="text-slate-500 dark:text-slate-400">{message}</p>
        <div className="flex flex-wrap gap-2">
          {phase === 'recovery' && attempt && (
            <button onClick={session.continueSaved} className="min-h-[44px] px-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">
              Continue saved lesson
            </button>
          )}
          <button onClick={() => void session.load()} className="min-h-[44px] px-4 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
            Retry loading
          </button>
          {phase === 'recovery' && (
            <>
              <button onClick={() => void session.restart()} className="min-h-[44px] px-4 text-indigo-600 dark:text-indigo-400">
                Restart lesson
              </button>
              <a className="min-h-[44px] inline-flex items-center text-indigo-600 dark:text-indigo-400" download={`vocab-${lang}-${lessonId}-recovery.json`}
                href={`data:application/json;charset=utf-8,${encodeURIComponent(session.recoveryData() ?? '')}`}>
                Download saved attempt
              </a>
            </>
          )}
        </div>
        <button onClick={onBack} className="min-h-[44px] text-indigo-600 dark:text-indigo-400 font-medium">
          ← Back to lessons
        </button>
      </div>
    );
  }

  function handleExerciseComplete() {
    if (!attempt || !currentExercise || !currentState || !vocabExerciseFinished(currentExercise, currentState)) return;
    const nextIdx = exerciseIdx + 1;
    if (nextIdx >= exercises.length) {
      session.checkpoint({ step: 'summary' });
    } else {
      session.checkpoint({ exerciseIndex: nextIdx });
    }
  }

  function handleExerciseChange(state: VocabExerciseState) {
    if (!attempt) return;
    session.checkpoint({ states: attempt.states.map((previous, index) => index === exerciseIdx ? state : previous) });
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

  const place = summarizeVocabAttempt(attempt);
  const continuity = (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="min-h-[44px] text-indigo-600 dark:text-indigo-400 font-medium text-sm">
          ← Back
        </button>
        <button onClick={() => void session.restart()} disabled={saveStatus === 'saving' || saveStatus === 'conflict' ||
          (step === 'summary' && attempt.completion !== 'credited')}
          className="min-h-[44px] px-2 text-sm text-slate-600 dark:text-slate-300 disabled:opacity-40">
          {step === 'summary' ? 'Retake lesson' : 'Restart lesson'}
        </button>
      </div>
      {resumed && (
        <p className="text-sm text-indigo-600 dark:text-indigo-400">
          Resumed your saved place · {place.stage.toLowerCase()} {place.position} of {place.itemCount}
        </p>
      )}
      <p role="status" aria-live={saveStatus === 'unsaved' || saveStatus === 'conflict' ? 'polite' : 'off'}
        className={`text-sm ${saveStatus === 'unsaved' || saveStatus === 'conflict'
        ? 'text-amber-800 dark:text-amber-200' : 'text-slate-500 dark:text-slate-400'}`}>
        {message || (saveStatus === 'saving' ? 'Saving your place…' : 'Your place is saved on this device.')}
      </p>
      {saveStatus === 'unsaved' && (
        <button onClick={session.retrySave} className="min-h-[44px] text-sm font-medium text-indigo-600 dark:text-indigo-400">
          Retry saving
        </button>
      )}
      {(saveStatus === 'conflict' || (message && saveStatus === 'saved')) && (
        <button onClick={() => void session.load()} className="min-h-[44px] text-sm font-medium text-indigo-600 dark:text-indigo-400">
          {saveStatus === 'conflict' ? 'Load saved place' : 'Retry content check'}
        </button>
      )}
    </div>
  );

  // Step 1: Word Introduction
  if (step === 'words') {
    const word = lesson.words[wordCardIdx];
    return (
      <div>
        {continuity}
        <VocabLessonProgress attempt={attempt} />

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm p-6 mb-4">
          <div className="text-center space-y-3">
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100" dir={isRTL(lang) ? 'rtl' : undefined}>{word.word}</p>
            <div className="inline-flex items-center gap-1">
              <button
                onClick={() => speak(word.word, lang, ttsSpeed)}
                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors min-h-[44px] px-2"
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
                    aria-pressed={ttsSpeed === s.value}
                    className={`px-2 py-1 text-xs font-medium transition-colors min-h-[44px] ${
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
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
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
            onClick={() => session.checkpoint({ wordIndex: Math.max(0, wordCardIdx - 1) })}
            disabled={wordCardIdx === 0 || saveStatus === 'conflict'}
            className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium disabled:opacity-40 min-h-[44px]"
          >
            ← Previous
          </button>
          {wordCardIdx < lesson.words.length - 1 ? (
            <button
              onClick={() => session.checkpoint({ wordIndex: wordCardIdx + 1 })}
              disabled={saveStatus === 'conflict'}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => session.checkpoint({ step: exercises.length ? 'exercise' : 'summary' })}
              disabled={saveStatus === 'conflict'}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
            >
              {exercises.length ? 'Start Exercises →' : 'Finish lesson'}
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
        {continuity}
        <VocabLessonProgress attempt={attempt} />

        <div className="mb-4">
          <AddAllWordsButton status={bulkStatus} result={bulkResult} onClick={handleAddAllWords} />
          {bulkSaveError && (
            <p role="alert" className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              {bulkSaveError}
            </p>
          )}
        </div>

        <fieldset disabled={saveStatus === 'conflict'}>
        {currentExercise.type === 'match' && currentState?.kind === 'match' && (
          <MatchExercise
            exercise={currentExercise}
            language={lang}
            state={currentState}
            onChange={handleExerciseChange}
            onComplete={handleExerciseComplete}
          />
        )}
        {currentExercise.type === 'fill-blank' && currentState?.kind === 'items' && (
          <FillBlankExercise
            items={currentExercise.items}
            language={lang}
            state={currentState}
            onChange={handleExerciseChange}
            onComplete={handleExerciseComplete}
          />
        )}
        {currentExercise.type === 'multiple-choice' && currentState?.kind === 'items' && (
          <VocabQuiz items={currentExercise.items} state={currentState} onChange={handleExerciseChange} onComplete={handleExerciseComplete} />
        )}
        {currentExercise.type === 'typing' && currentState?.kind === 'items' && (
          <TypingExercise items={currentExercise.items} state={currentState} language={lang} onChange={handleExerciseChange} onComplete={handleExerciseComplete} />
        )}
        {currentExercise.type === 'listening' && currentState?.kind === 'items' && (
          <ListeningExercise items={currentExercise.items} state={currentState} onChange={handleExerciseChange} language={lang} onComplete={handleExerciseComplete} />
        )}
        </fieldset>
      </div>
    );
  }

  // Step 5: Summary
  const { correct: totalCorrect, total: totalQuestions, xp: xpEarned, score } = vocabAttemptScore(attempt);
  const confirmed = attempt.completion === 'credited';

  return (
    <div className="text-center py-6">
      {continuity}
      <p className="text-4xl mb-3" aria-hidden="true">{confirmed ? '🎉' : '📚'}</p>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{confirmed ? 'Lesson complete!' : 'Lesson finished — saving results'}</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-4">{attempt.title}</p>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm p-5 mb-4 space-y-2">
        <p className="text-slate-600 dark:text-slate-300">
          Score: <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalCorrect}/{totalQuestions}</span> correct ({score}%)
        </p>
        <p className="text-slate-600 dark:text-slate-300">
          {confirmed ? 'XP earned: ' : 'XP awaiting confirmation: '}<span className="font-bold text-indigo-600 dark:text-indigo-400">+{xpEarned} XP</span>
        </p>
      </div>

      <div className="space-y-3">
        <Link to="/" className="w-full min-h-[44px] flex items-center justify-center py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700">
          Done for now
        </Link>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Saving words for review is optional. Only the words you choose to save become review cards.
        </p>
        <PracticeWordCapture language={lang} words={lesson.words.map((word) => ({
          ...word, context: word.example,
        }))} source="vocab-lesson" tags={[lessonId]} />
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
