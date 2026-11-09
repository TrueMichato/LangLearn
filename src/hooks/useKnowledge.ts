import { useEffect, useState } from 'react';
import { observeKnowledgeSnapshot } from '../db/knowledge';
import type { KnowledgeSnapshot } from '../lib/knowledge';
import { normalizeLanguage } from '../lib/lexical';

export type KnowledgeLoadState =
  | { status: 'loading'; language: string; snapshot: null; error: null }
  | { status: 'ready'; language: string; snapshot: KnowledgeSnapshot; error: null }
  | { status: 'error'; language: string; snapshot: null; error: unknown };

/** Pass the current app language; retain the resulting snapshot at attempt start. */
export function useKnowledge(language: string): KnowledgeLoadState {
  const lang = normalizeLanguage(language);
  const [state, setState] = useState<KnowledgeLoadState>({
    status: 'loading', language: lang, snapshot: null, error: null,
  });
  useEffect(() => {
    let active = true;
    const unsubscribe = observeKnowledgeSnapshot(lang,
      (snapshot) => { if (active) setState({ status: 'ready', language: lang, snapshot, error: null }); },
      (error: unknown) => { if (active) setState({ status: 'error', language: lang, snapshot: null, error }); });
    return () => { active = false; unsubscribe(); };
  }, [lang]);
  // Do not expose the previous language's evidence for even one render.
  return state.language === lang ? state
    : { status: 'loading', language: lang, snapshot: null, error: null };
}
