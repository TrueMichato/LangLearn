import { useState, useEffect } from 'react';
import { getKnownWordCount, type WordCountByLanguage } from '../../db/words';
import { getLanguageLabel } from '../../lib/languages';

const MILESTONES = [100, 250, 500, 1000, 2000, 3000, 5000];

const JLPT_LEVELS = [
  { label: 'N5', words: 800 },
  { label: 'N4', words: 1500 },
  { label: 'N3', words: 3750 },
  { label: 'N2', words: 6000 },
  { label: 'N1', words: 10000 },
];

function getProficiencyLevel(known: number): string {
  if (known >= 5000) return 'Advanced';
  if (known >= 2000) return 'Upper Intermediate';
  if (known >= 1000) return 'Intermediate';
  if (known >= 500) return 'Elementary';
  if (known >= 100) return 'Beginner';
  return 'Just Starting';
}

function getNextMilestone(known: number): number {
  return MILESTONES.find((m) => m > known) ?? MILESTONES[MILESTONES.length - 1];
}

function getPrevMilestone(known: number): number {
  const passed = MILESTONES.filter((m) => m <= known);
  return passed.length > 0 ? passed[passed.length - 1] : 0;
}

function getJlptLevel(known: number): string | null {
  for (let i = JLPT_LEVELS.length - 1; i >= 0; i--) {
    if (known >= JLPT_LEVELS[i].words) return JLPT_LEVELS[i].label;
  }
  return null;
}

function getNextJlpt(known: number): (typeof JLPT_LEVELS)[number] | null {
  return JLPT_LEVELS.find((l) => l.words > known) ?? null;
}

function ProgressRing({ progress, size = 80, strokeWidth = 6 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(progress, 1));

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-indigo-500 dark:text-indigo-400 transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  );
}

function LanguageVocabSection({ data }: { data: WordCountByLanguage }) {
  const nextMilestone = getNextMilestone(data.known);
  const prevMilestone = getPrevMilestone(data.known);
  const progress = (data.known - prevMilestone) / (nextMilestone - prevMilestone);
  const proficiency = getProficiencyLevel(data.known);
  const isJapanese = data.language === 'ja';
  const jlptLevel = isJapanese ? getJlptLevel(data.known) : null;
  const nextJlpt = isJapanese ? getNextJlpt(data.known) : null;

  return (
    <div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
        {getLanguageLabel(data.language)}
      </p>
      <div className="flex items-center gap-4">
        <ProgressRing progress={progress} />
        <div className="flex-1 min-w-0">
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            ~{data.known.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Words Known
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              {proficiency}
            </span>
            {jlptLevel && (
              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                {jlptLevel}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Next milestone: {nextMilestone.toLocaleString()} words</span>
          <span>{data.known}/{nextMilestone}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span>📖 {data.learning} learning</span>
        <span>📗 {data.total} total</span>
      </div>

      {isJapanese && nextJlpt && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Next JLPT level: {nextJlpt.label} (~{nextJlpt.words.toLocaleString()} words)
        </p>
      )}
    </div>
  );
}

export default function VocabSizeCard() {
  const [data, setData] = useState<WordCountByLanguage[] | null>(null);

  useEffect(() => {
    getKnownWordCount().then(setData);
  }, []);

  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-6">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        <span>📊</span> Vocabulary Size
      </h3>
      <div className="space-y-5">
        {data.map((lang) => (
          <LanguageVocabSection key={lang.language} data={lang} />
        ))}
      </div>
    </div>
  );
}
