import { afterEach, describe, expect, it, vi } from 'vitest';

class MockWorker {
  static instances: MockWorker[] = [];
  onmessage?: (event: { data: unknown }) => void;
  onerror?: (event: { message: string }) => void;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() { MockWorker.instances.push(this); }
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
  MockWorker.instances = [];
});

describe('Japanese tokenizer worker contract', () => {
  it('preserves the Reader token contract while exposing dictionary metadata', async () => {
    vi.stubGlobal('Worker', MockWorker);
    const { tokenizeJapanese } = await import('../lib/tokenizer');
    const result = tokenizeJapanese('食べた');
    const worker = MockWorker.instances[0];
    const request = worker.postMessage.mock.calls[0][0];
    worker.onmessage?.({ data: { id: request.id, tokens: [
      { surface_form: '食べ', reading: 'タベ', basic_form: '食べる', pos: '動詞',
        pos_detail_1: '自立', word_type: 'KNOWN' },
      { surface_form: '未知', reading: '', basic_form: '*', word_type: 'UNKNOWN' },
    ] } });
    expect(await result).toEqual([
      { surface: '食べ', reading: 'たべ', isKanji: true, lemma: '食べる',
        partOfSpeech: '動詞', partOfSpeechDetail: '自立', wordType: 'KNOWN' },
      { surface: '未知', reading: '', isKanji: true, lemma: undefined,
        partOfSpeech: undefined, partOfSpeechDetail: undefined, wordType: 'UNKNOWN' },
    ]);
  });

  it('rejects stalled requests and recovers with a fresh worker', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('Worker', MockWorker);
    const { tokenizeJapanese } = await import('../lib/tokenizer');
    const first = tokenizeJapanese('読む');
    const rejected = expect(first).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(30_000);
    await rejected;
    expect(MockWorker.instances[0].terminate).toHaveBeenCalledOnce();
    const second = tokenizeJapanese('読む');
    const worker = MockWorker.instances[1];
    worker.onmessage?.({ data: { id: worker.postMessage.mock.calls[0][0].id, tokens: [] } });
    expect(await second).toEqual([]);
  });

  it('rejects concurrent requests on worker errors and can retry', async () => {
    vi.stubGlobal('Worker', MockWorker);
    const { tokenizeJapanese } = await import('../lib/tokenizer');
    const first = tokenizeJapanese('読む');
    const second = tokenizeJapanese('書く');
    const failures = Promise.all([
      expect(first).rejects.toThrow('worker failed'), expect(second).rejects.toThrow('worker failed'),
    ]);
    MockWorker.instances[0].onerror?.({ message: 'worker failed' });
    await failures;
    expect(MockWorker.instances[0].terminate).toHaveBeenCalledOnce();
  });
});
