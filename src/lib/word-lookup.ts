import { db } from '../db/schema';
import { getLyricsByLanguage } from '../data/lyrics';
import { lexicalForms, normalizeLexeme } from './lexical';
import type { DictionaryResult } from './dictionary';

export interface LocalWordDetails {
  reading: string;
  meaning: string;
  source: 'saved' | 'bundled';
}

/** Exact surfaces/explicit aliases, then a verified lemma; no online requests or inferred stems. */
export async function findLocalWordDetails(
  word: string, language: string, lemma?: string,
): Promise<LocalWordDetails | null> {
  const keys = [...new Set([word, ...(lemma ? [lemma] : [])]
    .map((value) => normalizeLexeme(value, language)))];
  const matches = (value: string, key: string) => lexicalForms(value, language).includes(key);
  let savedUnavailable = false;
  try {
    const saved = (await db.words.where('language').equals(language).toArray())
      .filter((entry) => (!entry.type || entry.type === 'word') && entry.meaning.trim());
    for (const key of keys) {
      const entry = saved.find((candidate) => matches(candidate.word, key));
      if (entry) return { reading: entry.reading, meaning: entry.meaning, source: 'saved' };
    }
  } catch {
    savedUnavailable = true;
  }
  const bundled = getLyricsByLanguage(language).flatMap((song) => song.vocab);
  for (const key of keys) {
    const entry = bundled.find((candidate) => candidate.meaning.trim() && matches(candidate.word, key));
    if (entry) return { reading: entry.reading, meaning: entry.meaning, source: 'bundled' };
  }
  if (savedUnavailable) throw new Error('Saved meanings unavailable');
  return null;
}

export interface WordLookupDraft {
  word: string;
  reading: string;
  meaning: string;
  context: string;
}

export interface WordLookupState extends WordLookupDraft {
  revision: number;
  request: number;
  loading: boolean;
  error: string;
  localStatus: 'loading' | 'ready' | 'error';
  source?: 'saved' | 'bundled' | 'online';
}

export function createWordLookupState(draft: WordLookupDraft): WordLookupState {
  return { ...draft, revision: 0, request: 0, loading: false, error: '',
    localStatus: draft.meaning ? 'ready' : 'loading' };
}

type LookupAction =
  | { type: 'edit'; field: keyof WordLookupDraft; value: string }
  | { type: 'local'; revision: number; details: LocalWordDetails | null }
  | { type: 'local-loading' }
  | { type: 'local-error' }
  | { type: 'lookup'; request: number }
  | { type: 'result'; request: number; revision: number; result: DictionaryResult | null }
  | { type: 'error'; request: number; revision: number; message: string }
  | { type: 'cancel' };

/** Late local/online responses cannot replace a learner's edits or a newer request. */
export function wordLookupReducer(state: WordLookupState, action: LookupAction): WordLookupState {
  switch (action.type) {
    case 'edit':
      return { ...state, [action.field]: action.value, revision: state.revision + 1,
        loading: false, error: '', source: undefined };
    case 'cancel':
      return { ...state, revision: state.revision + 1, loading: false };
    case 'local':
      return action.revision !== state.revision || !action.details
        ? { ...state, localStatus: 'ready' }
        : { ...state, localStatus: 'ready', reading: state.reading || action.details.reading,
          meaning: state.meaning || action.details.meaning, source: state.source ?? action.details.source };
    case 'local-error':
      return { ...state, localStatus: 'error' };
    case 'local-loading':
      return { ...state, localStatus: 'loading' };
    case 'lookup':
      return { ...state, request: action.request, loading: true, error: '' };
    case 'error':
    case 'result':
      if (action.request !== state.request || action.revision !== state.revision) return state;
      if (action.type === 'error') return { ...state, loading: false, error: action.message };
      return action.result?.meanings.some((meaning) => meaning.trim())
        ? { ...state, loading: false, reading: action.result.reading || state.reading,
          meaning: action.result.meanings.filter((meaning) => meaning.trim()).join('; '), source: 'online' }
        : { ...state, loading: false,
          error: 'No online meaning found. You can enter a meaning yourself or retry.' };
  }
}
