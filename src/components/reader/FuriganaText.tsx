import type { Token } from '../../lib/tokenizer';
import type { WordStatusMap } from '../../lib/word-status';
import { getStatusColor, getStatusLabel } from '../../lib/word-status';

interface FuriganaTextProps {
  tokens: Token[];
  selectedWord: string | null;
  onWordClick: (surface: string, reading: string, tokenIndex: number) => void;
  highlightKnown?: boolean;
  knownWords?: Set<string>;
  wordStatusMap?: WordStatusMap;
  statusHighlight?: boolean;
}

export default function FuriganaText({
  tokens,
  selectedWord,
  onWordClick,
  highlightKnown = false,
  knownWords,
  wordStatusMap,
  statusHighlight = false,
}: FuriganaTextProps) {
  return (
    <>
      {tokens.map((token, i) => {
        const isSelected = selectedWord === token.surface;

        // Status-based highlighting (new system) takes priority over legacy knownWords
        const status = wordStatusMap?.getStatus(token.surface);
        const useStatusHighlight = statusHighlight && wordStatusMap && token.surface.trim();
        const statusClass = useStatusHighlight && !isSelected
          ? getStatusColor(status!)
          : '';
        const statusTitle = useStatusHighlight ? getStatusLabel(status!) : undefined;

        // Legacy highlight (backward compat)
        const isKnown = !useStatusHighlight && highlightKnown && knownWords?.has(token.surface.toLowerCase());

        const baseClass =
          'cursor-pointer transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded px-0.5';
        const selectedClass = isSelected ? 'bg-indigo-200 dark:bg-indigo-800' : '';
        const knownClass = !isSelected && isKnown ? 'bg-green-50 dark:bg-green-900/20' : '';

        if (token.isKanji && token.reading) {
          return (
            <ruby
              key={i}
              onClick={() => onWordClick(token.surface, token.reading, i)}
              className={`${baseClass} ${selectedClass} ${knownClass} ${statusClass}`}
              style={{ fontSize: 'var(--app-font-size)' }}
              title={statusTitle}
            >
              {token.surface}
              <rp>(</rp>
              <rt className="text-[0.6em] text-slate-400 dark:text-slate-500">{token.reading}</rt>
              <rp>)</rp>
            </ruby>
          );
        }

        if (!token.surface.trim()) {
          return <span key={i}>{token.surface}</span>;
        }

        return (
          <span
            key={i}
            onClick={() => onWordClick(token.surface, token.reading, i)}
            className={`${baseClass} ${selectedClass} ${knownClass} ${statusClass}`}
            style={{ fontSize: 'var(--app-font-size)' }}
            title={statusTitle}
          >
            {token.surface}
          </span>
        );
      })}
    </>
  );
}
