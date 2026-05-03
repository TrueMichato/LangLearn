import { useState, useRef, useEffect } from 'react';
import type { Word } from '../../db/schema';
import type { SM2Grade } from '../../lib/sm2';

interface ClozeCardProps {
  word: Word;
  onGrade: (grade: SM2Grade) => void;
}

export default function ClozeCard({ word, onGrade }: ClozeCardProps) {
  const [input, setInput] = useState('');
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sentenceIndex = word.contextSentence
    ? word.contextSentence.toLowerCase().indexOf(word.word.toLowerCase())
    : -1;

  const hasCloze = word.contextSentence && sentenceIndex !== -1;
  const beforeBlank = hasCloze ? word.contextSentence.slice(0, sentenceIndex) : '';
  const afterBlank = hasCloze
    ? word.contextSentence.slice(sentenceIndex + word.word.length)
    : '';

  const handleSubmit = () => {
    if (answered || !input.trim()) return;
    const isCorrect = input.trim().toLowerCase() === word.word.toLowerCase();
    setAnswered(true);
    setCorrect(isCorrect);
    setTimeout(() => onGrade(isCorrect ? 4 : 0), isCorrect ? 1500 : 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      {hasCloze ? (
        <p className="text-lg text-gray-800 dark:text-gray-100 text-center leading-relaxed mb-6">
          {beforeBlank}
          <span className="inline-block border-b-2 border-indigo-400 px-4 min-w-[60px]">
            {answered ? word.word : '___'}
          </span>
          {afterBlank}
        </p>
      ) : (
        <p className="text-lg text-gray-800 dark:text-gray-100 text-center leading-relaxed mb-6">
          Type the word that means: <strong>{word.meaning}</strong>
        </p>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
        Meaning: {word.meaning}
      </p>

      {word.reading && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-4">
          {word.reading}
        </p>
      )}

      {answered ? (
        <div className="text-center">
          {correct ? (
            <p className="text-green-600 dark:text-green-400 font-semibold text-lg">✓ Correct!</p>
          ) : (
            <div>
              <p className="text-red-600 dark:text-red-400 font-semibold text-lg">
                ✗ Incorrect
              </p>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Correct answer: <strong>{word.word}</strong>
              </p>
            </div>
          )}
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
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          />
          <button
            onClick={handleSubmit}
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Check
          </button>
        </div>
      )}
    </div>
  );
}
