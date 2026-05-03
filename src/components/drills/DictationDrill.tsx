import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useXPStore } from '../../stores/xpStore';
import { compareTexts } from '../../lib/text-diff';
import { XP_DICTATION_BASE, XP_PER_DICTATION_CORRECT } from '../../lib/xp';
import { jaPassages } from '../../data/listening/ja-passages';
import { ruPassages } from '../../data/listening/ru-passages';
import { ptPassages } from '../../data/listening/pt-passages';
import type { ListeningPassage } from '../../data/listening/ja-passages';
import type { DiffResult } from '../../lib/text-diff';

const LANG_PASSAGES: Record<string, ListeningPassage[]> = {
  ja: jaPassages,
  ru: ruPassages,
  pt: ptPassages,
};

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25] as const;
const SENTENCES_PER_SESSION = 10;
const MAX_PLAYS = 3;
const ACCURACY_THRESHOLD = 80;

interface DictationDrillProps {
  language: string;
  difficulty: string;
  onComplete: (stats: { correct: number; total: number; xpEarned: number }) => void;
  onBack: () => void;
}

function speakSentence(text: string, language: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const LANG_MAP: Record<string, string> = { ja: 'ja-JP', ru: 'ru-RU' };
    utterance.lang = LANG_MAP[language] ?? language;
    utterance.rate = rate;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

function extractSentences(passages: ListeningPassage[], difficulty: string): string[] {
  const filtered = difficulty === 'all'
    ? passages
    : passages.filter((p) => p.difficulty === difficulty);

  const sentences: string[] = [];
  for (const p of filtered) {
    // Split by sentence-ending punctuation
    const parts = p.text.split(/(?<=[。．.！？!?])\s*/);
    for (const s of parts) {
      const trimmed = s.trim();
      if (trimmed.length > 0) sentences.push(trimmed);
    }
  }
  return sentences;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function DictationDrill({ language, difficulty, onComplete, onBack }: DictationDrillProps) {
  const allSentences = useMemo(() => {
    const pool = extractSentences(LANG_PASSAGES[language] ?? [], difficulty);
    return shuffle(pool).slice(0, SENTENCES_PER_SESSION);
  }, [language, difficulty]);

  const total = allSentences.length;

  const [index, setIndex] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [playsLeft, setPlaysLeft] = useState(MAX_PLAYS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [results, setResults] = useState<number[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentSentence = allSentences[index] ?? '';

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  useEffect(() => {
    if (!submitted) textareaRef.current?.focus();
  }, [index, submitted]);

  const handlePlay = useCallback(async () => {
    if (isPlaying || playsLeft <= 0) return;
    setIsPlaying(true);
    setPlaysLeft((n) => n - 1);
    await speakSentence(currentSentence, language, speed);
    setIsPlaying(false);
  }, [isPlaying, playsLeft, currentSentence, language, speed]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (submitted || !input.trim()) return;
    const result = compareTexts(input, currentSentence, language);
    setDiffResult(result);
    setSubmitted(true);
    setResults((prev) => [...prev, result.score]);
    window.speechSynthesis?.cancel();
  }, [submitted, input, currentSentence, language]);

  const handleNext = useCallback(() => {
    if (index + 1 >= total) {
      // Calculate XP
      const correctCount = [...results].filter((s) => s >= ACCURACY_THRESHOLD).length;
      const xp = XP_DICTATION_BASE + correctCount * XP_PER_DICTATION_CORRECT;
      useXPStore.getState().addXP(xp);
      onComplete({ correct: correctCount, total, xpEarned: xp });
    } else {
      setIndex((i) => i + 1);
      setInput('');
      setSubmitted(false);
      setDiffResult(null);
      setPlaysLeft(MAX_PLAYS);
      setSpeed(1.0);
    }
  }, [index, total, results, onComplete]);

  // No sentences available
  if (total === 0) {
    return (
      <div className="text-center py-12 page-enter">
        <p className="text-4xl mb-4">🎧</p>
        <p className="text-slate-600 dark:text-slate-300 mb-4">
          No sentences available for this difficulty.
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 press-feedback transition-colors min-h-[44px]"
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <button
        onClick={() => { window.speechSynthesis?.cancel(); onBack(); }}
        className="text-sm text-indigo-600 dark:text-indigo-400 mb-4 min-h-[44px] inline-flex items-center"
      >
        ← Back
      </button>

      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          ✍️ Dictation
        </h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {index + 1} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
          style={{ width: `${((index + (submitted ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      {/* Prompt */}
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        Listen and type what you hear
      </p>

      {/* Play controls */}
      <div className="flex flex-col items-center gap-3 mb-4">
        <button
          onClick={handlePlay}
          disabled={isPlaying || playsLeft <= 0}
          className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg hover:bg-indigo-700 disabled:opacity-60 press-feedback transition-colors"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {playsLeft} {playsLeft === 1 ? 'play' : 'plays'} remaining
        </p>
      </div>

      {/* Speed selector */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              speed === s
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Input area */}
      {!submitted ? (
        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={language === 'ja' ? 'ここに入力してください…' : 'Введите здесь…'}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-base mb-4"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 press-feedback transition-colors min-h-[44px]"
          >
            Check
          </button>
        </form>
      ) : diffResult && (
        <div className="space-y-4">
          {/* Score badge */}
          <div className={`text-center py-3 rounded-xl font-semibold ${
            diffResult.score >= ACCURACY_THRESHOLD
              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
          }`}>
            {diffResult.score >= ACCURACY_THRESHOLD ? '✅' : '📝'} {diffResult.score}% accurate
          </div>

          {/* Diff display */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
              Your answer
            </p>
            <p className="text-base leading-relaxed mb-4">
              {diffResult.segments.map((seg, i) => (
                <span
                  key={i}
                  className={
                    seg.status === 'correct'
                      ? 'text-green-700 dark:text-green-300'
                      : seg.status === 'incorrect'
                        ? 'text-red-600 dark:text-red-400 line-through'
                        : 'text-red-600 dark:text-red-400 underline'
                  }
                >
                  {seg.status === 'missing' ? `[${seg.text}]` : seg.text}
                </span>
              ))}
            </p>

            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
              Reference
            </p>
            <p className="text-base text-slate-800 dark:text-slate-100 leading-relaxed">
              {currentSentence}
            </p>
          </div>

          {/* Next button */}
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 press-feedback transition-colors min-h-[44px]"
          >
            {index + 1 < total ? 'Next →' : 'See Results'}
          </button>
        </div>
      )}
    </div>
  );
}
