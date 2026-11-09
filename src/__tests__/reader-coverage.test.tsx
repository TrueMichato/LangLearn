import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CoverageSummary from '../components/reader/CoverageSummary';
import { analyzeReaderText, loadReaderStory, scheduleReaderAnalysis } from '../lib/reader-coverage';
import { buildKnowledgeSnapshot } from '../lib/knowledge';
import { segmentSurfaceText } from '../lib/lexical';
import { analyzeLexicalCoverage } from '../lib/lexical-coverage';

afterEach(() => vi.unstubAllGlobals());
const snapshot = buildKnowledgeSnapshot({
  language: 'es',
  words: [{ id: 1, language: 'es', word: 'gato', reading: '', meaning: 'cat',
    contextSentence: '', sourceTextId: null, tags: [], type: 'word', createdAt: '' }],
  reviews: [{ id: 1, wordId: 1, ease: 2.5, interval: 21, repetitions: 4, nextReviewDate: '', lastReviewDate: '' }],
});

describe('Reader full-text coverage', () => {
  it('uses the same full text and snapshot for list and reader; repetition changes occurrences only', async () => {
    const list = await analyzeReaderText('gato gato perro', snapshot);
    const reader = await analyzeReaderText('gato gato perro', snapshot);
    expect(list).toEqual(reader);
    expect(list.occurrences.familiarPercentage).toBeCloseTo(200 / 3);
    expect(list.distinct.familiarPercentage).toBe(50);
    const repeated = await analyzeReaderText('gato gato gato perro', snapshot);
    expect(repeated.occurrences.familiarPercentage).toBe(75);
    expect(repeated.distinct).toEqual(list.distinct);
  });

  it('does not inflate coverage from saving, but re-analyzes against reviewed or taught evidence', async () => {
    const words = [{ id: 1, language: 'es', word: 'gato', reading: '', meaning: 'cat',
      contextSentence: '', sourceTextId: null, tags: [], type: 'word' as const, createdAt: '' }];
    const saved = buildKnowledgeSnapshot({ language: 'es', words });
    expect((await analyzeReaderText('gato', saved)).occurrences.familiarPercentage).toBe(0);
    expect((await analyzeReaderText('gato', snapshot)).occurrences.familiarPercentage).toBe(100);
    const taught = buildKnowledgeSnapshot({ language: 'es', lessonTargets: { es: { pets: ['gato'] } },
      lessons: [{ id: 'es/vocab/pets', language: 'es', lessonId: 'vocab/pets', completed: true, quizScore: 100, attempts: 1, completedAt: '' }] });
    expect((await analyzeReaderText('gato', taught)).occurrences.familiarPercentage).toBe(100);
    expect((await analyzeReaderText('gato', taught)).occurrences.reviewBackedPercentage).toBe(0);
  });

  it('names occurrence/distinct denominators and explains reviewed words are included, not added', async () => {
    const coverage = await analyzeReaderText('gato gato perro', snapshot);
    const html = renderToStaticMarkup(<CoverageSummary state={{ status: 'ready', coverage }} />);
    expect(html).toContain('Word occurrences: 67% familiar');
    expect(html).toContain('Distinct vocabulary: 50% familiar');
    expect(html).toContain('2/3 familiar, including 2/3 (67%) review-backed');
    expect(html).toContain('1/2 familiar, including 1/2 (50%) review-backed');
    expect(html).toContain('subset of familiar');
    expect(html).toContain('not a guarantee of comprehension');
    expect(html).toContain('Surface-form matching only');
  });

  it('distinguishes empty text, pending analysis, failure and approximate Japanese segmentation', async () => {
    const empty = await analyzeReaderText('123 …', snapshot);
    const emptyHtml = renderToStaticMarkup(<CoverageSummary state={{ status: 'ready', coverage: empty }} />);
    expect(emptyHtml).toContain('No lexical words');
    expect(emptyHtml).not.toContain('100%');
    for (const status of ['loading', 'error', 'idle'] as const) {
      const html = renderToStaticMarkup(<CoverageSummary state={{ status }} onRetry={() => {}} />);
      expect(html).not.toContain('0%');
      if (status === 'error') expect(html).toContain('Retry estimate');
    }
    const approximate = analyzeLexicalCoverage(segmentSurfaceText('猫です', 'ja'), buildKnowledgeSnapshot({ language: 'ja' }));
    expect(renderToStaticMarkup(<CoverageSummary state={{ status: 'ready', coverage: approximate }} />))
      .toContain('Approximate vocabulary coverage');
  });

  it('coalesces full-story fetches and reuses them on opening; missing assets can retry', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, text: async () => 'gato gato perro' });
    vi.stubGlobal('fetch', fetcher);
    expect(await Promise.all([loadReaderStory('shared-fixture', 'es'), loadReaderStory('shared-fixture', 'es')]))
      .toEqual(['gato gato perro', 'gato gato perro']);
    await loadReaderStory('shared-fixture', 'es');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toContain('content/reading/es/shared-fixture.txt');
    fetcher.mockResolvedValueOnce({ ok: false });
    await expect(loadReaderStory('retry-fixture', 'es')).rejects.toThrow('Story unavailable');
    expect(await loadReaderStory('retry-fixture', 'es')).toBe('gato gato perro');
  });

  it('bounds concurrent library analysis to two jobs', async () => {
    let active = 0, peak = 0;
    const release: Array<() => void> = [];
    const jobs = Array.from({ length: 5 }, () => scheduleReaderAnalysis(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise<void>((resolve) => release.push(resolve));
      active--;
    }));
    expect(release).toHaveLength(2);
    while (release.length || active) {
      release.splice(0).forEach((resolve) => resolve());
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    await Promise.all(jobs);
    expect(peak).toBe(2);
  });
});
