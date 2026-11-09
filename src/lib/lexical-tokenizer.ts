import { tokenizeJapanese, type Token } from './tokenizer';
import {
  isLexical, normalizeLanguage, segmentSurfaceText,
  type LexicalDocument, type LexicalToken,
} from './lexical';

export function japaneseLexicalDocument(tokens: readonly Token[]): LexicalDocument {
  const lexical: LexicalToken[] = [];
  let boundary = false;
  for (const token of tokens) {
    if (!isLexical(token.surface) || token.partOfSpeech === '記号' ||
      token.partOfSpeechDetail === '数') {
      if (/[^\s]/u.test(token.surface)) boundary = true;
      continue;
    }
    lexical.push(Object.freeze({
      surface: token.surface, lemma: token.lemma, boundaryBefore: boundary,
    }));
    boundary = false;
  }
  return Object.freeze({
    language: 'ja', mode: 'japanese-lemmas', tokens: Object.freeze(lexical),
    limitations: Object.freeze([
      'Dictionary lemmas where available; names and unknown words use surface forms. No inferred synonym or phrase decomposition.',
    ]),
  });
}

// Bound both entry count and retained text size. Cache content, not learner claims.
const documents = new Map<string, { size: number; document: LexicalDocument }>();
const inFlight = new Map<string, Promise<LexicalDocument>>();
let retainedSize = 0;
const MAX_CACHE_SIZE = 500_000;
const MAX_CACHE_ENTRIES = 24;

/** Full-text tokenization, reused when only knowledge changes. Fallbacks are not cached. */
export function tokenizeLexicalText(text: string, language: string): Promise<LexicalDocument> {
  const lang = normalizeLanguage(language);
  const key = `${lang}\0${text}`;
  const cached = documents.get(key);
  if (cached) {
    documents.delete(key);
    documents.set(key, cached);
    return Promise.resolve(cached.document);
  }
  const running = inFlight.get(key);
  if (running) return running;
  const task = (async () => {
    let document: LexicalDocument;
    if (lang === 'ja') {
      try {
        document = japaneseLexicalDocument(await tokenizeJapanese(text.normalize('NFKC')));
      } catch {
        return segmentSurfaceText(text, lang);
      }
    } else {
      document = segmentSurfaceText(text, lang);
    }
    if (text.length <= MAX_CACHE_SIZE) {
      while (documents.size >= MAX_CACHE_ENTRIES || retainedSize + text.length > MAX_CACHE_SIZE) {
        const oldest = documents.keys().next().value;
        if (oldest === undefined) break;
        retainedSize -= documents.get(oldest)!.size;
        documents.delete(oldest);
      }
      documents.set(key, { size: text.length, document });
      retainedSize += text.length;
    }
    return document;
  })();
  inFlight.set(key, task);
  void task.finally(() => inFlight.delete(key));
  return task;
}
