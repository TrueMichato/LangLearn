import { useCallback, useEffect, useRef, useState } from 'react';
import { loadKnowledgeSnapshot } from '../db/knowledge';
import { tokenizeLexicalText } from '../lib/lexical-tokenizer';
import { normalizeLanguage } from '../lib/lexical';
import {
  selectPracticeItems,
  type PracticeCandidate,
  type PracticeSelection,
  type PracticeSelectionOptions,
} from '../lib/practice-selector';

export type AdaptiveCandidate = PracticeCandidate & { readonly text?: string };
export type AdaptivePracticeOptions = Omit<PracticeSelectionOptions, 'language'>;

/** Call only at attempt start. Live knowledge/save updates never reroll an attempt. */
export function useAdaptivePractice<T>(language: string) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [selection, setSelection] = useState<PracticeSelection | null>(null);
  const [error, setError] = useState('');
  const [attemptLanguage, setAttemptLanguage] = useState(language);
  const generation = useRef(0);
  const activeLanguage = useRef(language);

  const reset = useCallback(() => {
    generation.current += 1;
    setStatus('idle');
    setSelection(null);
    setError('');
  }, []);

  useEffect(() => {
    activeLanguage.current = language;
    return () => { generation.current += 1; };
  }, [language]);

  const start = useCallback(async (
    items: readonly T[],
    options: AdaptivePracticeOptions,
    describe: (item: T, index: number) => AdaptiveCandidate,
  ): Promise<T[] | null> => {
    const request = ++generation.current;
    setAttemptLanguage(language);
    setStatus('loading');
    setError('');
    setSelection(null);
    try {
      const snapshot = await loadKnowledgeSnapshot(language);
      if (request !== generation.current || activeLanguage.current !== language) return null;
      const described = items.map((item, index) => ({ item, candidate: describe(item, index) }))
        .filter(({ candidate }) => normalizeLanguage(candidate.language) === normalizeLanguage(language));
      const metadata = described.map(({ candidate }) => candidate);
      const candidates = await Promise.all(metadata.map(async ({ text, ...candidate }) => ({
        ...candidate,
        document: text != null
          ? await tokenizeLexicalText(text, language) : candidate.document,
      })));
      const result = selectPracticeItems(candidates, snapshot, { ...options, language });
      if (request !== generation.current || activeLanguage.current !== language) return null;
      setSelection(result);
      if (!result.meetsMinimum) {
        setStatus('error');
        setError('Not enough items match these filters. Choose another available filter or return to your learning path.');
        return null;
      }
      const byId = new Map(described.map(({ candidate, item }) => [candidate.id, item]));
      setStatus('ready');
      return result.itemIds.map((id) => byId.get(id)!);
    } catch {
      if (request !== generation.current || activeLanguage.current !== language) return null;
      setStatus('error');
      setError('Practice matching could not load. Your filters are unchanged; try starting again.');
      return null;
    }
  }, [language]);

  return {
    status: attemptLanguage === language ? status : 'idle' as const,
    selection: attemptLanguage === language ? selection : null,
    error: attemptLanguage === language ? error : '',
    start, reset,
  };
}
