/**
 * Regression test for the bulk-vocabulary workstream (issue #36): a lesson
 * used to hide "Add words to vocabulary" behind the summary screen, so a
 * learner who reads through the words and answers a few exercises but never
 * finishes the lesson had no way to bulk-save what they had already seen.
 *
 * This scans the component's own source rather than mounting it, following
 * the same convention as `database-boot.test.ts`: `VocabLessonView` fetches
 * lesson content and touches IndexedDB in effects that never run under
 * `renderToStaticMarkup`, so the only way to prove the button is *wired into*
 * the word-introduction and exercise steps — not just present somewhere in
 * the file — is to check each step's own render block.
 */
import { describe, expect, it } from 'vitest';

const SOURCES = import.meta.glob('../components/vocab/VocabLessonView.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const SOURCE = Object.values(SOURCES)[0];

describe('VocabLessonView bulk-add availability', () => {
  it('reads its own source', () => {
    expect(SOURCE).toBeTruthy();
    expect(SOURCE.length).toBeGreaterThan(500);
  });

  it('renders the shared bulk-add button in the word-introduction step', () => {
    const wordsStepStart = SOURCE.indexOf("if (step === 'words')");
    const exerciseStepStart = SOURCE.indexOf("if (step === 'exercise'");
    expect(wordsStepStart).toBeGreaterThan(-1);
    expect(exerciseStepStart).toBeGreaterThan(wordsStepStart);

    const wordsStepBlock = SOURCE.slice(wordsStepStart, exerciseStepStart);
    expect(wordsStepBlock).toContain('<AddAllWordsButton');
    // It must appear before the step's own completion control, not after it.
    expect(wordsStepBlock.indexOf('<AddAllWordsButton')).toBeLessThan(
      wordsStepBlock.indexOf('Start Exercises'),
    );
  });

  it('renders the shared bulk-add button during exercises, before the summary', () => {
    const exerciseStepStart = SOURCE.indexOf("if (step === 'exercise'");
    const summaryStart = SOURCE.indexOf('Step 5: Summary');
    expect(exerciseStepStart).toBeGreaterThan(-1);
    expect(summaryStart).toBeGreaterThan(exerciseStepStart);

    const exerciseStepBlock = SOURCE.slice(exerciseStepStart, summaryStart);
    expect(exerciseStepBlock).toContain('<AddAllWordsButton');
  });

  it('keeps the same shared button in the summary, so all three surfaces agree', () => {
    const summaryStart = SOURCE.indexOf('Step 5: Summary');
    const summaryBlock = SOURCE.slice(summaryStart);
    expect(summaryBlock).toContain('<AddAllWordsButton');
  });

  it('drives every instance of the button from the same derived state', () => {
    // A regression where one call site drifted onto its own local state (and
    // so disagreed with the others about whether the lesson's words were
    // already saved) would not be caught by only checking presence above.
    const instances = [...SOURCE.matchAll(/<AddAllWordsButton\b[^>]*\/>/g)];
    expect(instances.length).toBe(3);
    for (const [instance] of instances) {
      expect(instance).toContain('status={bulkStatus}');
      expect(instance).toContain('result={bulkResult}');
      expect(instance).toContain('onClick={handleAddAllWords}');
    }
  });
});
