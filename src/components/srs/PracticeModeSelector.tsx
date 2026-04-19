import type { PracticeMode } from '../../stores/reviewStore';

interface Props {
  onSelect: (mode: PracticeMode) => void;
}

const MODES: { mode: PracticeMode; label: string; emoji: string; description: string }[] = [
  { mode: 'word-to-meaning', label: 'Word → Meaning', emoji: '📖', description: 'See the word, recall its meaning' },
  { mode: 'meaning-to-word', label: 'Meaning → Word', emoji: '🔄', description: 'See the meaning, recall the word' },
  { mode: 'random', label: 'Random', emoji: '🎲', description: 'Random direction each card' },
  { mode: 'both', label: 'Study (Both sides)', emoji: '👀', description: 'See everything for review' },
];

export default function PracticeModeSelector({ onSelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
        How do you want to practice?
      </h2>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
        Choose which side of the card to show first
      </p>
      <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
        {MODES.map(({ mode, label, emoji, description }) => (
          <button
            key={mode}
            onClick={() => onSelect(mode)}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors text-left"
          >
            <span className="text-2xl">{emoji}</span>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-100">{label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
