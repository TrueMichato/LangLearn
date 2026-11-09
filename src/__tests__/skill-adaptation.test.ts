import { describe, expect, it } from 'vitest';
import { lexicalPairWords, selectCharacterItems, selectSkillItems } from '../lib/skill-adaptation';
import type { SkillProgress, CharacterProgress } from '../db/schema';

const row = (skill: string, correct: number, attempts = 10): SkillProgress => ({
  id: `ja/minimal-pairs/${skill}`, language: 'ja', activity: 'minimal-pairs', skill, correct, attempts,
});
describe('nonlexical selection', () => {
  it('reinforces demonstrated weak contrasts, stays deterministic, and never leaves the manual pool', () => {
    const items = ['weak', 'strong', 'new', 'other'].map((id) => ({ id }));
    const history = [row('weak', 0), row('strong', 10)];
    const selected = selectSkillItems(items, history, (item) => item.id, 2, 'attempt');
    expect(selected[0].id).toBe('weak');
    expect(selected.map((item) => item.id)).not.toContain('strong');
    expect(selectSkillItems(items, history, (item) => item.id, 2, 'attempt')).toEqual(selected);
    expect(selectSkillItems(items.slice(1, 2), history, (item) => item.id, 5, 'attempt')).toEqual([items[1]]);
  });
  it('uses character evidence only in the current alphabet', () => {
    const characters = ['あ', 'い', 'う'].map((char) => ({ char, romanji: char, group: 'Vowels', strokes: 1 }));
    const progress = new Map<string, CharacterProgress>([
      ['ja/Hiragana/あ', { id: 'ja/Hiragana/あ', language: 'ja', character: 'あ', romanji: 'a',
        correctCount: 0, totalAttempts: 10, mastery: 'learning', lastPracticed: '' }],
      ['ja/Katakana/い', { id: 'ja/Katakana/い', language: 'ja', character: 'い', romanji: 'i',
        correctCount: 0, totalAttempts: 100, mastery: 'learning', lastPracticed: '' }],
    ]);
    expect(selectCharacterItems(characters, progress, 'ja', 'Hiragana', 1, 'seed')[0].char).toBe('あ');
  });
  it('keeps task-specific number performance separate', () => {
    const items = ['ones', 'teens', 'hundreds'];
    const history = [row('word-to-numeral/ones', 0), row('numeral-to-word/hundreds', 0)];
    expect(selectSkillItems(items, history, (range) => `numeral-to-word/${range}`, 1, 'seed')).toEqual(['hundreds']);
  });
  it('does not offer phonetic fragments or arbitrary numerals as vocabulary', () => {
    expect(lexicalPairWords({ id: 'x', wordA: '12', wordB: 'ka', readingA: '', readingB: '',
      meaningA: 'twelve', meaningB: 'phonetic syllable', category: '', hint: '' })).toEqual([]);
    expect(lexicalPairWords({ id: 'x', wordA: 'pero', wordB: 'perro', readingA: '', readingB: '',
      meaningA: 'but', meaningB: 'dog', category: '', hint: '' })).toHaveLength(2);
  });
});
