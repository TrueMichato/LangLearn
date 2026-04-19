import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAlphabetsForLanguage } from '../data/alphabets';
import { getCharacterProgress } from '../db/characters';
import CharacterChart from '../components/letters/CharacterChart';
import DrawingCanvas from '../components/letters/DrawingCanvas';
import RecognitionQuiz from '../components/letters/RecognitionQuiz';
import GuidedLearning from '../components/letters/GuidedLearning';
import { SkeletonCard, SkeletonList } from '../components/common/Skeleton';
import type { CharacterProgress } from '../db/schema';

type PracticeMode = 'chart' | 'draw' | 'quiz' | 'learn';

export default function LetterPractice() {
  const { lang = 'ja' } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<PracticeMode>('chart');
  const [progress, setProgress] = useState<Map<string, CharacterProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const alphabets = getAlphabetsForLanguage(lang);
  const [selectedAlphabet, setSelectedAlphabet] = useState(0);

  const refreshProgress = () => {
    getCharacterProgress(lang).then((items) => {
      const map = new Map<string, CharacterProgress>();
      for (const item of items) map.set(item.id, item);
      setProgress(map);
      setLoading(false);
    });
  };

  useEffect(() => {
    setLoading(true);
    refreshProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, mode]);

  if (alphabets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">No letter systems available for this language.</p>
        <button onClick={() => navigate('/learn')} className="mt-4 text-indigo-600 dark:text-indigo-400 press-feedback">
          ← Back to Learn
        </button>
      </div>
    );
  }

  const currentAlphabet = alphabets[selectedAlphabet];

  return (
    <div>
      <button
        onClick={() => navigate('/learn')}
        className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-3 hover:underline press-feedback"
      >
        ← Back to Learn
      </button>
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Letter Practice</h2>

      {/* Alphabet selector */}
      {alphabets.length > 1 && (
        <div className="flex gap-2 mb-3">
          {alphabets.map((a, i) => (
            <button
              key={a.name}
              onClick={() => setSelectedAlphabet(i)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors press-feedback ${
                selectedAlphabet === i
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>
      )}

      {/* Mode tabs */}
      <div className="flex gap-2 mb-4">
        {(
          [
            ['learn', '📖 Learn'],
            ['chart', '📊 Chart'],
            ['draw', '✏️ Draw'],
            ['quiz', '🧠 Quiz'],
          ] as [PracticeMode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors press-feedback ${
              mode === m
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonList count={2} />
        </div>
      ) : (
        <>
          {mode === 'learn' && (
            <GuidedLearning
              characters={currentAlphabet.characters}
              alphabetName={currentAlphabet.name}
              language={lang}
              onProgress={refreshProgress}
            />
          )}
          {mode === 'chart' && (
            <CharacterChart
              characters={currentAlphabet.characters}
              alphabetName={currentAlphabet.name}
              language={lang}
              progress={progress}
            />
          )}
          {mode === 'draw' && (
            <DrawingCanvas
              characters={currentAlphabet.characters}
              alphabetName={currentAlphabet.name}
              language={lang}
              onProgress={refreshProgress}
            />
          )}
          {mode === 'quiz' && (
            <RecognitionQuiz
              characters={currentAlphabet.characters}
              alphabetName={currentAlphabet.name}
              language={lang}
              onProgress={refreshProgress}
            />
          )}
        </>
      )}
    </div>
  );
}
