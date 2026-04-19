import { useState } from 'react';
import type { Character } from '../../data/alphabets';
import type { CharacterProgress } from '../../db/schema';
import { speak } from '../../lib/tts';
import KanjiDetailView from './KanjiDetailView';

interface Props {
  characters: Character[];
  alphabetName: string;
  language: string;
  progress: Map<string, CharacterProgress>;
}

function masteryColor(mastery?: string) {
  switch (mastery) {
    case 'mastered':
      return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
    case 'learning':
      return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
  }
}

const GROUP_INFO: Record<string, string> = {
  'Dakuten': 'Dakuten (゛) voices the consonant: k→g, s→z, t→d, h→b',
  'Handakuten': 'Handakuten (゜) changes h-sounds to p-sounds',
  'Yōon': 'Combining a consonant kana with a small や/ゆ/よ creates blended sounds',
};

function CharacterDetail({ char, language, onClose }: { char: Character; language: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mx-4 mb-4 sm:mb-0 w-full max-w-md max-h-[80vh] overflow-y-auto space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-2xl leading-none"
        >
          ×
        </button>

        <div className="text-center">
          <span className="text-6xl text-slate-900 dark:text-slate-100">{char.char}</span>
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300 mt-1">{char.romanji}</p>
          {char.meaning && <p className="text-sm text-slate-500 dark:text-slate-400">{char.meaning}</p>}
        </div>

        <button
          onClick={() => speak(char.char, language)}
          className="mx-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors press-feedback"
        >
          🔊 Play sound
        </button>

        {char.hint && (
          <p className="text-sm text-indigo-600 dark:text-indigo-400">
            <span className="font-semibold">💡 Hint:</span> {char.hint}
          </p>
        )}

        {char.mnemonic && (
          <p className="text-sm text-slate-700 dark:text-slate-300">📖 {char.mnemonic}</p>
        )}

        {char.radicals && char.radicals.length > 0 && (
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold">📦 Radicals:</span> {char.radicals.join(' + ')}
          </p>
        )}

        {char.onyomi && char.onyomi.length > 0 && (
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold">On&apos;yomi:</span> {char.onyomi.join(', ')}
          </p>
        )}

        {char.kunyomi && char.kunyomi.length > 0 && (
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold">Kun&apos;yomi:</span> {char.kunyomi.join(', ')}
          </p>
        )}

        {char.exampleWords && char.exampleWords.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Example words:</p>
            <ul className="space-y-1">
              {char.exampleWords.map((w) => (
                <li key={w.word} className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{w.word}</span>{' '}
                  <span className="text-slate-500 dark:text-slate-400">({w.reading})</span> — {w.meaning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {char.source && (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic pt-1">Content from Tofugu.com</p>
        )}
      </div>
    </div>
  );
}

export default function CharacterChart({ characters, alphabetName, language, progress }: Props) {
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const groups = [...new Set(characters.map((c) => c.group))];

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group}>
          {GROUP_INFO[group] && (
            <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl p-3 text-sm mb-2">
              ℹ️ {GROUP_INFO[group]}
            </div>
          )}
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{group}</h3>
          <div className="grid grid-cols-5 gap-2">
            {characters
              .filter((c) => c.group === group)
              .map((c) => {
                const id = `${language}/${alphabetName}/${c.char}`;
                const p = progress.get(id);
                return (
                  <button
                    key={c.char}
                    onClick={() => {
                      speak(c.char, language);
                      setSelectedChar(c);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 active:scale-95 hover:scale-105 hover:shadow-md press-feedback ${masteryColor(p?.mastery)}`}
                  >
                    <span className="text-2xl leading-tight text-slate-900 dark:text-slate-100">{c.char}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.romanji}</span>
                    {c.meaning && <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">{c.meaning}</span>}
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700 inline-block" /> New</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-800 inline-block" /> Learning</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-200 dark:bg-emerald-800 inline-block" /> Mastered</span>
      </div>

      {selectedChar && (
        selectedChar.radicals || selectedChar.exampleWords ? (
          <KanjiDetailView character={selectedChar} language={language} onClose={() => setSelectedChar(null)} />
        ) : (
          <CharacterDetail char={selectedChar} language={language} onClose={() => setSelectedChar(null)} />
        )
      )}
    </div>
  );
}
