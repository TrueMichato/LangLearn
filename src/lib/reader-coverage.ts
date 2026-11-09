import { tokenizeLexicalText } from './lexical-tokenizer';
import { analyzeLexicalCoverage } from './lexical-coverage';
import type { KnowledgeSnapshot } from './knowledge';

// All story cards share two workers; offscreen cards do not enqueue work.
const waiting: Array<() => void> = [];
let active = 0;
export function scheduleReaderAnalysis<T>(work: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      active++;
      void work().then(resolve, reject).finally(() => {
        active--;
        waiting.shift()?.();
      });
    };
    if (active < 2) run();
    else waiting.push(run);
  });
}

const stories = new Map<string, string>();
const pending = new Map<string, Promise<string>>();
/** A bounded full-text cache shared by the library and open Reader. */
export function loadReaderStory(id: string, language: string): Promise<string> {
  const key = `${language}/${id}`;
  if (stories.has(key)) return Promise.resolve(stories.get(key)!);
  if (pending.has(key)) return pending.get(key)!;
  const request = fetch(`${import.meta.env.BASE_URL}content/reading/${language}/${id}.txt`)
    .then(async (response) => {
      if (!response.ok) throw new Error('Story unavailable');
      const text = await response.text();
      if (text.length <= 100_000) {
        while (stories.size >= 12) stories.delete(stories.keys().next().value!);
        stories.set(key, text);
      }
      return text;
    }).finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}

export async function analyzeReaderText(text: string, snapshot: KnowledgeSnapshot) {
  return analyzeLexicalCoverage(await tokenizeLexicalText(text, snapshot.language), snapshot);
}
