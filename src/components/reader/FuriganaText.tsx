import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { getReaderNavigationIndex, type ReaderSegment } from '../../lib/reader-segments';
import type { WordStatusMap } from '../../lib/word-status';
import { getStatusColor, getStatusLabel } from '../../lib/word-status';
import { applyStress } from '../../lib/russian-stress';
import { isRTL } from '../../lib/rtl';

interface FuriganaTextProps {
  segments: readonly ReaderSegment[];
  selectedWord: string | null;
  onWordClick: (surface: string, reading: string, segmentIndex: number) => void;
  highlightKnown?: boolean;
  knownWords?: Set<string>;
  wordStatusMap?: WordStatusMap;
  statusHighlight?: boolean;
  language?: string;
  showStressMarks?: boolean;
  instructionsId?: string;
}

export default function FuriganaText({
  segments,
  selectedWord,
  onWordClick,
  highlightKnown = false,
  knownWords,
  wordStatusMap,
  statusHighlight = false,
  language,
  showStressMarks = false,
  instructionsId,
}: FuriganaTextProps) {
  const wordIndices = useMemo(() => segments.flatMap((segment, index) => segment.token ? [index] : []), [segments]);
  const [activeIndex, setActiveIndex] = useState(() => wordIndices[0] ?? -1);
  const currentIndex = wordIndices.includes(activeIndex) ? activeIndex : wordIndices[0];
  const wordRefs = useRef(new Map<number, HTMLElement>());

  function handleKeyDown(event: KeyboardEvent<HTMLElement>, index: number) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const next = getReaderNavigationIndex(wordIndices, index, event.key, isRTL(language ?? ''));
    if (next !== null) {
      event.preventDefault();
      event.stopPropagation();
      setActiveIndex(next);
      wordRefs.current.get(next)?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      const token = segments[index].token!;
      onWordClick(token.surface, token.reading, index);
    }
  }

  return (
    <>
      {segments.map((segment, i) => {
        const token = segment.token;
        if (!token) return segment.surface;

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
          'inline-block min-h-[44px] cursor-pointer align-baseline transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-400';
        const selectedClass = isSelected ? 'bg-indigo-200 dark:bg-indigo-800' : '';
        const knownClass = !isSelected && isKnown ? 'bg-green-50 dark:bg-green-900/20' : '';
        const interaction = {
          role: 'button',
          tabIndex: i === currentIndex ? 0 : -1,
          'aria-label': token.surface,
          'aria-haspopup': 'dialog' as const,
          'aria-describedby': instructionsId,
          ref: (element: HTMLElement | null) => {
            if (element) wordRefs.current.set(i, element);
            else wordRefs.current.delete(i);
          },
          onFocus: () => setActiveIndex(i),
          onKeyDown: (event: KeyboardEvent<HTMLElement>) => handleKeyDown(event, i),
          onClick: () => {
            setActiveIndex(i);
            wordRefs.current.get(i)?.focus({ preventScroll: true });
            onWordClick(token.surface, token.reading, i);
          },
        };

        return (
          <button
            key={i}
            type="button"
            {...interaction}
            className={`${baseClass} ${selectedClass} ${knownClass} ${statusClass}`}
            style={{ fontSize: 'var(--app-font-size)' }}
            title={statusTitle}
          >
            {token.isKanji && token.reading ? (
              <ruby>
                {token.surface}
                <rp>(</rp>
                <rt className="text-[0.6em] text-slate-500 dark:text-slate-400">{token.reading}</rt>
                <rp>)</rp>
              </ruby>
            ) : showStressMarks && language === 'ru' ? applyStress(token.surface) : token.surface}
          </button>
        );
      })}
    </>
  );
}
