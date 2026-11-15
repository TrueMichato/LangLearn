import { describe, expect, it } from 'vitest';
import actualLesson from '../../public/content/grammar/ja/taekim-verb-classification.md?raw';
import ordinalLesson from '../../public/content/grammar/ro/ordinals-fractions.md?raw';
import derivationLesson from '../../public/content/grammar/ro/word-formation.md?raw';
import futureSubjunctiveLesson from '../../public/content/grammar/pt/futuro-subjuntivo.md?raw';
import baselineJson from './fixtures/grammar-retention-legacy.json';
import { fillBlank } from '../lib/grammar-cards';
import { parseLessonReviewItems, stripLessonReviewSources } from '../lib/lesson-capture';
import { readLessonReviewBlocks } from '../lib/lesson-review';
import {
  grammarItem,
  clozeAnswerRepeatsFrame,
  lessonHeadings,
  parseRetentionInventory,
  quizFingerprint,
  scopeRetentionCatalog,
  validateLegacyLesson,
  validateRetentionCatalog,
  validateRetentionLesson,
  validateReviewItemQuality,
  type LegacyLesson,
  type LessonInventory,
  type RetentionCatalog,
} from './helpers/grammar-retention';

// Keep real prose, headings, quizzes, and three real pilot blocks. The catalog's
// human-authored JSON inventories remain independent of this mutation harness.
const INVENTORY: LessonInventory = {
  lessonId: 'taekim-verb-classification',
  teachingPoints: [
    {
      id: 'ichidan-polite', kind: 'rule', format: 'cloze', priority: 'essential',
      sourceSection: 'る-Verbs (Ichidan / One-Row Verbs)',
      objective: 'Apply the drop-る operation before adding the polite ending to an ichidan verb.',
      prompt: '毎日(まいにち)朝(あさ)ごはんを食(た)べ___。', answer: 'ます',
    },
    {
      id: 'classification-heuristic', kind: 'concept', format: 'qa', priority: 'essential',
      sourceSection: 'How to Tell Them Apart',
      objective: 'Treat /i/ or /e/ before る as a clue rather than a guarantee of ichidan membership.',
      prompt: 'After setting aside する and 来る, does an /i/ or /e/ sound before る guarantee an ichidan verb?',
      answer: 'No. It suggests ichidan, but godan exceptions such as 帰る (かえる) and 走る (はしる) must be learned with their verb type.',
    },
    {
      id: 'vocab-nomu', kind: 'vocabulary', priority: 'essential',
      sourceSection: 'う-Verbs (Godan / Five-Row Verbs)',
      objective: 'Recall 飲む with its reading のむ and the meaning to drink.',
      word: '飲む', reading: 'のむ', meaning: 'to drink',
    },
  ],
  exclusions: [{ sourceSection: 'Sources', reason: 'Reference links, not instructional material.' }],
};

function actualBlock(markdown: string, id: string): string {
  const block = readLessonReviewBlocks(markdown).items.find(({ value }) => value.id === id);
  if (!block) throw new Error(`Missing actual metadata block "${id}"`);
  const start = markdown.split('\n').slice(0, block.line - 1).join('\n').length + (block.line > 1 ? 1 : 0);
  const end = markdown.indexOf('-->', start);
  if (end < 0) throw new Error(`Unterminated actual metadata block "${id}"`);
  return markdown.slice(start, end + 3);
}

const SELECTED_IDS = INVENTORY.teachingPoints.map((point) => point.id);
const VOCABULARY_INVENTORY = '<!-- vocab-inventory: {"mode":"explicit"} -->';
const SOURCE = [
  VOCABULARY_INVENTORY,
  stripLessonReviewSources(actualLesson),
  ...SELECTED_IDS.map((id) => actualBlock(actualLesson, id)),
].join('\n');
const originalBaseline = baselineJson.lessons['ja/taekim-verb-classification'];
const BASELINE: LegacyLesson = {
  ...originalBaseline,
  grammarPairs: originalBaseline.grammarPairs.filter((pair) =>
    'authoredId' in pair && SELECTED_IDS.includes(pair.authoredId)),
  authoredIds: SELECTED_IDS,
};

function changeBlock(markdown: string, id: string, patch: Record<string, unknown> | null): string {
  const { block, value } = readLessonReviewBlocks(markdown).items.find(({ value }) => value.id === id)!;
  const replacement = patch === null ? '' : `<!-- ${block}: ${JSON.stringify({ ...value, ...patch })} -->`;
  return markdown.replace(actualBlock(markdown, id), replacement);
}

function changedInventory(id: string, patch: Record<string, unknown>): LessonInventory {
  return {
    ...INVENTORY,
    teachingPoints: INVENTORY.teachingPoints.map((point) => point.id === id ? { ...point, ...patch } : point),
  } as LessonInventory;
}

function catalog(): RetentionCatalog {
  return {
    indexes: { ja: JSON.stringify([{ id: INVENTORY.lessonId }]) },
    lessons: { [`ja/${INVENTORY.lessonId}`]: SOURCE },
    inventories: { 'ja-pilot.json': JSON.stringify({ language: 'ja', lessons: [INVENTORY] }) },
    baseline: {
      baselineCommit: baselineJson.baselineCommit,
      lessons: { [`ja/${INVENTORY.lessonId}`]: BASELINE },
    },
  };
}

describe('semantic grammar retention validator using real Japanese pilot blocks', () => {
  it('accepts the real pilot units and its fixed legacy/quiz baseline', () => {
    expect(validateRetentionLesson(SOURCE, INVENTORY, BASELINE)).toEqual([]);
    expect(validateLegacyLesson(SOURCE, BASELINE)).toEqual([]);
    expect(validateRetentionCatalog(catalog(), ['ja'])).toEqual([]);
  });

  it('keeps canonical vocabulary limited to the reviewed authored targets', () => {
    const vocabulary = parseLessonReviewItems(SOURCE).items.filter((item) => item.kind === 'vocabulary');
    expect(vocabulary).toMatchObject([{ id: 'vocab-nomu', provenance: 'authored', word: '飲む' }]);
    expect(vocabulary.some((item) => item.provenance === 'formatting')).toBe(false);
  });

  it('rejects dropping the opt-in from real inventoried prose even when all authored IDs survive', () => {
    const unmarked = SOURCE.replace(VOCABULARY_INVENTORY, '');
    expect(parseLessonReviewItems(unmarked).items).toContainEqual(expect.objectContaining({
      word: '食べる', provenance: 'formatting', source: 'table',
    }));
    expect(validateRetentionLesson(unmarked, INVENTORY, BASELINE).join('\n'))
      .toContain('reviewed lesson must declare exactly one valid <!-- vocab-inventory: {"mode":"explicit"} -->');
    const mutated = catalog();
    mutated.lessons[`ja/${INVENTORY.lessonId}`] = unmarked;
    expect(validateRetentionCatalog(mutated, ['ja']).join('\n'))
      .toContain(`ja/${INVENTORY.lessonId}: reviewed lesson must declare exactly one valid`);
  });

  it.each([
    ['duplicated inventory', `${SOURCE}\n${VOCABULARY_INVENTORY}`],
    ['unsupported inventory mode', SOURCE.replace(VOCABULARY_INVENTORY, '<!-- vocab-inventory: {"mode":"legacy"} -->')],
    ['malformed inventory JSON', SOURCE.replace(VOCABULARY_INVENTORY, '<!-- vocab-inventory: {bad JSON} -->')],
    ['valid inventory followed by a broken declaration', `${SOURCE}\n<!-- vocab-inventory: {bad JSON} -->`],
    ['fenced inventory example', `${SOURCE.replace(VOCABULARY_INVENTORY, '')}\n~~~md\n${VOCABULARY_INVENTORY}\n~~~`],
  ])('rejects %s as the reviewed-lesson opt-in', (_name, markdown) => {
    expect(validateRetentionLesson(markdown, INVENTORY, BASELINE).join('\n'))
      .toContain('reviewed lesson must declare exactly one valid');
  });

  it.each([
    ['named concept removed', 'classification-heuristic', null, 'missing authored teaching point "classification-heuristic"'],
    ['kind changed', 'classification-heuristic', { kind: 'rule' }, 'classification-heuristic: kind changed'],
    ['answer corrupted', 'classification-heuristic', { answer: 'Yes, this guarantees ichidan membership.' }, 'classification-heuristic: answer changed'],
    ['priority changed', 'ichidan-polite', { priority: 'optional' }, 'ichidan-polite: priority changed'],
    ['prompt changed', 'ichidan-polite', { example: '食べる → ___。' }, 'ichidan-polite: prompt changed'],
    ['reading corrupted', 'vocab-nomu', { reading: 'およぐ' }, 'vocab-nomu: reading changed'],
    ['meaning corrupted', 'vocab-nomu', { meaning: 'to swim' }, 'vocab-nomu: meaning changed'],
    ['section mistyped', 'vocab-nomu', { sourceSection: 'Nonexistent section' }, 'does not match a real heading'],
  ] as const)('rejects mutation: %s', (_name, id, patch, message) => {
    const mutated = changeBlock(SOURCE, id, patch);
    expect(mutated).not.toBe(SOURCE);
    expect(validateRetentionLesson(mutated, INVENTORY, BASELINE).join('\n')).toContain(message);
  });

  it('rejects malformed JSON at an actual named block instead of accepting a dropped unit', () => {
    const mutated = SOURCE.replace(actualBlock(SOURCE, 'classification-heuristic'), '<!-- grammar-card: {"id": -->');
    const errors = validateRetentionLesson(mutated, INVENTORY, BASELINE);
    expect(errors.join('\n')).toContain('invalid-json');
    expect(errors.join('\n')).toContain('missing authored teaching point "classification-heuristic"');
  });

  it('rejects duplicate IDs across vocabulary and grammar blocks', () => {
    const mutated = changeBlock(SOURCE, 'vocab-nomu', { id: 'ichidan-polite' });
    expect(validateRetentionLesson(mutated, INVENTORY, BASELINE).join('\n')).toContain('duplicate-id');
  });

  it('rejects a newly authored unit omitted from the reviewed contract', () => {
    const extra = actualBlock(SOURCE, 'ichidan-polite').replace('"ichidan-polite"', '"unreviewed-new-point"');
    expect(validateRetentionLesson(`${SOURCE}\n${extra}`, INVENTORY, BASELINE).join('\n'))
      .toContain('authored point "unreviewed-new-point" is missing from the reviewed inventory');
  });

  it('checks optional explanation and context fields when the inventory specifies them', () => {
    const current = grammarItem(parseLessonReviewItems(SOURCE).items, 'ichidan-polite');
    const withExplanation = changedInventory('ichidan-polite', { explanation: current.explanation });
    expect(validateRetentionLesson(SOURCE, withExplanation, BASELINE)).toEqual([]);
    expect(validateRetentionLesson(changeBlock(SOURCE, 'ichidan-polite', { explanation: 'A different explanation.' }),
      withExplanation, BASELINE).join('\n')).toContain('ichidan-polite: explanation changed');
    expect(validateRetentionLesson(SOURCE,
      changedInventory('vocab-nomu', { contextSentence: '水を飲む。' }), BASELINE).join('\n'))
      .toContain('vocab-nomu: contextSentence changed');
  });

  it('rejects a fabricated heading even if the inventory and metadata agree', () => {
    const patch = { sourceSection: 'Invented teaching section' };
    expect(validateRetentionLesson(changeBlock(SOURCE, 'ichidan-polite', patch),
      changedInventory('ichidan-polite', patch), BASELINE).join('\n')).toContain('does not match a real heading');
  });

  it('does not treat a heading in fenced code as a real teaching section', () => {
    expect(lessonHeadings('# Real\n```\n## Fake\n```\n## **Real section**'))
      .toEqual(['Real', 'Real section', '**Real section**']);
  });

  it('accepts the exact source spelling of a real heading with inline emphasis', () => {
    const sourceSection = 'How to **Tell** Them Apart';
    const formatted = SOURCE.replace('## How to Tell Them Apart', `## ${sourceSection}`);
    expect(validateRetentionLesson(changeBlock(formatted, 'classification-heuristic', { sourceSection }),
      changedInventory('classification-heuristic', { sourceSection }), BASELINE)).toEqual([]);
  });

  it('does not admit new shorthand but can pin an established pilot shorthand to its original item', () => {
    const patch = { sourceSection: 'One-Row Verbs' };
    const mutated = changeBlock(SOURCE, 'ichidan-polite', patch);
    const inventory = changedInventory('ichidan-polite', patch);
    expect(validateRetentionLesson(mutated, inventory, BASELINE).join('\n')).toContain('does not match a real heading');
    const established = {
      ...BASELINE,
      sourceSectionAliases: [{
        id: 'ichidan-polite', sourceSection: patch.sourceSection,
        heading: 'る-Verbs (Ichidan / One-Row Verbs)',
      }],
    };
    expect(validateRetentionLesson(mutated, inventory, established)).toEqual([]);
  });

  it('rejects corrupt whole-sentence cloze reconstruction even if its answer contract is also changed', () => {
    const answer = '毎日(まいにち)朝(あさ)ごはんを食(た)べます。';
    const mutated = changeBlock(SOURCE, 'ichidan-polite', { answer });
    expect(validateRetentionLesson(mutated, changedInventory('ichidan-polite', { answer }), BASELINE).join('\n'))
      .toContain('answer repeats the complete cloze frame');
  });

  it('rejects an answer leaked on the front even if the prompt contract is also changed', () => {
    const item = grammarItem(parseLessonReviewItems(SOURCE).items, 'classification-heuristic');
    const prompt = `${item.prompt} Answer: ${item.answer}`;
    expect(validateRetentionLesson(changeBlock(SOURCE, item.id, { example: prompt }),
      changedInventory(item.id, { prompt }), BASELINE).join('\n')).toContain('answer is already visible on the front');
  });

  it('rejects lexical glosses used as front-side context', () => {
    const mutated = changeBlock(SOURCE, 'vocab-nomu', { contextSentence: '飲む — to drink' });
    expect(validateRetentionLesson(mutated, INVENTORY, BASELINE).join('\n')).toContain('context leaks its meaning');
  });

  it('rejects a bare-answer hint even for a short Japanese suffix', () => {
    expect(validateRetentionLesson(changeBlock(SOURCE, 'ichidan-polite', { hint: 'ます' }),
    INVENTORY, BASELINE).join('\n')).toContain('answer is already visible on the front');
  });
});

describe('exact legacy identity and assessment mutation protection', () => {
  it('rejects a lost legacy pair even when the authored ID survives', () => {
    const mutated = changeBlock(SOURCE, 'ichidan-polite', { rule: 'A wording repair without its old identity' });
    expect(validateLegacyLesson(mutated, BASELINE).join('\n')).toContain('lost legacy identity for "ichidan-polite"');
  });

  it('allows an exact alias for a repaired item, then fails when the alias is removed or approximated', () => {
    const old = BASELINE.grammarPairs.find((pair) => pair.authoredId === 'ichidan-polite')!;
    const { rule, example } = old;
    const repaired = changeBlock(SOURCE, 'ichidan-polite', {
      rule: 'Ichidan polite forms replace final る with ます', legacyAliases: [{ rule, example }],
    });
    expect(validateLegacyLesson(repaired, BASELINE)).toEqual([]);
    expect(validateLegacyLesson(changeBlock(repaired, 'ichidan-polite', { legacyAliases: [] }),
      BASELINE).join('\n')).toContain('lost legacy identity');
    expect(validateLegacyLesson(changeBlock(repaired, 'ichidan-polite', {
      legacyAliases: [{ rule: `${rule} `, example }],
    }), BASELINE).join('\n')).toContain('lost legacy identity');
  });

  it('rejects one old pair assigned to two distinct authored IDs', () => {
    const old = BASELINE.grammarPairs.find((pair) => pair.authoredId === 'ichidan-polite')!;
    const mutated = changeBlock(SOURCE, 'classification-heuristic', {
      legacyAliases: [{ rule: old.rule, example: old.example }],
    });
    expect(validateLegacyLesson(mutated, BASELINE).join('\n')).toContain('ambiguous legacy identity');
  });

  it('rejects removal/renaming of an existing authored ID', () => {
    const mutated = changeBlock(SOURCE, 'vocab-nomu', { id: 'vocab-drink-renamed' });
    expect(validateLegacyLesson(mutated, BASELINE).join('\n')).toContain('lost existing authored ID "vocab-nomu"');
  });

  it('protects quiz order and scoring without snapshotting prose or JSON key order', () => {
    const mutated = SOURCE.replace('"answer":1}', '"answer":0}');
    expect(mutated).not.toBe(SOURCE);
    expect(validateLegacyLesson(mutated, BASELINE).join('\n')).toContain('quiz sequence/scoring changed');
    const quizzes = [...SOURCE.matchAll(/<!--\s*quiz:([\s\S]*?)\s*-->/g)].map((match) => match[0]);
    const reordered = SOURCE.replace(quizzes[0], '<!-- held quiz -->')
      .replace(quizzes[1], quizzes[0]).replace('<!-- held quiz -->', quizzes[1]);
    expect(validateLegacyLesson(reordered, BASELINE).join('\n')).toContain('quiz sequence/scoring changed');
    expect(quizFingerprint(SOURCE.replace('Before you can conjugate', 'Before practicing')))
      .toEqual(quizFingerprint(SOURCE));
    expect(quizFingerprint('<!-- quiz: {"question":"Q","answer":1} -->'))
      .toEqual(quizFingerprint('<!-- quiz: { "answer": 1, "question": "Q" } -->'));
  });
});

describe('exact cloze frames instead of stem-frequency heuristics', () => {
  const ordinalItems = parseLessonReviewItems(ordinalLesson).items;
  const derivationItems = parseLessonReviewItems(derivationLesson).items;

  it.each(['fifth-feminine', 'sixth-feminine', 'eighth-feminine', 'tenth-feminine'])(
    'accepts the real Romanian %s answer after the short feminine frame a ___',
    (id) => {
      const item = { ...grammarItem(ordinalItems, id), prompt: 'a ___', format: 'cloze' as const };
      expect(fillBlank(item.prompt, item.answer)).toBe(`a ${item.answer}`);
      expect(validateReviewItemQuality(item)).toEqual([]);
    },
  );

  it.each([
    ['negative-sigur', 'sigur → ___'],
    ['related-adjective', 'student → ___'],
  ])('accepts the real derived word %s despite overlap with its source stem', (id, prompt) => {
    const item = { ...grammarItem(derivationItems, id), prompt, format: 'cloze' as const };
    expect(validateReviewItemQuality(item)).toEqual([]);
    expect(clozeAnswerRepeatsFrame(prompt, item.answer)).toBe(false);
  });

  it('accepts a real Portuguese form identical to its parenthesized infinitive cue', () => {
    const item = {
      ...grammarItem(parseLessonReviewItems(futureSubjunctiveLesson).items, 'future-subjunctive-assim-que'),
      prompt: 'Assim que ela ___, começamos. (chegar; future event)',
    };
    expect(validateReviewItemQuality(item)).toEqual([]);
  });

  it.each([
    ['私＿＿学生です。', '私は学生です。'],
    ['Eu ___ fui ao Japão. (never)', 'Eu nunca fui ao Japão.'],
    ['Ela dança ___. (well)', 'Ela dança bem.'],
  ])('rejects a whole filled sentence used as the missing span: %s', (prompt, answer) => {
    const item = { ...grammarItem(parseLessonReviewItems(SOURCE).items, 'ichidan-polite'), prompt, answer };
    expect(clozeAnswerRepeatsFrame(prompt, answer)).toBe(true);
    expect(validateReviewItemQuality(item).join('\n')).toContain('answer repeats the complete cloze frame');
  });
});

describe('multi-blank cloze frame integrity', () => {
  const parsedItem = (prompt: string, answer: string) => {
    const parsed = parseLessonReviewItems(`<!-- grammar-card: ${JSON.stringify({
      id: 'multiple-spans', kind: 'rule', format: 'cloze', priority: 'essential',
      sourceSection: 'Practice', rule: 'Supply only the missing words in each sentence frame.',
      example: prompt, answer, explanation: 'The fixed sentence context is already supplied by the prompt.',
    })} -->`);
    expect(parsed.diagnostics).toEqual([]);
    return grammarItem(parsed.items, 'multiple-spans');
  };

  it('rejects the canonical whole-sentence answer that corrupts both blanks', () => {
    const item = parsedItem('Yo ___ a ___.', 'Yo voy a casa.');
    expect(fillBlank(item.prompt, item.answer)).toBe('Yo Yo voy a casa. a Yo voy a casa..');
    expect(clozeAnswerRepeatsFrame(item.prompt, item.answer)).toBe(true);
    expect(validateReviewItemQuality(item).join('\n')).toContain('answer repeats the complete cloze frame');
  });

  it.each([
    ['Yo ___ a ___. (go; home)', 'Yo voy a casa.'],
    ['___ a ___.', 'voy a casa.'],
  ])('rejects an exact filled multi-blank frame with a hint or an open beginning: %s', (prompt, answer) => {
    const item = parsedItem(prompt, answer);
    expect(clozeAnswerRepeatsFrame(prompt, answer)).toBe(true);
    expect(validateReviewItemQuality(item).join('\n')).toContain('answer repeats the complete cloze frame');
  });

  it.each([
    ['Yo ___ a ___.', 'voy, casa', 'Yo voy a casa.'],
    ['Yo ___ a ___.', 'voy casa', 'Yo voy a casa.'],
    ['A música ___ ___ por Tom Jobim.', 'foi composta', 'A música foi composta por Tom Jobim.'],
    ['___ ele ___ (ser) rico, é humilde.', 'Embora ... seja', 'Embora ele seja (ser) rico, é humilde.'],
    ['Eu ___ nadar. Eu ___ a Maria.', 'sei (saber), conheço (conhecer)',
      'Eu sei (saber) nadar. Eu conheço (conhecer) a Maria.'],
    ['___ ___', 'foi composta', 'foi composta'],
    ['___ (___)', 'جَالِسَةٌ (jālisatun)', 'جَالِسَةٌ (jālisatun)'],
    ['عَلِمْتُ ___ ___ (ʿalimtu ___ ___).', 'الْخَبَرَ صَحِيحًا (al-khabara ṣaḥīḥan)',
      'عَلِمْتُ الْخَبَرَ صَحِيحًا (ʿalimtu al-khabara ṣaḥīḥan).'],
  ])('accepts a distributable multi-span or mirrored answer: %s', (prompt, answer, reveal) => {
    const item = parsedItem(prompt, answer);
    expect(fillBlank(prompt, answer)).toBe(reveal);
    expect(clozeAnswerRepeatsFrame(prompt, answer)).toBe(false);
    expect(validateReviewItemQuality(item)).toEqual([]);
  });
});

describe('cloze reconstruction script boundaries', () => {
  const arabicItem = (prompt: string, answer: string) => grammarItem(parseLessonReviewItems(
    `<!-- grammar-card: ${JSON.stringify({
      id: 'mirrored-ending', kind: 'rule', format: 'cloze', priority: 'essential',
      sourceSection: 'Usage notes', rule: 'Match the taught Arabic ending and its transliteration.',
      example: prompt, answer, explanation: 'The Arabic and romanized stems need endings in their own scripts.',
    })} -->`,
  ).items, 'mirrored-ending');

  it.each([
    ['sound feminine plural', 'Complete “female teachers”: مُعَلِّم___ (muʿallim___).', 'َاتٌ', 'ātun'],
    ['oblique dual', 'Complete “with two students”: مَعَ طَالِب___ (maʿa ṭālib___).', 'َيْنِ', 'ayni'],
  ])('rejects the historical %s mixed-script reveal but accepts the paired-script repair',
    (_name, prompt, suffix, romanization) => {
      const broken = arabicItem(prompt, suffix);
      expect(validateReviewItemQuality(broken).join('\n')).toContain('introduces a mixed Arabic/Latin token');
      expect(validateReviewItemQuality(arabicItem(prompt, `${suffix} (${romanization})`))).toEqual([]);
    });

  it('does not reject bilingual prompts or separate whole-word Arabic insertions', () => {
    expect(validateReviewItemQuality(arabicItem(
      'Complete “two books came”: جَاءَ ___ (jāʾa ___).', 'كِتَابَانِ',
    ))).toEqual([]);
    expect(validateReviewItemQuality(arabicItem(
      'Give the Arabic plural of teacher (muʿallim): ___.', 'مُعَلِّمُونَ',
    ))).toEqual([]);
  });

  it('detects an Arabic vowel mark joined to Latin, without banning Latin combining diacritics', () => {
    expect(validateReviewItemQuality(arabicItem(
      'Insert fatḥa: ت___ (t___).', 'َ',
    )).join('\n')).toContain('introduces a mixed Arabic/Latin token');
    expect(validateReviewItemQuality(arabicItem(
      'Write the romanized dual ending after ṭālib: ṭālib___.', 'a\u0304ni',
    ))).toEqual([]);
  });
});

describe('inventory schema and indexed catalog mutations', () => {
  it.each([
    ['malformed JSON', '{', 'invalid inventory JSON'],
    ['missing objective', JSON.stringify({
      language: 'ja', lessons: [{ ...INVENTORY, teachingPoints: [{ ...INVENTORY.teachingPoints[0], objective: undefined }] }],
    }), 'objective must be nonempty text'],
    ['duplicate point', JSON.stringify({
      language: 'ja', lessons: [{ ...INVENTORY, teachingPoints: [INVENTORY.teachingPoints[0], INVENTORY.teachingPoints[0]] }],
    }), 'duplicate point id'],
    ['incorrect field name', JSON.stringify({
      language: 'ja', lessons: [{ ...INVENTORY, teachingPoints: [{ ...INVENTORY.teachingPoints[0], promt: 'Typo' }] }],
    }), 'unknown field "promt"'],
  ])('rejects inventory mutation: %s', (_name, raw, message) => {
    expect(parseRetentionInventory(raw).errors.join('\n')).toContain(message);
  });

  it('rejects a missing indexed asset even when its inventory remains', () => {
    const mutated = catalog();
    delete mutated.lessons[`ja/${INVENTORY.lessonId}`];
    expect(validateRetentionCatalog(mutated, ['ja']).join('\n')).toContain('missing/empty indexed lesson asset');
  });

  it('rejects invalid index asset paths and duplicate index IDs', () => {
    const mutated = catalog();
    mutated.indexes.ja = '[{"id":"../outside"}]';
    expect(validateRetentionCatalog(mutated, ['ja']).join('\n')).toContain('invalid lesson ID/asset path');
    mutated.indexes.ja = JSON.stringify([{ id: INVENTORY.lessonId }, { id: INVENTORY.lessonId }]);
    expect(validateRetentionCatalog(mutated, ['ja']).join('\n')).toContain('duplicate lesson IDs');
  });

  it('rejects missing and overlapping inventories instead of accepting partial catalog coverage', () => {
    const missing = catalog();
    missing.inventories = {};
    expect(validateRetentionCatalog(missing, ['ja']).join('\n')).toContain('missing reviewed lesson inventory');
    const overlapping = catalog();
    overlapping.inventories['ja-second-batch.json'] = overlapping.inventories['ja-pilot.json'];
    expect(validateRetentionCatalog(overlapping, ['ja']).join('\n')).toContain('inventoried more than once');
  });

  it('rejects stale inventory files and unsupported/mismatched language labels', () => {
    const stale = catalog();
    stale.inventories['ja-old.json'] = JSON.stringify({
      language: 'ja', lessons: [{ ...INVENTORY, lessonId: 'deleted-lesson' }],
    });
    expect(validateRetentionCatalog(stale, ['ja']).join('\n')).toContain('stale inventory for non-indexed lesson');
    const renamed = catalog();
    renamed.inventories['ro-pilot.json'] = renamed.inventories['ja-pilot.json'];
    expect(validateRetentionCatalog(renamed, ['ja']).join('\n')).toContain('filename language differs');
    const unsupported = catalog();
    unsupported.inventories['ru-pilot.json'] = '{}';
    expect(validateRetentionCatalog(unsupported, ['ja']).join('\n')).toContain('unexpected/stale inventory filename');
  });

  it('scopes completed languages independently while global validation still catches foreign errors', () => {
    const mixed = catalog();
    mixed.indexes.es = 'unfinished index';
    mixed.lessons['es/unfinished'] = 'unfinished lesson';
    mixed.inventories['es-unfinished.json'] = 'unfinished inventory';
    expect(validateRetentionCatalog(scopeRetentionCatalog(mixed, 'ja'), ['ja'])).toEqual([]);
    expect(validateRetentionCatalog(mixed, ['ja', 'es']).join('\n')).toContain('invalid inventory JSON');
  });

  it('does not hide a misowned inventory from its filename language selector', () => {
    const misowned = catalog();
    misowned.inventories['ja-misowned.json'] = JSON.stringify({ language: 'es', lessons: [INVENTORY] });
    expect(validateRetentionCatalog(scopeRetentionCatalog(misowned, 'ja'), ['ja']).join('\n'))
      .toContain('filename language differs from inventory');
  });
});
