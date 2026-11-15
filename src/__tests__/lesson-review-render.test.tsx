import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import GrammarCard from '../components/srs/GrammarCard';
import LessonReviewEditor, { LessonReviewPreview } from '../components/grammar/LessonReviewEditor';
import type { GrammarReviewItem, VocabularyReviewItem } from '../lib/lesson-review';
import type { Word } from '../db/schema';

const concept: GrammarReviewItem = {
  id: 'form-i', kind: 'concept', source: 'grammar-card', provenance: 'authored',
  priority: 'essential', sourceSection: 'Form I', format: 'qa',
  prompt: 'Can every Form I maṣdar be predicted from its verb?',
  answer: 'No — Form I maṣdars are learned individually, with their verbs.',
  explanation: 'دَرَسَ → دِرَاسَةٌ is one lexical pair.', rule: 'Form I is not universally predictable',
  hint: '', legacyAliases: [],
};
const word: Word = {
  language: 'ar', word: concept.answer, reading: '', meaning: concept.explanation,
  contextSentence: concept.prompt, grammarRule: concept.rule, type: 'grammar',
  grammarKind: 'concept', grammarFormat: 'qa', tags: ['grammar', 'lesson:masdar'],
  createdAt: '2026-11-15T10:00:00.000Z', sourceTextId: null,
};

describe('lesson review previews and normal grammar review', () => {
  it('keeps conceptual answers hidden on the front and preserves English Q&A verbatim on the back', () => {
    const front = renderToStaticMarkup(<GrammarCard word={word} isFlipped={false} onFlip={() => {}} />);
    expect(front).toContain(concept.prompt);
    expect(front).not.toContain(concept.answer);
    expect(front).not.toContain(concept.explanation);
    expect(front).toContain('dir="ltr"');
    expect(front).toContain('Concept');
    const back = renderToStaticMarkup(<GrammarCard word={word} isFlipped onFlip={() => {}} />);
    expect(back).toContain(concept.answer);
    expect(back).toContain(concept.explanation);
    expect(back).not.toContain('What fills the blank?');
  });

  it('does not interpret blanks inside explicit Q&A as a cloze', () => {
    const qa = { ...word, contextSentence: 'What does ___ represent in these examples?' };
    const front = renderToStaticMarkup(<GrammarCard word={qa} isFlipped={false} onFlip={() => {}} />);
    expect(front).not.toContain('What fills the blank?');
    const back = renderToStaticMarkup(<GrammarCard word={qa} isFlipped onFlip={() => {}} />);
    expect(back).not.toContain(`What does ${concept.answer}`);
    expect(back).toContain(concept.answer);
  });

  it('fills Arabic cloze examples in the target direction and leaves English explanations LTR', () => {
    const cloze = {
      ...word, grammarKind: 'rule' as const, grammarFormat: 'cloze' as const,
      contextSentence: 'دَرَسَ → ___', word: 'دِرَاسَةٌ', meaning: 'Learn the maṣdar alongside the verb.',
    };
    const front = renderToStaticMarkup(<GrammarCard word={cloze} isFlipped={false} onFlip={() => {}} />);
    expect(front).toContain('dir="rtl"');
    expect(front).toContain('What fills the blank?');
    const back = renderToStaticMarkup(<GrammarCard word={cloze} isFlipped onFlip={() => {}} />);
    expect(back).toContain('دَرَسَ → دِرَاسَةٌ');
    expect(back).toContain('dir="ltr"');
    expect(back).toContain('dir="rtl"');
  });

  it('previews word/phrase meanings and genuine target-language context without changing their type', () => {
    const vocabulary: VocabularyReviewItem = {
      id: 'study', kind: 'vocabulary', source: 'vocab-card', priority: 'essential', provenance: 'authored',
      sourceSection: 'Form I', word: 'دِرَاسَةٌ', reading: 'dirāsatun', meaning: 'studying; study',
      contextSentence: 'أُحِبُّ الدِّرَاسَةَ.', isSentence: false, sourceText: '',
    };
    const html = renderToStaticMarkup(<LessonReviewPreview item={vocabulary} language="ar" />);
    expect(html).toContain('Front');
    expect(html).toContain('Back');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain(vocabulary.meaning);
    expect(html).toContain(vocabulary.contextSentence);
  });

  it('provides a small labeled offline editor and an explicit preview, not a second dialog', () => {
    const html = renderToStaticMarkup(<LessonReviewEditor item={concept} language="ar"
      onCommit={() => {}} onCancel={() => {}} />);
    expect(html).toContain('Question and answer');
    expect(html).toContain('Fill in the blank');
    expect(html).toContain('Explanation (optional)');
    expect(html).toContain('Use this item');
    expect(html).toContain('Nothing is saved until you confirm Save');
    expect(html).not.toContain('role="dialog"');
  });
});
