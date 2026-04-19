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
      return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
    case 'learning':
      return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
  }
}

export default function CharacterChart({ characters, alphabetName, language, progress }: Props) {
  const groups = [...new Set(characters.map((c) => c.group))];

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group}>
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
                    onClick={() => speak(c.char, language)}
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
    </div>
  );
}
