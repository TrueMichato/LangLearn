import 'fake-indexeddb/auto';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FuriganaText from '../components/reader/FuriganaText';
import WordLookupSheet from '../components/reader/WordLookupSheet';
import { db } from '../db/schema';
import { getLyricsByLanguage } from '../data/lyrics';
import { getReaderNavigationIndex, segmentReaderText } from '../lib/reader-segments';
import { createWordLookupState, findLocalWordDetails, wordLookupReducer } from '../lib/word-lookup';

beforeEach(async () => { await db.words.clear(); });
afterEach(async () => { vi.restoreAllMocks(); await db.words.clear(); });

describe('Reader lexical keyboard selection', () => {
  it('has a single tab stop, including with ruby, and leaves separators untargetable', () => {
    const segments = segmentReaderText(' 猫、 犬。\n\n', 'ja', [
      { surface: '猫', reading: 'ねこ', isKanji: true },
      { surface: '、', reading: '', isKanji: false, partOfSpeech: '記号' },
      { surface: '犬', reading: 'いぬ', isKanji: true },
      { surface: '。', reading: '', isKanji: false, partOfSpeech: '記号' },
    ]);
    const html = renderToStaticMarkup(<FuriganaText segments={segments} selectedWord={null}
      onWordClick={() => {}} instructionsId="reader-keys" language="ja" />);
    expect(html.match(/tabindex="0"/gu)).toHaveLength(1);
    expect(html.match(/tabindex="-1"/gu)).toHaveLength(1);
    expect(html.match(/role="button"/gu)).toHaveLength(2);
    expect(html.match(/aria-haspopup="dialog"/gu)).toHaveLength(2);
    expect(html).toContain('aria-describedby="reader-keys"');
    expect(html).toContain('focus-visible:outline');
    expect(html).not.toContain('aria-label="、"');
  });

  it('moves only among lexical spans, clamps at either end, and reverses arrows for RTL', () => {
    const segments = segmentReaderText('  كلمة،\n\n  ثانية!  ثالثة؟', 'ar');
    const indices = segments.flatMap((segment, index) => segment.token ? [index] : []);
    expect(indices).toHaveLength(3);
    expect(getReaderNavigationIndex(indices, indices[0], 'ArrowRight')).toBe(indices[1]);
    expect(getReaderNavigationIndex(indices, indices[0], 'ArrowLeft')).toBe(indices[0]);
    expect(getReaderNavigationIndex(indices, indices[2], 'ArrowRight')).toBe(indices[2]);
    expect(getReaderNavigationIndex(indices, indices[0], 'ArrowLeft', true)).toBe(indices[1]);
    expect(getReaderNavigationIndex(indices, indices[1], 'ArrowRight', true)).toBe(indices[0]);
    for (const key of ['Tab', 'a', 'ArrowUp']) {
      expect(getReaderNavigationIndex(indices, indices[0], key)).toBeNull();
    }
    expect(getReaderNavigationIndex([], -1, 'ArrowRight')).toBeNull();
  });
});

describe('local-first word details', () => {
  it('prefers saved meanings over bundled metadata without network access or knowledge writes', async () => {
    const bundled = getLyricsByLanguage('es')[0].vocab[0];
    const fetcher = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    await db.words.add({ language: 'es', ...bundled, meaning: 'my saved meaning', contextSentence: '',
      sourceTextId: null, tags: [], type: 'word', createdAt: '' });
    expect(await findLocalWordDetails(bundled.word, 'es')).toMatchObject({
      meaning: 'my saved meaning', source: 'saved',
    });
    await db.words.clear();
    expect(await findLocalWordDetails(bundled.word, 'es')).toMatchObject({
      meaning: bundled.meaning, source: 'bundled',
    });
    expect(fetcher).not.toHaveBeenCalled();
    expect(await db.words.count()).toBe(0);
  });

  it('uses only explicit aliases/verified lemmas and keeps languages and nonlexical cards separate', async () => {
    await db.words.bulkAdd([
      { language: 'ja', word: '読む', reading: 'よむ', meaning: 'to read', contextSentence: '',
        sourceTextId: null, tags: [], type: 'word', createdAt: '' },
      { language: 'es', word: 'solo-lector', reading: '', meaning: 'grammar rule', contextSentence: '',
        sourceTextId: null, tags: [], type: 'grammar', createdAt: '' },
      { language: 'es', word: 'casa / hogar', reading: '', meaning: 'home', contextSentence: '',
        sourceTextId: null, tags: [], type: 'word', createdAt: '' },
    ]);
    expect(await findLocalWordDetails('読んだ', 'ja', '読む')).toMatchObject({ meaning: 'to read' });
    expect(await findLocalWordDetails('読んだ', 'ja')).toBeNull();
    expect(await findLocalWordDetails('solo-lector', 'es')).toBeNull();
    expect(await findLocalWordDetails('読む', 'es')).toBeNull();
    expect(await findLocalWordDetails('hogar', 'es')).toMatchObject({ meaning: 'home', source: 'saved' });
  });

  it('shows meaning before deliberate edit/save, with named modal semantics and no automatic save', () => {
    const onAdd = vi.fn();
    const html = renderToStaticMarkup(<WordLookupSheet word="قهوة" language="ar" initialReading="qahwa"
      initialMeaning="coffee" contextSentence="أحب القهوة" onAdd={onAdd} onClose={() => {}} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('Word details:');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('aria-expanded="false"');
    expect(html.indexOf('coffee')).toBeLessThan(html.indexOf('Edit and save to vocabulary'));
    expect(html).toContain('Look up online');
    expect(html).toContain('Nothing is saved automatically');
    expect(html).not.toContain('<input');
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('reopens retained edits for a source word instead of resetting to its original metadata', () => {
    const html = renderToStaticMarkup(<WordLookupSheet word="gato" language="es"
      initialMeaning="cat" contextSentence="Original context."
      initialDraft={{ word: 'gatito', reading: 'my reading', meaning: 'my saved draft', context: 'My context.' }}
      onAdd={() => {}} onClose={() => {}} />);
    expect(html).toContain('gatito');
    expect(html).toContain('my reading');
    expect(html).toContain('my saved draft');
    expect(html).not.toContain('>cat<');
  });
});

describe('editable lookup response boundaries', () => {
  const draft = { word: 'gato', reading: 'gato', meaning: 'my meaning', context: '🐈 gato.\n\n' };
  const result = { word: 'gato', reading: 'different reading', meanings: ['online meaning'] };

  it.each(['word', 'reading', 'meaning', 'context'] as const)(
    'does not let a pending online/local lookup overwrite an edited %s', (field) => {
      const initial = createWordLookupState(draft);
      const pending = wordLookupReducer(initial, { type: 'lookup', request: 1 });
      const edited = wordLookupReducer(pending, { type: 'edit', field, value: 'my edit' });
      expect(wordLookupReducer(edited, { type: 'result', request: 1, revision: 0, result })).toEqual(edited);
      expect(wordLookupReducer(edited, { type: 'local', revision: 0,
        details: { reading: 'local reading', meaning: 'local meaning', source: 'saved' } }))
        .toMatchObject({ ...draft, [field]: 'my edit' });
    },
  );

  it('ignores older requests and responses after saving, but accepts a new explicit retry', () => {
    const initial = createWordLookupState(draft);
    const pending = wordLookupReducer(initial, { type: 'lookup', request: 2 });
    expect(wordLookupReducer(pending, { type: 'result', request: 1, revision: 0, result })).toBe(pending);
    const saving = wordLookupReducer(pending, { type: 'cancel' });
    expect(wordLookupReducer(saving, { type: 'result', request: 2, revision: 0, result })).toBe(saving);
    const retry = wordLookupReducer(saving, { type: 'lookup', request: 3 });
    expect(wordLookupReducer(retry, { type: 'result', request: 3, revision: retry.revision, result }))
      .toMatchObject({ meaning: 'online meaning', reading: 'different reading', context: draft.context, loading: false });
  });

  it('retains the complete draft on no result, offline failure and local read failure', () => {
    const initial = createWordLookupState(draft);
    const pending = wordLookupReducer(initial, { type: 'lookup', request: 1 });
    const empty = wordLookupReducer(pending, { type: 'result', request: 1, revision: 0, result: null });
    expect(empty).toMatchObject({ ...draft, loading: false });
    expect(empty.error).toContain('No online meaning found');
    const failed = wordLookupReducer(pending, { type: 'error', request: 1, revision: 0, message: 'offline' });
    expect(failed).toMatchObject({ ...draft, loading: false, error: 'offline' });
    expect(wordLookupReducer(initial, { type: 'local-error' })).toMatchObject({ ...draft, localStatus: 'error' });
    const nextSelection = createWordLookupState({ ...draft, word: 'perro', meaning: '' });
    expect(wordLookupReducer(nextSelection, { type: 'result', request: 1, revision: 0, result }))
      .toEqual(nextSelection);
  });
});
