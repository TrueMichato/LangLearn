import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import LanguagePicker from '../components/common/LanguagePicker';
import LanguageUnavailable from '../components/common/LanguageUnavailable';
import { useXPStore } from '../stores/xpStore';
import { useTimerStore } from '../stores/timerStore';
import { jaPassages } from '../data/listening/ja-passages';
import { ruPassages } from '../data/listening/ru-passages';
import { ptPassages } from '../data/listening/pt-passages';
import { esPassages } from '../data/listening/es-passages';
import { arPassages } from '../data/listening/ar-passages';
import { roPassages } from '../data/listening/ro-passages';
import DictationDrill from '../components/drills/DictationDrill';
import { playListeningPassage, type ListeningPlayback, type ListeningPlaybackResult } from '../lib/tts';
import type { ListeningPassage, ListeningQuestion } from '../data/listening/ja-passages';
import { useGuidedPractice } from '../hooks/useGuidedPractice';
import {
  GuidedCompletionActions,
  GuidedPracticeError,
  GuidedPracticeNotice,
} from '../components/learn/GuidedPractice';
import { useAdaptivePractice } from '../hooks/useAdaptivePractice';
import AdaptivePracticeNotice from '../components/common/AdaptivePracticeNotice';
import PracticeWordCapture from '../components/common/PracticeWordCapture';
import LexicalCoverageNote from '../components/common/LexicalCoverageNote';
import { isRTL } from '../lib/rtl';
import { getLanguageName } from '../lib/languages';
import InputActivityLink from '../components/learn/InputActivityLink';

// ── helpers ─────────────────────────────────────────────

const LANG_PASSAGES: Record<string, ListeningPassage[]> = {
  ja: jaPassages,
  ru: ruPassages,
  pt: ptPassages,
  es: esPassages,
  ar: arPassages,
  ro: roPassages,
};

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25] as const;

type Difficulty = 'easy' | 'medium' | 'hard' | 'all';
type Mode = 'comprehension' | 'dictation';
type Screen = 'setup' | 'practice' | 'questions' | 'summary' | 'dictation' | 'dictation-summary';

// ── component ───────────────────────────────────────────

const LISTENING_LANGUAGES = Object.keys(LANG_PASSAGES);

export default function ListeningPage() {
  const current = useCurrentLanguage(LISTENING_LANGUAGES);
  const [params] = useSearchParams();
  return <ListeningAttempt key={`${current.language ?? current.requested}:${params}`} current={current} />;
}

function ListeningAttempt({ current }: { current: ReturnType<typeof useCurrentLanguage> }) {
  const [searchParams] = useSearchParams();
  const {
    language: currentLanguage,
    setLanguage,
    options: supportedLanguages,
    isSupported,
    requested,
  } = current;

  const language = currentLanguage ?? '';
  const adaptive = useAdaptivePractice<ListeningPassage>(language);
  const [difficulty, setDifficulty] = useState<Difficulty>('all');
  const timerStart = useTimerStore((s) => s.start);
  const timerRunning = useTimerStore((s) => s.isRunning);
  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get('mode') === 'dictation' ? 'dictation' : 'comprehension',
  );
  const [screen, setScreen] = useState<Screen>('setup');
  const [passage, setPassage] = useState<ListeningPassage | null>(null);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [guidedPassages, setGuidedPassages] = useState<ListeningPassage[]>([]);
  const [guidedPassageIndex, setGuidedPassageIndex] = useState(0);

  // practice
  const [speed, setSpeed] = useState(1.0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playback = useRef<ListeningPlayback | null>(null);
  const [playbackResult, setPlaybackResult] = useState<ListeningPlaybackResult | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [transcriptSupported, setTranscriptSupported] = useState(false);

  // questions
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [revealed, setRevealed] = useState(false);

  // summary
  const [xpAwarded, setXpAwarded] = useState(0);

  // dictation summary
  const [dictationStats, setDictationStats] = useState<{ correct: number; total: number; xpEarned: number } | null>(null);
  const guided = useGuidedPractice(
    mode === 'dictation' ? 'dictation' : 'listening',
    language,
  );

  // Cancel any ongoing speech when leaving the page
  useEffect(() => {
    return () => {
      const active = playback.current;
      playback.current = null;
      active?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ── passage selection ─────────────────────────────────

  // ── handlers ──────────────────────────────────────────

  const stopPlayback = useCallback(() => {
    const active = playback.current;
    playback.current = null;
    active?.stop();
    setIsPlaying(false);
  }, []);

  const beginPassage = useCallback((nextPassage: ListeningPassage) => {
    stopPlayback();
    setPassage(nextPassage);
    setUsedIds((prev) => new Set(prev).add(nextPassage.id));
    setHasPlayed(false);
    setPlaybackResult(null);
    setTranscriptOpen(false);
    setTranscriptSupported(false);
    setSpeed(1.0);
    setQIndex(0);
    setAnswers(nextPassage.questions.map(() => null));
    setRevealed(false);
    setXpAwarded(0);
    setScreen('practice');
  }, [stopPlayback]);

  const startPractice = async () => {
    // Records listening time under its own activity so the study balance and
    // the "try listening" suggestion reflect what actually happened.
    if (!timerRunning) timerStart('listening');
    if (mode === 'dictation') {
      setScreen('dictation');
      return;
    }
    const effectiveDifficulty = guided.descriptor?.scope?.difficulty ?? difficulty;
    let pool = (LANG_PASSAGES[language] ?? []).filter((p) =>
      effectiveDifficulty === 'all' || p.difficulty === effectiveDifficulty);
    if (guided.descriptor) {
      const scopedIds = guided.descriptor.scope?.itemIds;
      if (scopedIds) pool = pool.filter((p) => scopedIds.includes(p.id));
    } else {
      const unused = pool.filter((p) => !usedIds.has(p.id));
      if (unused.length) pool = unused;
      else setUsedIds(new Set());
    }
    const selected = await adaptive.start(pool, {
      seed: guided.descriptor?.seed ?? `listening:${language}:${Date.now()}`,
      session: guided.descriptor?.session ?? { minItems: 1, targetItems: 1, maxItems: 1 },
    }, (p, order) => ({
      id: p.id, language, difficulty: p.difficulty, order, text: p.text,
    }));
    if (!selected?.length) return;
    if (guided.descriptor) {
      setGuidedPassages(selected);
      setGuidedPassageIndex(0);
    }
    beginPassage(selected[0]);
  };

  function handlePlay() {
    if (!passage) return;
    stopPlayback();
    setPlaybackResult(null);
    setIsPlaying(true);
    const active = playListeningPassage(passage.text, language, speed);
    playback.current = active;
    void active.finished.then((result) => {
      if (playback.current !== active) return;
      playback.current = null;
      setIsPlaying(false);
      setPlaybackResult(result);
      if (result.status === 'ended') setHasPlayed(true);
    });
  }

  function handleStop() {
    stopPlayback();
    setPlaybackResult({ status: 'cancelled' });
  }

  function goToQuestions() {
    stopPlayback();
    setScreen('questions');
  }

  function selectAnswer(optIdx: number) {
    if (revealed) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = optIdx;
      return next;
    });
    setRevealed(true);
  }

  function nextQuestion() {
    if (!passage) return;
    stopPlayback();
    if (qIndex + 1 < passage.questions.length) {
      setQIndex((i) => i + 1);
      setRevealed(false);
    } else {
      // calculate score
      const correct = passage.questions.reduce(
        (sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0),
        0,
      );
      const xp = 25 + correct * 5;
      useXPStore.getState().addXP(xp);
      setXpAwarded(xp);
      if (
        guided.descriptor &&
        guidedPassageIndex + 1 >= guidedPassages.length
      ) {
        void guided.complete({
          itemsCompleted: guidedPassages.length,
          score: Math.round((correct / passage.questions.length) * 100),
        });
      }
      setScreen('summary');
    }
  }

  function handleNextPassage() {
    stopPlayback();
    if (
      guided.descriptor &&
      guidedPassageIndex + 1 < guidedPassages.length
    ) {
      const nextIndex = guidedPassageIndex + 1;
      setGuidedPassageIndex(nextIndex);
      beginPassage(guidedPassages[nextIndex]);
      return;
    }
    startPractice();
  }

  function handleBack() {
    stopPlayback();
    window.speechSynthesis?.cancel();
    setScreen('setup');
  }

  const supportedAttempt = transcriptSupported && (
    <p className="text-sm text-slate-600 dark:text-slate-300">
      Transcript-supported attempt — using support does not reduce XP.
    </p>
  );
  const playbackMessage = playbackResult?.status === 'unavailable'
    ? playbackResult.reason === 'no-voice'
      ? `No ${getLanguageName(language)} speech voice is available on this device. Enable a voice in your device settings and try again, or use the transcript.`
      : 'Speech playback is not available in this browser. You can use the transcript, or try a browser with speech support.'
    : playbackResult?.status === 'error'
      ? 'Speech playback could not finish. Try replaying or use the transcript. Check your device audio; some voices need a connection.'
      : playbackResult?.status === 'cancelled'
        ? 'Playback stopped. Replay whenever helpful.'
        : '';
  const playLabel = isPlaying ? 'Stop playback'
    : hasPlayed || screen !== 'practice' ? 'Replay passage' : 'Play passage';
  const passageSupport = passage && (
    <section aria-label="Passage support" className="space-y-3 text-left">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={isPlaying ? handleStop : handlePlay}
          aria-label={playLabel}
          className={`min-h-[44px] px-4 py-2 rounded-xl font-medium press-feedback transition-colors ${
            screen === 'practice' && !hasPlayed && !transcriptSupported
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <span aria-hidden="true">{isPlaying ? '⏹' : '▶'}</span> {playLabel}
        </button>
        {isPlaying && (
          <button
            onClick={handlePlay}
            className="min-h-[44px] px-3 text-sm text-indigo-600 dark:text-indigo-400"
          >
            Replay from start
          </button>
        )}
      </div>
      <div role="group" aria-label="Playback speed" className="flex flex-wrap items-center gap-2">
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            aria-pressed={speed === s}
            className={`min-h-[44px] px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              speed === s
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Repeating is optional. Replay as often as you like; speed changes apply to the next playback.
      </p>
      <p role="status" className="text-sm text-slate-600 dark:text-slate-300">{playbackMessage}</p>
      {screen !== 'summary' && (
        <button
          onClick={() => {
            if (!transcriptOpen) setTranscriptSupported(true);
            setTranscriptOpen((open) => !open);
          }}
          aria-expanded={transcriptOpen}
          aria-controls="listening-transcript"
          className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {transcriptOpen ? 'Hide transcript' : 'Show transcript'}
        </button>
      )}
      <div id="listening-transcript" hidden={!transcriptOpen && screen !== 'summary'}>
        {(transcriptOpen || screen === 'summary') && (
          <p lang={language} dir={isRTL(language) ? 'rtl' : undefined} className="whitespace-pre-wrap text-slate-800 dark:text-slate-100">
            {passage.text}
          </p>
        )}
      </div>
    </section>
  );

  if (guided.invalidMessage) {
    return <GuidedPracticeError message={guided.invalidMessage} />;
  }

  // ── no supported languages ────────────────────────────

  if (supportedLanguages.length === 0) {
    return (
      <div className="text-center py-12 page-enter">
        <p className="text-4xl mb-4">🎧</p>
        <p className="text-slate-600 dark:text-slate-300 mb-2">
          No listening content is available for your active languages.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Add one of these languages in Settings to get started.
        </p>
        <Link to="/settings" className="text-indigo-600 dark:text-indigo-400 font-medium">
          Go to Settings →
        </Link>
      </div>
    );
  }

  // ── SETUP ─────────────────────────────────────────────

  if (screen === 'setup') {
    return (
      <div className="page-enter">
        <Link to="/learn" className="inline-flex min-h-[44px] items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-3 hover:underline press-feedback inline-block">
          ← Back to Learn
        </Link>
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-6">
          🎧 Listening Practice
        </h2>
        <GuidedPracticeNotice guided={guided} />

        {!guided.descriptor && !isSupported && (
          <LanguageUnavailable
            className="mb-6"
            requested={requested}
            options={supportedLanguages}
            onChange={setLanguage}
            feature="Listening practice"
          />
        )}

        {!guided.descriptor && supportedLanguages.length > 1 && (
          <>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Language
            </label>
            <LanguagePicker
              className="mb-6"
              options={supportedLanguages}
              value={language}
              onChange={setLanguage}
              label="Listening language"
            />
          </>
        )}

        {!guided.descriptor && (
          <>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Mode
            </label>
            <div className="flex gap-2 mb-6">
              {([
                { key: 'comprehension' as Mode, label: '🎧 Comprehension' },
                { key: 'dictation' as Mode, label: '✍️ Dictation' },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
                    mode === key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Difficulty */}
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
          Difficulty
        </label>
        <div className="flex gap-2 mb-8">
          {(['all', 'easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium capitalize transition-colors ${
                difficulty === d
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <button
          onClick={startPractice}
          disabled={!language || adaptive.status === 'loading'}
          className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-semibold text-lg disabled:opacity-50 hover:bg-indigo-700 press-feedback transition-colors"
        >
          {mode === 'dictation' ? 'Start Dictation Practice' : 'Start Listening Practice'}
        </button>
        <AdaptivePracticeNotice {...adaptive} />
      </div>
    );
  }

  // ── PRACTICE (audio) ──────────────────────────────────

  if (screen === 'practice' && passage) {
    return (
      <div className="page-enter space-y-4">
        <GuidedPracticeNotice guided={guided} />
        <AdaptivePracticeNotice {...adaptive} />
        <button onClick={handleBack} className="min-h-[44px] text-sm text-indigo-600 dark:text-indigo-400 mb-4">
          ← Back
        </button>

        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
          {passage.title}
        </h3>
        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize mb-6">
          {passage.difficulty}
        </span>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Try listening first, or open the transcript whenever you need it — even before answering.
        </p>
        {supportedAttempt}
        {passageSupport}

        {(hasPlayed || transcriptSupported) && (
          <button
            onClick={goToQuestions}
            className="min-h-[44px] w-full py-3 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 press-feedback transition-colors"
          >
            Answer Questions →
          </button>
        )}
      </div>
    );
  }

  // ── QUESTIONS ─────────────────────────────────────────

  if (screen === 'questions' && passage) {
    const q: ListeningQuestion = passage.questions[qIndex];
    const selected = answers[qIndex];

    return (
      <div className="page-enter space-y-4">
        <button onClick={handleBack} className="min-h-[44px] text-sm text-indigo-600 dark:text-indigo-400">
          ← Back
        </button>
        {supportedAttempt}
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          Question {qIndex + 1} / {passage.questions.length}
        </p>

        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">
          {q.question}
        </p>

        <div className="space-y-3 mb-6">
          {q.options.map((opt, i) => {
            let style =
              'bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100';
            if (revealed) {
              if (i === q.correctIndex) {
                style = 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
              } else if (i === selected && i !== q.correctIndex) {
                style = 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200';
              }
            } else if (i === selected) {
              style = 'bg-indigo-100 dark:bg-indigo-900 border border-indigo-500 text-indigo-800 dark:text-indigo-200';
            }

            return (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                disabled={revealed}
                className={`min-h-[44px] w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${style}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div role="status" className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            <p className="font-semibold">{selected === q.correctIndex ? 'Correct.' : 'Not quite — keep exploring the passage.'}</p>
            <p>Your answer: {selected == null ? 'No answer selected' : q.options[selected]}</p>
            <p>Correct answer: {q.options[q.correctIndex]}</p>
            <p className="text-slate-500 dark:text-slate-400">
              Replay or use the full transcript to revisit the answer in context.
            </p>
          </div>
        )}
        {passageSupport}
        {revealed && (
          <button
            onClick={nextQuestion}
            className="min-h-[44px] w-full py-3 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 press-feedback transition-colors"
          >
            {qIndex + 1 < passage.questions.length ? 'Next Question →' : 'See Results'}
          </button>
        )}
      </div>
    );
  }

  // ── SUMMARY ───────────────────────────────────────────

  if (screen === 'summary' && passage) {
    const correct = passage.questions.reduce(
      (sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0),
      0,
    );
    const guidedFinished =
      guided.isGuided &&
      guidedPassageIndex + 1 >= guidedPassages.length;

    return (
      <div className="text-center py-6 page-enter">
        <p className="text-4xl mb-4">🎉</p>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Practice Complete!
        </h3>
        <p className="text-slate-600 dark:text-slate-300 mb-1">
          Passage questions: {correct} / {passage.questions.length} correct
        </p>
        {supportedAttempt}
        <p className="text-indigo-600 dark:text-indigo-400 font-semibold mb-8">
          +{xpAwarded} XP earned
        </p>
        <div className="mb-6">{passageSupport}</div>
        {adaptive.selection?.items.find((item) => item.id === passage.id)?.coverage && (
          <LexicalCoverageNote coverage={adaptive.selection.items.find((item) => item.id === passage.id)!.coverage!} />
        )}
        <PracticeWordCapture language={language} text={passage.text} source="listening" />

        {guidedFinished ? (
          <GuidedCompletionActions guided={guided} onPracticeAgain={handleBack} />
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex-1 py-3 rounded-2xl border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 press-feedback transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNextPassage}
              className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 press-feedback transition-colors"
            >
              {guided.isGuided ? 'Next guided passage' : 'Next Passage'}
            </button>
          </div>
        )}
        {(!guided.isGuided || guidedFinished) && <InputActivityLink language={language} after="listening" />}
      </div>
    );
  }

  // ── DICTATION ──────────────────────────────────────────

  if (screen === 'dictation') {
    return (
      <DictationDrill
        language={language}
        difficulty={difficulty}
        onComplete={(stats) => {
          void guided.complete({
            itemsCompleted: stats.total,
            score: Math.round((stats.correct / stats.total) * 100),
          });
          setDictationStats(stats);
          setScreen('dictation-summary');
        }}
        onBack={handleBack}
        guidedDescriptor={guided.descriptor ?? undefined}
      />
    );
  }

  // ── DICTATION SUMMARY ────────────────────────────────

  if (screen === 'dictation-summary' && dictationStats) {
    return (
      <div className="text-center py-6 page-enter">
        <p className="text-4xl mb-4">🎉</p>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Dictation Complete!
        </h3>
        <p className="text-slate-600 dark:text-slate-300 mb-1">
          {dictationStats.correct} / {dictationStats.total} sentences with ≥80% accuracy
        </p>
        <p className="text-indigo-600 dark:text-indigo-400 font-semibold mb-8">
          +{dictationStats.xpEarned} XP earned
        </p>

        <GuidedCompletionActions guided={guided} onPracticeAgain={handleBack} />
        {!guided.isGuided && (
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex-1 py-3 rounded-2xl border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 press-feedback transition-colors min-h-[44px]"
            >
              Back
            </button>
            <button
              onClick={() => {
                setDictationStats(null);
                setScreen('dictation');
              }}
              className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 press-feedback transition-colors min-h-[44px]"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
