import { useState, useEffect } from 'react';
import type { Character } from '../../data/alphabets';
import { RADICALS } from '../../data/radicals';
import { speak } from '../../lib/tts';
import { addWord, wordExists } from '../../db/words';

interface Props {
  character: Character;
  language: string;
  onClose: () => void;
}

export default function KanjiDetailView({ character, language, onClose }: Props) {
  const [added, setAdded] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    wordExists(character.char, language).then((exists) => {
      setAdded(exists);
      setChecking(false);
    });
  }, [character.char, language]);

  async function handleAddToSRS() {
    if (added || checking) return;
    await addWord({
      word: character.char,
      reading: character.romanji,
      meaning: character.meaning ?? '',
      language,
      tags: ['kanji'],
      type: 'letter',
      contextSentence: character.mnemonic ?? `Reading: ${character.romanji}${character.meaning ? ` (${character.meaning})` : ''}`,
      sourceTextId: null,
    });
    setAdded(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mx-4 mb-4 sm:mb-0 w-full max-w-md max-h-[85vh] overflow-y-auto space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl leading-none min-h-[44px] min-w-[44px] flex items-center justify-center press-feedback"
        >
          ×
        </button>

        {/* Large character + meaning + strokes */}
        <div className="text-center pt-2">
          <span className="text-8xl text-slate-900 dark:text-slate-100">{character.char}</span>
          {character.meaning && (
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300 mt-2">{character.meaning}</p>
          )}
          {character.strokes > 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{character.strokes} strokes</p>
          )}
        </div>

        <hr className="border-slate-200 dark:border-slate-700" />

        {/* Radicals */}
        {character.radicals && character.radicals.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">📦 Radicals</h3>
            <div className="flex flex-wrap gap-2">
              {character.radicals.map((rad) => {
                const info = RADICALS.find((r) => r.char === rad);
                return (
                  <div
                    key={rad}
                    className="bg-slate-100 dark:bg-slate-700 rounded-xl p-3 text-center min-w-[64px]"
                  >
                    <span className="text-2xl text-slate-900 dark:text-slate-100">{rad}</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{info?.name ?? rad}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mnemonic */}
        {character.mnemonic && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">📖 Mnemonic</h3>
            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4 text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
              {character.mnemonic}
            </div>
          </div>
        )}

        {/* Readings */}
        {((character.onyomi && character.onyomi.length > 0) ||
          (character.kunyomi && character.kunyomi.length > 0)) && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">🔤 Readings</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">On&apos;yomi</p>
                <p className="text-slate-700 dark:text-slate-200">
                  {character.onyomi && character.onyomi.length > 0
                    ? character.onyomi.join(', ')
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Kun&apos;yomi</p>
                <p className="text-slate-700 dark:text-slate-200">
                  {character.kunyomi && character.kunyomi.length > 0
                    ? character.kunyomi.join(', ')
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Example words */}
        {character.exampleWords && character.exampleWords.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">📝 Example Words</h3>
            <ul className="space-y-1.5">
              {character.exampleWords.map((w) => (
                <li key={w.word} className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{w.word}</span>{' '}
                  <span className="text-slate-500 dark:text-slate-400">({w.reading})</span> — {w.meaning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => speak(character.char, language)}
            className="bg-slate-100 dark:bg-slate-700 rounded-xl px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[44px] press-feedback"
          >
            🔊 Listen
          </button>
          <button
            onClick={handleAddToSRS}
            disabled={added || checking}
            className={`rounded-xl px-5 py-2 text-sm font-medium min-h-[44px] transition-colors press-feedback ${
              added
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 cursor-default'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {added ? '✓ In SRS' : '➕ Add to SRS'}
          </button>
        </div>

        {/* Source attribution */}
        {character.source && (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">Content from Tofugu.com</p>
        )}
      </div>
    </div>
  );
}
