import type { Character } from '../../data/alphabets';
import type { CharacterProgress } from '../../db/schema';
import { speak } from '../../lib/tts';

interface Props {
  characters: Character[];
  alphabetName: string;
  language: string;
  progress: Map<string, CharacterProgress>;
}

function masteryColor(mastery?: string) {
  switch (mastery) {
    case 'mastered':
      return 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700';
    case 'learning':
      return 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-700';
    default:
      return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  }
}

export default function CharacterChart({ characters, alphabetName, language, progress }: Props) {
  const groups = [...new Set(characters.map((c) => c.group))];

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group}>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{group}</h3>
          <div className="grid grid-cols-5 gap-2">
            {characters
              .filter((c) => c.group === group)
              .map((c) => {
                const id = `${language}/${alphabetName}/${c.char}`;
                const p = progress.get(id);
                return (
                  <button
                    key={c.char}
                    onClick={() => speak(c.char, language)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-colors active:scale-95 ${masteryColor(p?.mastery)}`}
                  >
                    <span className="text-2xl leading-tight">{c.char}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.romanji}</span>
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-2">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700 inline-block" /> New</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-200 dark:bg-yellow-800 inline-block" /> Learning</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 dark:bg-green-800 inline-block" /> Mastered</span>
      </div>
    </div>
  );
}
