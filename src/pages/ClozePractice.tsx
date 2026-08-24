import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import LanguagePicker from '../components/common/LanguagePicker';
import LanguageUnavailable from '../components/common/LanguageUnavailable';
import { useXPStore } from '../stores/xpStore';
import { isRTL } from '../lib/rtl';
import { jaClozeSentences, ruClozeSentences, ptClozeSentences, esClozeSentences, arClozeSentences, roClozeSentences } from '../data/cloze';
import type { ClozeSentence } from '../data/cloze';
import { speak } from '../lib/tts';
import { useGuidedPractice } from '../hooks/useGuidedPractice';
import {
  GuidedCompletionActions,
  GuidedPracticeError,
  GuidedPracticeNotice,
} from '../components/learn/GuidedPractice';
import { selectGuidedItems } from '../lib/guided-practice';

type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'all';
type Phase = 'setup' | 'session' | 'summary';

const QUESTIONS_PER_SESSION = 10;
const XP_BASE = 20;
const XP_PER_CORRECT = 3;
const ACTIVE_DIFFICULTY_CLASSES = 'bg-indigo-600 text-white';
const INACTIVE_DIFFICULTY_CLASSES =
  'border border-slate-300 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-700 dark:text-slate-300';

const CLOZE_LANGUAGES = ['ja', 'ru', 'pt', 'es', 'ar', 'ro'];

function getClozeSentences(lang: string): ClozeSentence[] {
  if (lang === 'ja') return jaClozeSentences;
  if (lang === 'ru') return ruClozeSentences;
  if (lang === 'pt') return ptClozeSentences;
  if (lang === 'es') return esClozeSentences;
  if (lang === 'ar') return arClozeSentences;
  if (lang === 'ro') return roClozeSentences;
  return [];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildClozeDisplay(sentence: string, blankedWord: string) {
  const idx = sentence.indexOf(blankedWord);
  if (idx === -1) return { before: sentence, after: '' };
  return {
    before: sentence.slice(0, idx),
    after: sentence.slice(idx + blankedWord.length),
  };
}

export default function ClozePracticePage() {
  const {
    language: currentLanguage,
    setLanguage,
    options: supportedLanguages,
    isSupported,
    requested,
  } = useCurrentLanguage(CLOZE_LANGUAGES);

  const [phase, setPhase] = useState<Phase>('setup');
  const language = currentLanguage ?? 'ja';
  const [difficulty, setDifficulty] = useState<Difficulty>('all');
  const [sessionQuestions, setSessionQuestions] = useState<ClozeSentence[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [streak, setStreak] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allSentences = useMemo(() => getClozeSentences(language), [language]);
  const guided = useGuidedPractice('cloze', language);

  const startSession = useCallback(() => {
    let pool = allSentences;
    if (!guided.descriptor && difficulty !== 'all') {
      pool = pool.filter((s) => s.difficulty === difficulty);
    }
    // Sort by frequency (lower rank = more common words first)
    const sorted = [...pool].sort((a, b) => a.frequencyRank - b.frequencyRank);
    const candidates = sorted.slice(
      0,
      Math.min(
        sorted.length,
        guided.descriptor
          ? guided.descriptor.session.maxItems * 3
          : QUESTIONS_PER_SESSION * 3,
      ),
    );
    const selected = guided.descriptor
      ? selectGuidedItems(candidates, guided.descriptor, (sentence) => sentence.id)
      : shuffle(candidates).slice(0, QUESTIONS_PER_SESSION);
    if (selected.length === 0) return;
    setSessionQuestions(selected);
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setInput('');
    setAnswered(false);
    setPhase('session');
  }, [allSentences, difficulty, guided.descriptor]);

  useEffect(() => {
    if (phase === 'session' && !answered) {
      inputRef.current?.focus();
    }
  }, [phase, currentIdx, answered]);

  const handleSubmit = useCallback(() => {
    if (answered || !input.trim()) return;
    const current = sessionQuestions[currentIdx];
    const correct = input.trim().toLowerCase() === current.blankedWord.toLowerCase();
    setAnswered(true);
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  }, [answered, input, sessionQuestions, currentIdx]);

  const handleNext = () => {
    const next = currentIdx + 1;
    if (next >= sessionQuestions.length) {
      const finalScore = score;
      const xp = XP_BASE + finalScore * XP_PER_CORRECT;
      useXPStore.getState().addXP(xp);
      void guided.complete({
        itemsCompleted: sessionQuestions.length,
        score: Math.round((finalScore / sessionQuestions.length) * 100),
      });
      setPhase('summary');
    } else {
      setCurrentIdx(next);
      setInput('');
      setAnswered(false);
      setIsCorrect(false);
    }
  };

  if (guided.invalidMessage) {
    return <GuidedPracticeError message={guided.invalidMessage} />;
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (answered) {
        handleNext();
      } else {
        handleSubmit();
      }
    }
  };

  const handleTTS = (text: string) => {
    speak(text, language);
  };

  const restart = () => {
    setPhase('setup');
    setScore(0);
    setCurrentIdx(0);
    setSessionQuestions([]);
    setInput('');
    setAnswered(false);
    setStreak(0);
  };

  // ── Setup ──
  if (phase === 'setup') {
    return (
      <div className="max-w-md mx-auto space-y-6 page-enter">
        <div>
          <Link to="/learn" className="inline-flex min-h-[44px] items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-3 hover:underline press-feedback inline-block">
            ← Back to Learn
          </Link>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">🧩 Cloze Practice</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fill in the missing word from context. Sentences are sorted by word frequency — master common words first.
          </p>
        </div>
        <GuidedPracticeNotice guided={guided} />

        {!guided.descriptor && !isSupported && (
          <LanguageUnavailable
            requested={requested}
            options={supportedLanguages}
            onChange={setLanguage}
            feature="Cloze practice"
          />
        )}

        {!guided.descriptor && supportedLanguages.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Language</label>
            <LanguagePicker
              options={supportedLanguages}
              value={language}
              onChange={setLanguage}
              label="Cloze language"
            />
          </div>
        )}

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Difficulty</label>
          <div className="flex flex-wrap gap-2">
            {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium capitalize transition-colors min-h-[44px] ${
                  difficulty === d
                    ? ACTIVE_DIFFICULTY_CLASSES
                    : INACTIVE_DIFFICULTY_CLASSES
                }`}
              >
                {d === 'all' ? '🌀 All Levels' : d === 'beginner' ? '🟢 Beginner' : d === 'intermediate' ? '🟡 Intermediate' : '🔴 Advanced'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-3 text-sm text-indigo-700 dark:text-indigo-300">
          📊 <strong>{allSentences.filter((s) => difficulty === 'all' || s.difficulty === difficulty).length}</strong> sentences available
          {difficulty !== 'all' && ` at ${difficulty} level`}
        </div>

        {/* Start */}
        <button
          onClick={startSession}
          disabled={supportedLanguages.length === 0 || allSentences.filter((s) => difficulty === 'all' || s.difficulty === difficulty).length === 0}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 press-feedback transition-colors disabled:opacity-40 min-h-[44px]"
        >
          Start Cloze Practice
        </button>
      </div>
    );
  }

  // ── Summary ──
  if (phase === 'summary') {
    const xp = XP_BASE + score * XP_PER_CORRECT;
    const pct = Math.round((score / sessionQuestions.length) * 100);
    return (
      <div className="max-w-md mx-auto text-center space-y-6 page-enter">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Session Complete!</h2>
        <p className="text-5xl">{pct >= 80 ? '🎉' : pct >= 50 ? '👏' : '💪'}</p>
        <p className="text-lg text-slate-700 dark:text-slate-300">
          Score: <span className="font-bold text-indigo-600 dark:text-indigo-400">{score}</span> / {sessionQuestions.length}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">+{xp} XP earned</p>

        {pct < 50 && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            💡 Tip: Try the beginner level to build up common vocabulary first.
          </p>
        )}

        <GuidedCompletionActions guided={guided} onPracticeAgain={restart} />
        {!guided.isGuided && (
          <div className="flex flex-col gap-3">
            <button onClick={restart} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 press-feedback transition-colors min-h-[44px]">
              Practice Again
            </button>
            <Link to="/learn" className="w-full py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 press-feedback transition-colors inline-block text-center min-h-[44px] leading-[44px]">
              ← Back to Learn
            </Link>
          </div>
        )}
      </div>
    );
  }

  // ── Session ──
  const current = sessionQuestions[currentIdx];
  const { before, after } = buildClozeDisplay(current.target, current.blankedWord);

  return (
    <div className="max-w-md mx-auto space-y-4 page-enter">
      <GuidedPracticeNotice guided={guided} />
      {/* Progress bar */}
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>
          {currentIdx + 1} / {sessionQuestions.length}
        </span>
        <div className="flex items-center gap-3">
          {streak >= 3 && <span className="text-orange-500">🔥 {streak}</span>}
          <span>Score: {score}</span>
        </div>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
        <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${((currentIdx + 1) / sessionQuestions.length) * 100}%` }} />
      </div>

      {/* Cloze card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 space-y-4">
        {/* English hint */}
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
          {current.english}
        </p>

        {/* Cloze sentence */}
        <p className="text-lg text-slate-800 dark:text-slate-100 text-center leading-relaxed" dir={isRTL(language) ? 'rtl' : undefined}>
          {before}
          <span className={`inline-block border-b-2 px-3 min-w-[60px] font-semibold ${
            answered
              ? isCorrect
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-red-500 text-red-600 dark:text-red-400'
              : 'border-indigo-400 text-indigo-600 dark:text-indigo-400'
          }`}>
            {answered ? current.blankedWord : '______'}
          </span>
          {after}
        </p>

        {/* TTS button */}
        <div className="flex justify-center">
          <button
            onClick={() => handleTTS(answered ? current.target : `${before} ${after}`)}
            className="inline-flex min-h-[44px] items-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline min-h-[44px] px-3"
            title="Listen"
          >
            🔊 Listen
          </button>
        </div>

        {/* Answer area */}
        {answered ? (
          <div className="text-center space-y-3">
            {isCorrect ? (
              <p className="text-green-600 dark:text-green-400 font-semibold text-lg">✓ Correct!</p>
            ) : (
              <div>
                <p className="text-red-600 dark:text-red-400 font-semibold text-lg">No worries!</p>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  Answer: <strong>{current.blankedWord}</strong>
                  {current.blankedReading && (
                    <span className="text-slate-500 dark:text-slate-400 ml-2">({current.blankedReading})</span>
                  )}
                </p>
              </div>
            )}
            <button
              onClick={handleNext}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 press-feedback transition-colors min-h-[44px]"
            >
              {currentIdx + 1 >= sessionQuestions.length ? 'See Results' : 'Next →'}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type the missing word…"
              className="flex-1 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 min-h-[44px]"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              dir={isRTL(language) ? 'rtl' : undefined}
              spellCheck={false}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 min-h-[44px]"
            >
              Check
            </button>
          </div>
        )}

        {/* Difficulty badge */}
        <div className="flex justify-center">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            current.difficulty === 'beginner' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
            current.difficulty === 'intermediate' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' :
            'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
          }`}>
            {current.difficulty}
          </span>
        </div>
      </div>
    </div>
  );
}
