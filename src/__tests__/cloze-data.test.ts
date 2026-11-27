import { describe, expect, it } from 'vitest';
import { arClozeSentences, esClozeSentences, jaClozeSentences, ptClozeSentences, roClozeSentences, ruClozeSentences } from '../data/cloze';
import { findClozeSpan } from '../lib/cloze-match';

const SETS = { ja: jaClozeSentences, ru: ruClozeSentences, pt: ptClozeSentences, es: esClozeSentences, ar: arClozeSentences, ro: roClozeSentences };

describe('cloze data', () => {
  it.each(Object.entries(SETS))('every %s item has a blankable word in its sentence', (language, items) => {
    const failures = items.filter((item) => !findClozeSpan(item.target, item.blankedWord, language))
      .map((item) => `${item.id}: ${item.blankedWord} | ${item.target}`);
    expect(failures).toEqual([]);
  });
});
