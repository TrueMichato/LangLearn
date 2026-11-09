import { useEffect, useState } from 'react';
import { useKnowledge } from './useKnowledge';
import { tokenizeLexicalText } from '../lib/lexical-tokenizer';
import { selectPracticeItems, type PracticeSelection } from '../lib/practice-selector';

export interface LexicalRecommendationItem {
  id: string;
  language: string;
  text: string;
  difficulty: string;
}

/** Reactive browsing guidance only; never use this to replace an active choice. */
export function useLexicalRecommendations(language: string, items: readonly LexicalRecommendationItem[]) {
  const knowledge = useKnowledge(language);
  const [result, setResult] = useState<{ revision: string; items: readonly LexicalRecommendationItem[]; selection: PracticeSelection } | null>(null);
  const [failedItems, setFailedItems] = useState<readonly LexicalRecommendationItem[] | null>(null);
  useEffect(() => {
    let active = true;
    if (knowledge.status !== 'ready' || !items.length) return;
    const snapshot = knowledge.snapshot;
    void (async () => {
      const candidates = [];
      // Avoid starting a tokenizer job for every song at once.
      for (let i = 0; i < items.length; i += 4) {
        const batch = await Promise.all(items.slice(i, i + 4).map(async (item, index) => ({
          ...item, order: i + index, document: await tokenizeLexicalText(item.text, language),
        })));
        if (!active) return;
        candidates.push(...batch);
      }
      const selection = selectPracticeItems(candidates, snapshot, {
        language, seed: `browse:${language}`,
        session: { minItems: 1, targetItems: items.length, maxItems: items.length },
      });
      if (active) setResult({ revision: snapshot.revision, items, selection });
    })().catch(() => { if (active) setFailedItems(items); });
    return () => { active = false; };
  }, [knowledge, language, items]);
  const selection = knowledge.status === 'ready' && result?.revision === knowledge.snapshot.revision &&
    result.items === items ? result.selection : null;
  return {
    status: knowledge.status === 'error' || failedItems === items ? 'error'
      : !items.length || selection ? 'ready' : 'loading',
    selection,
  } as const;
}
