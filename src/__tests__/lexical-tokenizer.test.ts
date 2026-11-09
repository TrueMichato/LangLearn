import { describe, expect, it, vi } from 'vitest';
import { tokenizeJapanese } from '../lib/tokenizer';
import { tokenizeLexicalText } from '../lib/lexical-tokenizer';

vi.mock('../lib/tokenizer', () => ({ tokenizeJapanese: vi.fn() }));

describe('shared lexical tokenization cache', () => {
  it('reuses full Japanese lemma tokenization across analyses', async () => {
    vi.mocked(tokenizeJapanese).mockResolvedValueOnce([
      { surface: '読んだ', lemma: '読む', reading: '', isKanji: true },
    ]);
    const a = await tokenizeLexicalText('読んだ', 'ja');
    const b = await tokenizeLexicalText('読んだ', 'JA');
    expect(a).toBe(b);
    expect(a.tokens[0].lemma).toBe('読む');
    expect(vi.mocked(tokenizeJapanese)).toHaveBeenCalledTimes(1);
  });

  it('labels tokenizer failure as approximate and allows a later successful retry', async () => {
    vi.mocked(tokenizeJapanese).mockRejectedValueOnce(new Error('dictionary unavailable'));
    const fallback = await tokenizeLexicalText('食べる', 'ja');
    expect(fallback.mode).toBe('japanese-fallback');
    expect(fallback.limitations.join()).toContain('approximate');
    vi.mocked(tokenizeJapanese).mockResolvedValueOnce([
      { surface: '食べる', lemma: '食べる', reading: '', isKanji: true },
    ]);
    expect((await tokenizeLexicalText('食べる', 'ja')).mode).toBe('japanese-lemmas');
  });

  it('keeps language caches isolated and never drops the end of long text', async () => {
    const text = `${'gato '.repeat(4000)}pez`;
    const spanish = await tokenizeLexicalText(text, 'es');
    const portuguese = await tokenizeLexicalText(text, 'pt');
    expect(spanish.tokens).toHaveLength(4001);
    expect(spanish.tokens.at(-1)?.surface).toBe('pez');
    expect(spanish).not.toBe(portuguese);
    expect(spanish.language).toBe('es');
    expect(portuguese.language).toBe('pt');
  });

  it('normalizes compatibility characters before dictionary tokenization', async () => {
    vi.mocked(tokenizeJapanese).mockResolvedValueOnce([
      { surface: 'ガラス', lemma: 'ガラス', reading: '', isKanji: false },
    ]);
    await tokenizeLexicalText('ｶﾞﾗｽ', 'ja');
    expect(vi.mocked(tokenizeJapanese)).toHaveBeenLastCalledWith('ガラス');
  });
});
