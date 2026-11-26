import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FuriganaText from '../components/reader/FuriganaText';
import { buildKnowledgeSnapshot } from '../lib/knowledge';
import { analyzeReaderText } from '../lib/reader-coverage';
import { loadReaderSegments, segmentReaderText, type ReaderSegment } from '../lib/reader-segments';
import { findSentenceAt, splitSentences } from '../lib/sentences';
import { tokenizeJapanese, type Token } from '../lib/tokenizer';
import ReadingPurpose from '../components/reader/ReadingPurpose';

const arabicStories = import.meta.glob<string>(
  '../../public/content/reading/ar/self-intro-ar.txt',
  { query: '?raw', import: 'default', eager: true },
);

vi.mock('../lib/tokenizer', () => ({ tokenizeJapanese: vi.fn() }));
beforeEach(() => vi.mocked(tokenizeJapanese).mockReset());

function renderSegments(segments: ReaderSegment[], language: string, showStressMarks = false) {
  return renderToStaticMarkup(
    <FuriganaText
      segments={segments}
      language={language}
      showStressMarks={showStressMarks}
      selectedWord={null}
      onWordClick={() => {}}
    />,
  );
}

function surfaceText(html: string) {
  return html.replace(/<(rt|rp)\b[^>]*>[\s\S]*?<\/\1>/gu, '')
    .replace(/<[^>]*>/gu, '')
    .replace(/&quot;/gu, '"').replace(/&#x27;/gu, "'")
    .replace(/&lt;/gu, '<').replace(/&gt;/gu, '>').replace(/&amp;/gu, '&');
}

function expectSource(source: string, segments: ReaderSegment[], language: string) {
  expect(segments.map((segment) => segment.surface).join('')).toBe(source);
  expect(surfaceText(renderSegments(segments, language))).toBe(source);
  let end = 0;
  for (const segment of segments) {
    expect(segment.start).toBe(end);
    expect(source.slice(segment.start, segment.end)).toBe(segment.surface);
    end = segment.end;
  }
  expect(end).toBe(source.length);
}

describe('Reader source fidelity', () => {
  it.each(['main-idea', 'close-study'] as const)('keeps source text and lookup intact while offering %s guidance and a saved paragraph', (purpose) => {
    const source = '🐈 ¡Hola!\n\n  Otro párrafo.';
    const segments = segmentReaderText(source, 'es');
    const guidance = renderToStaticMarkup(<ReadingPurpose purpose={purpose} onChange={() => {}} />);
    expect(guidance).toContain('Word lookup and saving are always available');
    expect(guidance).toContain('Highlighting is optional');
    expect(guidance).toContain(purpose === 'main-idea' ? 'Follow the meaning first' : 'Take a short passage slowly');
    const html = renderToStaticMarkup(<FuriganaText segments={segments} selectedWord={null} language="es"
      highlightKnown={purpose === 'close-study'} knownWords={new Set(['hola'])} onWordClick={() => {}}
      resumePosition={{ offset: source.indexOf('Otro'), revision: 1 }} onPositionChange={() => {}} />);
    expect(surfaceText(html)).toBe(source);
    expect(html).toContain(`data-reader-paragraph="${source.indexOf('Otro')}"`);
    expect(html.match(/aria-haspopup="dialog"/gu)).toHaveLength(3);
  });
  it.each([
    ['es', '  ¡Hola,  mundo!\n\n¿Café\t o té? <sí> & "no".\r\n'],
    ['ar', 'أُحِبُّ  القراءة،\n\nوَأَتَعَلَّمُ\tكُلَّ يومٍ؟\r\n'],
    ['ru', '  Молоко,  собака!\n\nмолоко\u0301\tи чай.\n'],
    ['es', '🐈 gato.  日本語、sin  perder espacios.\n'],
    ['es', ' \t… 123،!?\n\n'],
  ])('retains raw separators, punctuation and Unicode for %s', async (language, source) => {
    const segments = await loadReaderSegments(source, language);
    expectSource(source, segments, language);
    expect(tokenizeJapanese).not.toHaveBeenCalled();
    expect(segments.filter((segment) => segment.token)
      .every((segment) => /\p{L}/u.test(segment.surface))).toBe(true);
    const html = renderSegments(segments, language);
    expect(html.match(/class=/gu)?.length ?? 0)
      .toBe(segments.filter((segment) => segment.token).length);
  });

  it('reconstructs the shipped Arabic story rather than joining its words', async () => {
    const source = arabicStories['../../public/content/reading/ar/self-intro-ar.txt'];
    expect(source.match(/\s/gu)!.length).toBeGreaterThan(20);
    expectSource(source, await loadReaderSegments(source, 'ar'), 'ar');
  });

  it('preserves Japanese dictionary readings while restoring omitted source gaps', async () => {
    const source = '🐈 猫。  猫、犬！\n\n  終わり。\r\n';
    const tokens: Token[] = [
      { surface: '🐈', reading: '', isKanji: false, partOfSpeech: '記号' },
      { surface: '猫', reading: 'ねこ', isKanji: true },
      { surface: '。', reading: '', isKanji: false, partOfSpeech: '記号' },
      { surface: '猫', reading: 'ねこ', isKanji: true },
      { surface: '、', reading: '', isKanji: false, partOfSpeech: '記号' },
      { surface: '犬', reading: 'いぬ', isKanji: true },
      { surface: '！', reading: '', isKanji: false, partOfSpeech: '記号' },
      { surface: '終わり', reading: 'おわり', isKanji: true },
      { surface: '。', reading: '', isKanji: false, partOfSpeech: '記号' },
    ];
    vi.mocked(tokenizeJapanese).mockResolvedValueOnce(tokens);
    const segments = await loadReaderSegments(source, 'ja');
    expectSource(source, segments, 'ja');
    expect(renderSegments(segments, 'ja')).toContain('>ねこ</rt>');
    expect(segments.filter((segment) => segment.token).map((segment) => segment.surface))
      .toEqual(['猫', '猫', '犬', '終わり']);
    const lastWord = segments.find((segment) => segment.surface === '終わり')!;
    expect(lastWord.start).toBe(source.indexOf('終わり'));
    expect(findSentenceAt(splitSentences(source), lastWord.start)).toBe('終わり。');
  });

  it('keeps Japanese fallback and mismatched dictionary output source-exact without guessed spaces', async () => {
    const source = 'ｶﾞﾗｽ・猫と犬。\r\n\n  東京\tカフェ！🐈';
    vi.mocked(tokenizeJapanese).mockRejectedValueOnce(new Error('dictionary unavailable'));
    const fallback = await loadReaderSegments(source, 'ja');
    expectSource(source, fallback, 'ja');
    expect(renderSegments(fallback, 'ja')).not.toContain('<ruby');
    expectSource(source, segmentReaderText(source, 'ja', [
      { surface: 'ガラス', reading: 'がらす', isKanji: false },
    ]), 'ja');
  });

  it('uses original UTF-16 offsets for repeated-word context after emoji and paragraph gaps', async () => {
    const source = '🐈 gato.\n\n  gato,\tperro!';
    const segments = await loadReaderSegments(source, 'es');
    const cats = segments.filter((segment) => segment.token?.surface === 'gato');
    expect(cats.map((segment) => segment.start)).toEqual([
      source.indexOf('gato'), source.lastIndexOf('gato'),
    ]);
    expect(findSentenceAt(splitSentences(source), cats[0].start)).toBe('🐈 gato.');
    expect(findSentenceAt(splitSentences(source), cats[1].start)).toBe('gato,\tperro!');
  });

  it('applies optional Russian stress only to display, never to source offsets or context', async () => {
    const source = 'молоко.\n\n  собака!';
    const segments = await loadReaderSegments(source, 'ru');
    expectSource(source, segments, 'ru');
    expect(surfaceText(renderSegments(segments, 'ru', true)))
      .toBe('молоко\u0301.\n\n  соба\u0301ка!');
    const dog = segments.find((segment) => segment.token?.surface === 'собака')!;
    expect(dog.start).toBe(source.indexOf('собака'));
    expect(findSentenceAt(splitSentences(source), dog.start)).toBe('собака!');
  });

  it('leaves vocabulary coverage denominators and evidence independent of presentation', async () => {
    const source = '¡gato,  gato!\n\nperro… 123';
    const snapshot = buildKnowledgeSnapshot({ language: 'es' });
    const before = await analyzeReaderText(source, snapshot);
    const segments = await loadReaderSegments(source, 'es');
    const after = await analyzeReaderText(surfaceText(renderSegments(segments, 'es')), snapshot);
    expect(after).toEqual(before);
    expect(after.occurrences.total).toBe(3);
    expect(after.distinct.total).toBe(2);
    expect(after.occurrences.familiarPercentage).toBe(0);
    expect(segments.filter((segment) => segment.token)).toHaveLength(3);
  });
});
