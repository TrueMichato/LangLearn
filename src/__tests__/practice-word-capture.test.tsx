import 'fake-indexeddb/auto';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/schema';
import PracticeWordCapture from '../components/common/PracticeWordCapture';
import WordLookupSheet from '../components/reader/WordLookupSheet';
import { uniqueCaptureWords, saveCapturedPracticeWord } from '../lib/practice-word-capture';
import { loadKnowledgeSnapshot } from '../db/knowledge';

beforeEach(async () => { await db.words.clear(); await db.reviews.clear(); });
afterEach(async () => { vi.restoreAllMocks(); await db.words.clear(); await db.reviews.clear(); });

describe('shared practice word capture', () => {
  it('deduplicates explicit lemmas and preserves bundled metadata; never proposes nonwords', () => {
    const words = uniqueCaptureWords([
      { word: 'gatos', lemma: 'gato' }, { word: 'gato', meaning: 'cat', reading: 'gato' },
      { word: '123' }, { word: '…' },
    ], 'es');
    expect(words).toEqual([{ word: 'gato', meaning: 'cat', reading: 'gato' }]);
  });

  it('saves bundled/edited metadata offline with dialect, source, context and an initial review', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const result = await saveCapturedPracticeWord('ar', {
      word: 'قهوة', meaning: ' coffee ', reading: 'qahwa', context: 'أحب القهوة', tags: ['dialect:egyptian'],
    }, { source: 'listening', tags: ['practice', 'dialect:egyptian'] });
    expect(result.added).toBe(1);
    const [word] = await db.words.toArray();
    expect(word).toMatchObject({ language: 'ar', word: 'قهوة', reading: 'qahwa', meaning: 'coffee',
      contextSentence: 'أحب القهوة', tags: ['practice', 'dialect:egyptian', 'listening'], type: 'word' });
    expect(await db.reviews.where('wordId').equals(word.id!).count()).toBe(1);
    expect((await loadKnowledgeSnapshot('ar')).getEvidence('قهوة').familiar).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('reports concurrent duplicate saves honestly and isolates languages', async () => {
    const word = { word: 'casa', meaning: 'house' };
    const results = await Promise.all([
      saveCapturedPracticeWord('es', word), saveCapturedPracticeWord('es', word),
    ]);
    expect(results.reduce((sum, result) => sum + result.added, 0)).toBe(1);
    expect(results.reduce((sum, result) => sum + result.alreadySaved, 0)).toBe(1);
    await saveCapturedPracticeWord('pt', word);
    expect(await db.words.count()).toBe(2);
    expect(await db.reviews.count()).toBe(2);
  });

  it('rejects missing meanings instead of inventing translations, and transaction failure can retry', async () => {
    await expect(saveCapturedPracticeWord('es', { word: 'gato' })).rejects.toThrow('meaning');
    const hook = () => { throw new Error('Review write failed'); };
    db.reviews.hook('creating', hook);
    try {
      await expect(saveCapturedPracticeWord('es', { word: 'gato', meaning: 'cat' })).rejects.toThrow('Review write failed');
      expect(await db.words.count()).toBe(0);
    } finally { db.reviews.hook('creating').unsubscribe(hook); }
    expect((await saveCapturedPracticeWord('es', { word: 'gato', meaning: 'cat' })).added).toBe(1);
  });

  it('starts collapsed without exposing a word editor or triggering lookup; empty content is silent', () => {
    const html = renderToStaticMarkup(<PracticeWordCapture language="es" text="gato" />);
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('Save words from this practice');
    expect(html).not.toContain('role="dialog"');
    expect(renderToStaticMarkup(<PracticeWordCapture language="es" />)).toBe('');
  });

  it('reuses an accessible editable sheet with offline meaning, target RTL and standard modal scale', () => {
    const html = renderToStaticMarkup(<WordLookupSheet word="قهوة" language="ar" initialReading="qahwa"
      initialMeaning="coffee" contextSentence="أحب القهوة" onAdd={() => {}} onClose={() => {}} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('value="coffee"');
    expect(html).toContain('Meaning / translation');
    expect(html).toContain('aria-label="Close word editor"');
    expect(html).toContain('z-[60]');
    expect(html).toContain('save offline');
    expect(html).not.toContain('disabled=""');
  });
});
