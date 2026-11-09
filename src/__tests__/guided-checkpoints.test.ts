import { describe, expect, it } from 'vitest';
import { LEARNING_PATHS } from '../data/learning-paths';
import { unitLessons } from '../data/learning-paths/shared';
import { composeComprehensiveLearningPath } from '../lib/curriculum-composition';
import { CURRICULUM_LANGUAGES } from '../lib/curriculum-policy';
import { deriveLearningPathBaseline, resolveLearningPath } from '../lib/learning-path';
import { guidedActivityRoute, parseGuidedPracticeQuery, selectGuidedItems, validateGuidedCompletion } from '../lib/guided-practice';
import { getPracticeSentences } from '../data/sentences';
import { getNumbersForLanguage } from '../data/numbers';
import * as pairs from '../data/minimal-pairs';
import type { LessonProgress, GuidedActivityProgress } from '../db/schema';
import type { CurriculumCatalogEntry } from '../lib/curriculum-composition';
import type { LearningPathActivityRef } from '../types/learning-path';

const indexes = import.meta.glob('../../public/content/{grammar,vocab}/*/index.json',
  { eager: true, import: 'default' }) as Record<string, CurriculumCatalogEntry[]>;
const contentFor = (language: string) => ({
  grammar: indexes[`../../public/content/grammar/${language}/index.json`],
  vocab: indexes[`../../public/content/vocab/${language}/index.json`],
});
const lesson = (lessonId: string): LessonProgress => ({
  id: `ja/${lessonId}`, language: 'ja', lessonId, completed: true,
  quizScore: 0, completedAt: '2026-01-01', attempts: 1,
});
const done = (milestoneId: string): GuidedActivityProgress => ({
  id: `ja/${milestoneId}`, language: 'ja', milestoneId, activity: 'minimal-pairs',
  completedAt: '2026-01-02', attempts: 1, itemsCompleted: 5, bestScore: 0,
});
const pairPools = { ja: pairs.jaMinimalPairs, ru: pairs.ruMinimalPairs,
  es: pairs.esMinimalPairs, pt: pairs.ptMinimalPairs, ar: pairs.arMinimalPairs, ro: pairs.roMinimalPairs };

describe('foundation checkpoints v2', () => {
  it.each(CURRICULUM_LANGUAGES)('%s interleaves scoped checkpoints with real instructional anchors and enough content', (language) => {
    const manifest = composeComprehensiveLearningPath(LEARNING_PATHS[language], contentFor(language));
    const nodes = manifest.units.flatMap(unitLessons);
    const checkpoints = nodes.filter((node): node is LearningPathActivityRef =>
      'introducedIn' in node && node.introducedIn === 2);
    expect(checkpoints).toHaveLength(language === 'ar' ? 3 : 2);
    expect(composeComprehensiveLearningPath(manifest, contentFor(language))).toEqual(manifest);
    for (const checkpoint of checkpoints) {
      const position = nodes.indexOf(checkpoint);
      expect(nodes.slice(0, position).some((node) =>
        checkpoint.prerequisites?.includes(`${node.kind}:${node.lessonId}`))).toBe(true);
      const parsed = parseGuidedPracticeQuery(guidedActivityRoute(checkpoint, language).split('?')[1], checkpoint.kind);
      expect(parsed.kind).toBe('guided');
      if (parsed.kind !== 'guided') throw new Error('Invalid authored link');
      let eligible: { id: string }[];
      if (checkpoint.kind === 'sentence') {
        eligible = getPracticeSentences(language).filter((item) => item.difficulty === checkpoint.scope?.difficulty);
      } else if (checkpoint.kind === 'minimal-pairs') {
        eligible = pairPools[language].filter((item) => checkpoint.scope?.categories?.includes(item.category));
      } else {
        eligible = getNumbersForLanguage(language).filter((entry) => checkpoint.scope?.ranges?.includes(entry.range))
          .map((entry) => ({ id: String(entry.value) }));
      }
      const selected = selectGuidedItems(eligible, parsed.descriptor, (item) => item.id);
      expect(selected).toHaveLength(checkpoint.session.targetItems);
      expect(validateGuidedCompletion(parsed.descriptor, selected.length, 0)).toBe('');
    }
  });

  it('requires participation, never accuracy, before advancing new learners', () => {
    const manifest = LEARNING_PATHS.ja;
    const content = contentFor('ja');
    const resolution = { progress: [lesson('vocab/greetings'), lesson('particles')],
      completedLetters: new Set(manifest.letterPrerequisites) };
    const nodes = resolveLearningPath(manifest, content, resolution).units.flatMap((unit) => unit.nodes);
    expect(nodes.find((node) => node.id === 'minimal-pairs:foundation-sounds-after-grammar-particles-v2')?.state).toBe('available');
    expect(nodes.find((node) => node.id === 'sentence:foundation-sentences-after-grammar-particles-v2')?.state).toBe('locked');
    const after = resolveLearningPath(manifest, content, {
      ...resolution, activityProgress: [done('minimal-pairs:foundation-sounds-after-grammar-particles-v2')],
    });
    expect(after.units.flatMap((unit) => unit.nodes)
      .find((node) => node.id === 'sentence:foundation-sentences-after-grammar-particles-v2')?.state).toBe('available');
  });

  it('derives retained access from the old version and leaves new catch-up genuinely incomplete', () => {
    const manifest = LEARNING_PATHS.ja;
    const content = contentFor('ja');
    const frozen = { progress: [lesson('vocab/greetings'), lesson('particles'), lesson('vocab/numbers')],
      completedLetters: new Set(manifest.letterPrerequisites) };
    const baseline = deriveLearningPathBaseline(manifest, content, frozen);
    expect(baseline.accessibleNodeIds).toContain('vocab:days-months');
    const current = resolveLearningPath(manifest, content, { ...frozen, baseline });
    const nodes = current.units.flatMap((unit) => unit.nodes);
    expect(nodes.find((node) => node.id === 'vocab:days-months')?.state).toBe('available');
    expect(nodes.find((node) => node.id === 'minimal-pairs:foundation-sounds-after-grammar-particles-v2')).toMatchObject({
      catchUp: true, state: 'available',
    });
    expect(current.recommendedNodeId).toBe('vocab:days-months');
    expect(current.completedCount).toBe(5); // Two scripts + three lessons, no fabricated practice.
  });

  it('does not convert later progress into retroactive catch-up', () => {
    const manifest = LEARNING_PATHS.ja;
    const content = contentFor('ja');
    const baseline = deriveLearningPathBaseline(manifest, content, {
      progress: [], completedLetters: new Set(),
    });
    const current = resolveLearningPath(manifest, content, {
      baseline, progress: [lesson('vocab/greetings'), lesson('particles')],
      completedLetters: new Set(manifest.letterPrerequisites),
    });
    const checkpoint = current.units.flatMap((unit) => unit.nodes)
      .find((node) => node.id === 'minimal-pairs:foundation-sounds-after-grammar-particles-v2');
    expect(checkpoint?.catchUp).toBe(false);
    expect(current.recommendedNodeId).toBe(checkpoint?.id);
  });

  it('does not treat an out-of-order completion as previously earned prerequisite access', () => {
    const manifest = LEARNING_PATHS.ja;
    const content = contentFor('ja');
    const frozen = { progress: [lesson('particles')], completedLetters: new Set(manifest.letterPrerequisites) };
    const baseline = deriveLearningPathBaseline(manifest, content, frozen);
    expect(baseline.completedLessonIds).not.toContain('grammar:particles');
    const checkpoint = resolveLearningPath(manifest, content, { ...frozen, baseline })
      .units.flatMap((unit) => unit.nodes)
      .find((node) => node.id === 'minimal-pairs:foundation-sounds-after-grammar-particles-v2');
    expect(checkpoint).toMatchObject({ state: 'locked', catchUp: false });
  });
});
