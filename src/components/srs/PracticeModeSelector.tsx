import type { PracticeMode } from '../../stores/reviewStore';

interface Props {
  onSelect: (mode: PracticeMode) => void;
  retention?: { percent: number; reviewCount: number } | null;
}

const MODES: { mode: PracticeMode; label: string; emoji: string; description: string }[] = [
  { mode: 'word-to-meaning', label: 'Word → Meaning', emoji: '📖', description: 'See the word, recall its meaning' },
  { mode: 'meaning-to-word', label: 'Meaning → Word', emoji: '🔄', description: 'See the meaning, recall the word' },
  { mode: 'random', label: 'Random', emoji: '🎲', description: 'Random direction each card' },
  { mode: 'both', label: 'Study (Both sides)', emoji: '👀', description: 'See everything for review' },
];

export default function PracticeModeSelector({ onSelect, retention }: Props) {
  return (
    <div className="flex flex-col items-center py-6">
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
      {retention && retention.reviewCount >= 10 && (
        <RetentionCard percent={retention.percent} />
      )}
    </div>
  );
}

function RetentionCard({ percent }: { percent: number }) {
  let color: string;
  let emoji: string;
  let message: string;

  if (percent < 75) {
    color = 'bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800/50';
    emoji = '⚠️';
    message = 'Consider slowing down on new cards to catch up';
  } else if (percent < 85) {
    color = 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50';
    emoji = '📉';
    message = 'A bit low — try reviewing more frequently';
  } else if (percent <= 95) {
    color = 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800/50';
    emoji = '✅';
    message = 'Right in the sweet spot!';
  } else {
    color = 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50';
    emoji = '📈';
    message = 'Very high — consider adding more new cards';
  }

  return (
    <div className={`${color} border rounded-xl p-3 mt-4 max-w-sm mx-auto`}>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 text-center">
        Your 7-day retention: {percent}% {emoji}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
        {message}
      </p>
    </div>
  );
}
