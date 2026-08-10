import { describe, it, expect } from 'vitest';
import {
  captureTags,
  humanizeLessonId,
  lessonIdFromTags,
  looksLikeSentence,
  parseLessonCandidates,
  parseListCandidates,
  parseTableCandidates,
  resolveColumnRoles,
} from '../lib/lesson-capture';

describe('parseListCandidates', () => {
  it('captures a Japanese word with an inline reading', () => {
    const [candidate] = parseListCandidates('- **大きい(おおきい)** — big');
    expect(candidate).toMatchObject({ word: '大きい', reading: 'おおきい', meaning: 'big' });
  });

  it('captures a sentence with a separate reading', () => {
    const [candidate] = parseListCandidates(
      '- **Cafeaua este bună.** (kah-FEAH-wah) — The coffee is good.',
    );
    expect(candidate).toMatchObject({
      word: 'Cafeaua este bună.',
      reading: 'kah-FEAH-wah',
      meaning: 'The coffee is good.',
      isSentence: true,
    });
  });

  it('never puts the meaning in the context sentence', () => {
    // Flashcard renders contextSentence on the question side, so a dictionary
    // line here would print the answer under the prompt.
    const [candidate] = parseListCandidates('- **猫(ねこ)** — cat');
    expect(candidate.contextSentence).toBe('');
  });

  it('ignores bullets that are English explanation', () => {
    expect(
      parseListCandidates('- **Hard-stem adjectives (новый) are the most common** — learn this first'),
    ).toEqual([]);
  });

  it('ignores bullets that do not start with bold', () => {
    expect(parseListCandidates('- Other adjectives: red, blue (синий) — colours')).toEqual([]);
  });

  it('skips the sources section', () => {
    const md = ['## Sources', '', '- **Tae Kim** — grammar guide'].join('\n');
    expect(parseListCandidates(md)).toEqual([]);
  });
});

describe('resolveColumnRoles', () => {
  it('returns null for a paradigm table with no meaning column', () => {
    expect(resolveColumnRoles(['Case', 'Masculine', 'Feminine', 'Neuter'])).toBeNull();
  });

  it('prefers a named language column over the first column', () => {
    expect(resolveColumnRoles(['Pattern', 'Arabic', 'Translation'])).toMatchObject({
      target: 1,
      meaning: 2,
    });
  });

  it('maps reading and example columns', () => {
    expect(resolveColumnRoles(['Adverb', 'Pronunciation', 'Meaning', 'Example'])).toEqual({
      target: 0,
      reading: 1,
      meaning: 2,
      example: 3,
    });
  });
});

describe('parseTableCandidates', () => {
  const arabicTable = [
    '| Pattern | Arabic | Translation |',
    '|---|---|---|',
    '| no doubt | **لَا شَكَّ** (lā shakka) | there is no doubt |',
  ].join('\n');

  it('captures the target column of a table with a meaning column', () => {
    const [candidate] = parseTableCandidates(arabicTable);
    expect(candidate).toMatchObject({
      word: 'لَا شَكَّ',
      reading: 'lā shakka',
      meaning: 'there is no doubt',
      source: 'table',
    });
  });

  it('skips paradigm tables entirely', () => {
    const declension = [
      '| Case | Masculine | Feminine |',
      '|---|---|---|',
      '| Nominative | нов**ый** | нов**ая** |',
    ].join('\n');
    expect(parseTableCandidates(declension)).toEqual([]);
  });

  it('prefers a gloss carried by the cell over the row meaning', () => {
    const md = [
      '| Verb | Active participle | Meaning clue |',
      '|---|---|---|',
      '| **كَتَبَ** (kataba) — he wrote | **كَاتِبٌ** (kātibun) | the one who writes |',
    ].join('\n');
    const [candidate] = parseTableCandidates(md);
    expect(candidate.meaning).toBe('he wrote');
  });

  it('uses an example column as the context sentence', () => {
    const md = [
      '| Base | Meaning | Example |',
      '|---|---|---|',
      '| 静か | quiet | 静かになる |',
    ].join('\n');
    const [candidate] = parseTableCandidates(md);
    expect(candidate.contextSentence).toBe('静かになる');
  });

  it('drops rows whose term is a grammatical label', () => {
    const md = [
      '| Form | Meaning |',
      '|---|---|',
      '| masculine singular | good boy |',
    ].join('\n');
    expect(parseTableCandidates(md)).toEqual([]);
  });

  it('treats an English aside as an annotation, not a reading', () => {
    const md = [
      '| Long form | Meaning |',
      '|---|---|',
      '| рад (only short) | glad |',
    ].join('\n');
    const [candidate] = parseTableCandidates(md);
    expect(candidate).toMatchObject({ word: 'рад', reading: '' });
  });
});

describe('parseLessonCandidates', () => {
  it('merges list and table sources without duplicates', () => {
    const md = [
      '- **猫(ねこ)** — cat',
      '',
      '| Word | Meaning |',
      '|---|---|',
      '| **猫**(ねこ) | cat |',
      '| **犬**(いぬ) | dog |',
    ].join('\n');
    expect(parseLessonCandidates(md).map((c) => c.word)).toEqual(['猫', '犬']);
  });

  it('ignores content inside html comments', () => {
    const md = '<!-- grammar-card: {"rule":"r","example":"- **x** — y"} -->';
    expect(parseLessonCandidates(md)).toEqual([]);
  });
});

describe('looksLikeSentence', () => {
  it('recognises terminal punctuation and long phrases', () => {
    expect(looksLikeSentence('私は学生です。')).toBe(true);
    expect(looksLikeSentence('Eu gosto muito de música')).toBe(true);
  });

  it('treats short phrases as words', () => {
    expect(looksLikeSentence('băiat bun')).toBe(false);
    expect(looksLikeSentence('猫')).toBe(false);
  });
});

describe('provenance', () => {
  it('always tags the originating lesson', () => {
    expect(captureTags('particles-wa-ga', false)).toEqual(['grammar', 'lesson:particles-wa-ga']);
    expect(captureTags('particles-wa-ga', true)).toContain('sentence');
  });

  it('reads the lesson back off a saved word', () => {
    expect(lessonIdFromTags(['grammar', 'lesson:ser-estar'])).toBe('ser-estar');
    expect(lessonIdFromTags(['grammar'])).toBeNull();
    expect(lessonIdFromTags(undefined)).toBeNull();
  });

  it('renders a lesson id readably', () => {
    expect(humanizeLessonId('particles-wa-ga')).toBe('Particles wa ga');
  });
});
