import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAlphabetsForLanguage } from '../data/alphabets';
import { getCharacterProgress } from '../db/characters';
import CharacterChart from '../components/letters/CharacterChart';
import DrawingCanvas from '../components/letters/DrawingCanvas';
import RecognitionQuiz from '../components/letters/RecognitionQuiz';
import type { CharacterProgress } from '../db/schema';

type PracticeMode = 'chart' | 'draw' | 'quiz';

export default function LetterPractice() {
  const { lang = 'ja' } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<PracticeMode>('chart');
  const [progress, setProgress] = useState<Map<string, CharacterProgress>>(new Map());
  const alphabets = getAlphabetsForLanguage(lang);
  const [selectedAlphabet, setSelectedAlphabet] = useState(0);

  const refreshProgress = () => {
    getCharacterProgress(lang).then((items) => {
      const map = new Map<string, CharacterProgress>();
      for (const item of items) map.set(item.id, item);
      setProgress(map);
    });
  };

  useEffect(() => {
    refreshProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, mode]);

  if (alphabets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No letter systems available for this language.</p>
        <button onClick={() => navigate('/learn')} className="mt-4 text-indigo-600 dark:text-indigo-400">
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
        className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-3 hover:underline"
      >
        ← Back to Learn
      </button>
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Letter Practice</h2>

      {/* Alphabet selector */}
      {alphabets.length > 1 && (
        <div className="flex gap-2 mb-3">
          {alphabets.map((a, i) => (
            <button
              key={a.name}
              onClick={() => setSelectedAlphabet(i)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedAlphabet === i
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
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
            ['chart', '📊 Chart'],
            ['draw', '✏️ Draw'],
            ['quiz', '🧠 Quiz'],
          ] as [PracticeMode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              mode === m
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

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
    </div>
  );
}
