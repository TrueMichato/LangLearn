import type { CharacterProgress, SkillProgress } from '../db/schema';
import { seededShuffle } from './guided-practice';
import type { Character } from '../data/alphabets';
import type { MinimalPair } from '../data/minimal-pairs';

export function lexicalPairWords(pair: MinimalPair) {
  return [
    { word: pair.wordA, reading: pair.readingA, meaning: pair.meaningA },
    { word: pair.wordB, reading: pair.readingB, meaning: pair.meaningB },
  ].filter(({ word, meaning }) =>
    /\p{L}/u.test(word) && word.replace(/\P{L}/gu, '').length > 1 && meaning.trim() &&
    !/nonsense|non-?word|not a word|sound only|syllable|phonetic|fragment|letter|prefix|suffix|rare root|not used|\(sound\)|—|^-/i.test(meaning));
}

/** Weak demonstrated skills first, with unseen skills between weak and secure. */
export function selectSkillItems<T>(
  items: readonly T[], history: readonly SkillProgress[], skill: (item: T) => string,
  count: number, seed: string,
): T[] {
  const bySkill = new Map(history.map((row) => [row.skill, row]));
  const priority = (item: T) => {
    const row = bySkill.get(skill(item));
    return row?.attempts ? (row.correct + 1) / (row.attempts + 2) : 0.6;
  };
  const shuffled = seededShuffle(items, seed);
  const ranked = [...shuffled].sort((a, b) => priority(a) - priority(b));
  // Keep a small exploration/reinforcement slice rather than excluding secure skills.
  const focusCount = Math.ceil(count * 0.8);
  const focus = ranked.slice(0, focusCount);
  return [...focus, ...shuffled.filter((item) => !focus.includes(item))]
    .slice(0, Math.min(count, items.length));
}

export function selectCharacterItems(
  characters: readonly Character[], progress: ReadonlyMap<string, CharacterProgress>,
  language: string, alphabet: string, count: number, seed: string,
): Character[] {
  const history: SkillProgress[] = characters.flatMap((character) => {
    const row = progress.get(`${language}/${alphabet}/${character.char}`);
    return row ? [{
      id: row.id, language, activity: 'minimal-pairs' as const, skill: character.char,
      attempts: row.totalAttempts, correct: row.mastery === 'mastered'
        ? row.totalAttempts : row.correctCount,
    }] : [];
  });
  return selectSkillItems(characters, history, (item) => item.char, count, seed);
}
