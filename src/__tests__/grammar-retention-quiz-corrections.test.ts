import { describe, expect, it } from 'vitest';
import spanishLesson from '../../public/content/grammar/es/relative-pronouns.md?raw';
import portugueseLesson from '../../public/content/grammar/pt/numbers-dates.md?raw';
import japanesePurposeLesson from '../../public/content/grammar/ja/purpose.md?raw';
import japaneseDesireLesson from '../../public/content/grammar/ja/taekim-desire-volition.md?raw';
import japaneseConditionalLesson from '../../public/content/grammar/ja/conditional.md?raw';
import arabicMasdarLesson from '../../public/content/grammar/ar/masdar.md?raw';
import arabicNudbaLesson from '../../public/content/grammar/ar/istighatha-nudba.md?raw';
import baselineJson from './fixtures/grammar-retention-legacy.json';
import {
  APPROVED_QUIZ_CORRECTIONS,
  lessonQuizPayloads,
  quizFingerprint,
  restoreApprovedQuizCorrections,
  validateLegacyLesson,
  type AuthoredQuizPayload,
  type LegacyBaseline,
} from './helpers/grammar-retention';

const BASELINE: LegacyBaseline = baselineJson;
const SOURCES: Record<string, string> = {
  'es/relative-pronouns': spanishLesson,
  'pt/numbers-dates': portugueseLesson,
  'ja/purpose': japanesePurposeLesson,
  'ja/taekim-desire-volition': japaneseDesireLesson,
  'ar/istighatha-nudba': arabicNudbaLesson,
};

/** Mutate one real comment; payload reading and validation use the shared parser. */
function replaceQuizPayload(markdown: string, position: number, payload?: unknown): string {
  let seen = 0;
  const result = markdown.replace(/<!--\s*quiz:[\s\S]*?-->/g, (comment) => {
    if (++seen !== position) return comment;
    return payload === undefined ? '' : `<!-- quiz: ${JSON.stringify(payload)} -->`;
  });
  if (seen < position) throw new Error(`Missing quiz ${position}`);
  return result;
}

describe('approved real-source quiz corrections', () => {
  it('uses cuyas for the possessed feminine plural novelas, not the gender of author', () => {
    const quiz = lessonQuizPayloads(spanishLesson)[1] as AuthoredQuizPayload;
    const correction = APPROVED_QUIZ_CORRECTIONS.find((entry) => entry.lessonKey === 'es/relative-pronouns')!;
    expect(quiz).toEqual(correction.corrected);
    expect(quiz.options[quiz.answer]).toBe('cuyas');
    expect(spanishLesson).toContain('La autora ___ novelas leo es famosa. (whose)');
  });

  it('offers only one correct 4:30 option while leaving quatro e meia as the answer', () => {
    const quiz = lessonQuizPayloads(portugueseLesson)[2] as AuthoredQuizPayload;
    const correction = APPROVED_QUIZ_CORRECTIONS.find((entry) => entry.lessonKey === 'pt/numbers-dates')!;
    const halfPastFour = (option: string) => /^São quatro e (?:trinta|meia)$/.test(option);
    expect(correction.original.options.filter(halfPastFour)).toHaveLength(2);
    expect(quiz).toEqual(correction.corrected);
    expect(quiz.options.filter(halfPastFour)).toEqual(['São quatro e meia']);
    expect(quiz.options[quiz.answer]).toBe('São quatro e meia');
    expect(quiz.options[0]).toBe('São quatro e quinze');
  });

  it('asks specifically for ように without changing the purpose quiz options or answer', () => {
    const quiz = lessonQuizPayloads(japanesePurposeLesson)[1] as AuthoredQuizPayload;
    const correction = APPROVED_QUIZ_CORRECTIONS.find((entry) => entry.lessonKey === 'ja/purpose')!;
    expect(correction.original.question).toBe("Which is correct for 'I set an alarm so as not to oversleep'?");
    expect(quiz).toEqual(correction.corrected);
    expect(quiz.question).toBe("Using ように, how do you say 'I set an alarm so as not to oversleep'?");
    expect(quiz.options).toEqual(correction.original.options);
    expect(quiz.answer).toBe(1);
    expect(quiz.options[quiz.answer]).toBe('寝坊しないように、アラームをかけた');
  });

  it('qualifies third-person たい assertions instead of declaring them impossible in every context', () => {
    const quiz = lessonQuizPayloads(japaneseDesireLesson)[1] as AuthoredQuizPayload;
    const correction = APPROVED_QUIZ_CORRECTIONS.find((entry) => entry.lessonKey === 'ja/taekim-desire-volition')!;
    expect(correction.original.question).toBe("Why can't you say '彼は行きたい' in normal conversation?");
    expect(correction.original.options[1]).toBe('たい can only describe your own desires');
    expect(quiz).toEqual(correction.corrected);
    expect(quiz.question).toBe("Why is an unqualified '彼は行きたい' often avoided in ordinary conversation?");
    expect(quiz.options[1]).toBe("An unqualified たい assertion normally presents the speaker's own desire");
    expect(quiz.options.filter((_, index) => index !== 1))
      .toEqual(correction.original.options.filter((_, index) => index !== 1));
    expect(quiz.answer).toBe(1);
  });

  it('uses pausal هْ for nudba rather than the possessive-sounding هُ', () => {
    const quiz = lessonQuizPayloads(arabicNudbaLesson)[1] as AuthoredQuizPayload;
    const correction = APPROVED_QUIZ_CORRECTIONS.find((entry) => entry.lessonKey === 'ar/istighatha-nudba')!;
    expect(correction.original.options[0]).toBe('وَا قَلْبَاهُ (wā qalbāh)');
    expect(quiz).toEqual(correction.corrected);
    expect(quiz.options[quiz.answer]).toBe('وَا قَلْبَاهْ (wā qalbāh)');
    expect(quiz.question).toBe(correction.original.question);
    expect(quiz.options.slice(1)).toEqual(correction.original.options.slice(1));
    expect(quiz.answer).toBe(0);
  });

  for (const correction of APPROVED_QUIZ_CORRECTIONS) {
    describe(`${correction.lessonKey} quiz ${correction.position}`, () => {
      const source = SOURCES[correction.lessonKey];
      const baseline = BASELINE.lessons[correction.lessonKey];
      const before = replaceQuizPayload(source, correction.position, correction.original);
      const corrected = replaceQuizPayload(source, correction.position, correction.corrected);

      it('requires the corrected payload, reverses only that payload, and matches the original frozen hash', () => {
        expect(quizFingerprint(before)).toEqual({
          quizCount: baseline.quizCount, quizSha256: baseline.quizSha256,
        });
        expect(quizFingerprint(corrected)).not.toEqual(quizFingerprint(before));
        const currentQuizzes = lessonQuizPayloads(corrected);
        const untouched = structuredClone(currentQuizzes);
        const restored = restoreApprovedQuizCorrections(currentQuizzes, correction.lessonKey);
        expect(restored.errors).toEqual([]);
        expect(restored.quizzes).toEqual(lessonQuizPayloads(before));
        expect(currentQuizzes).toEqual(untouched);
        expect(validateLegacyLesson(corrected, baseline, correction.lessonKey)).toEqual([]);
      });

      it('rejects the old incorrect payload even though its hash still equals the original baseline', () => {
        expect(validateLegacyLesson(before, baseline, correction.lessonKey).join('\n'))
          .toContain('must match the exact approved corrected payload');
      });

      it('does not apply the exception without explicit matching lesson context', () => {
        expect(validateLegacyLesson(corrected, baseline).join('\n'))
          .toContain('authored quiz sequence/scoring changed from the baseline');
        expect(validateLegacyLesson(corrected, baseline, 'ja/conditional').join('\n'))
          .toContain('authored quiz sequence/scoring changed from the baseline');
      });

      it('rejects additional edits inside the otherwise approved quiz', () => {
        for (const [field, payload] of [
          ['question', { ...correction.corrected, question: `${correction.corrected.question} Unapproved wording.` }],
          ['answer', {
            ...correction.corrected,
            answer: (correction.corrected.answer + 1) % correction.corrected.options.length,
          }],
          ['option', {
            ...correction.corrected,
            options: correction.corrected.options.map((option, index) =>
              index === 0 ? `${option} Unapproved wording.` : option),
          }],
        ] as const) {
          const changed = replaceQuizPayload(corrected, correction.position, payload);
          expect(validateLegacyLesson(changed, baseline, correction.lessonKey).join('\n'), field)
            .toContain('must match the exact approved corrected payload');
        }
      });

      it('keeps every unrelated quiz field frozen', () => {
        const first = lessonQuizPayloads(corrected)[0] as AuthoredQuizPayload;
        const changed = replaceQuizPayload(corrected, 1, {
          ...first, answer: (first.answer + 1) % first.options.length,
        });
        expect(validateLegacyLesson(changed, baseline, correction.lessonKey).join('\n'))
          .toContain('authored quiz sequence/scoring changed from the baseline');
      });

      it('still rejects reordered, added, or removed quizzes', () => {
        const quizzes = lessonQuizPayloads(corrected);
        const reordered = replaceQuizPayload(
          replaceQuizPayload(corrected, 1, quizzes[correction.position - 1]),
          correction.position, quizzes[0],
        );
        const added = `${corrected}\n<!-- quiz: ${JSON.stringify(quizzes[0])} -->`;
        const removed = replaceQuizPayload(corrected, 1);
        for (const [label, changed] of [['reordered', reordered], ['added', added], ['removed', removed]]) {
          expect(validateLegacyLesson(changed, baseline, correction.lessonKey).join('\n'), label)
            .toContain('authored quiz sequence/scoring changed from the baseline');
        }
      });
    });
  }

  it.each([
    ['ja/conditional', japaneseConditionalLesson],
    ['ar/masdar', arabicMasdarLesson],
  ])('does not unfreeze any unapproved quiz in %s', (lessonKey, source) => {
    const first = lessonQuizPayloads(source)[0] as AuthoredQuizPayload;
    const changed = replaceQuizPayload(source, 1, {
      ...first, answer: (first.answer + 1) % first.options.length,
    });
    expect(validateLegacyLesson(changed, BASELINE.lessons[lessonKey], lessonKey).join('\n'))
      .toContain('authored quiz sequence/scoring changed from the baseline');
  });
});
