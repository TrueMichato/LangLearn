/**
 * Normalise the `<!-- grammar-card: … -->` blocks in public/content/grammar.
 *
 * The content was authored with three different conventions for the `answer`
 * field — a bare token, `token — gloss`, and the whole filled sentence — and
 * the review card substitutes that field into the prompt's blank verbatim. Two
 * of the three therefore rendered corrupted reveal sides.
 *
 * `src/lib/grammar-cards.ts` now parses all three at runtime, so this script is
 * not what makes the app correct. It exists so the *content* stops relying on
 * that parsing: it rewrites each block to the single canonical shape (a bare
 * token in `answer`, any gloss folded into `explanation`) and reports the
 * blocks it could not confidently normalise, rather than guessing at them.
 *
 * Usage:
 *   npx tsx scripts/normalize-grammar-cards.ts          # report only
 *   npx tsx scripts/normalize-grammar-cards.ts --write  # apply
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  parseAnswer,
  combineExplanation,
  countBlanks,
  fillBlank,
  hasBlank,
} from '../src/lib/grammar-cards';

const CONTENT_ROOT = path.join('public', 'content', 'grammar');
const BLOCK_REGEX = /<!--\s*grammar-card:\s*(.*?)\s*-->/g;

interface CardBlock {
  rule: string;
  hint?: string;
  example?: string;
  answer?: string;
  explanation: string;
}

interface Flag {
  file: string;
  rule: string;
  reason: string;
  example: string;
  answer: string;
}

const write = process.argv.includes('--write');

let total = 0;
let rewritten = 0;
const flags: Flag[] = [];

/**
 * Whether a normalised token still looks wrong.
 *
 * These are handed back for a human to look at rather than being rewritten,
 * because the failure mode of guessing here is a card that silently teaches
 * the wrong thing.
 */
function suspicious(card: CardBlock, token: string): string | null {
  const example = card.example ?? '';
  if (!token) return 'answer produced no token';
  if (/\s+[—–]\s+/.test(token)) return 'token still contains a gloss separator';
  if (token.includes(' / ')) return 'answer offers multiple alternatives';

  // A multi-blank prompt is only a problem when the answer cannot be spread
  // across its blanks — the reveal then repeats the whole answer in every slot,
  // which is exactly the corruption this work set out to remove.
  const blanks = countBlanks(example);
  if (blanks > 1) {
    const filled = fillBlank(example, token);
    const repeats = filled.split(token).length - 1;
    if (repeats > 1) {
      return `prompt has ${blanks} blanks but the answer cannot be split across them`;
    }
  }
  return null;
}

for (const lang of fs.readdirSync(CONTENT_ROOT)) {
  const dir = path.join(CONTENT_ROOT, lang);
  if (!fs.statSync(dir).isDirectory()) continue;

  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const filePath = path.join(dir, file);
    const original = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    const updated = original.replace(BLOCK_REGEX, (match, json: string) => {
      total++;
      let card: CardBlock;
      try {
        card = JSON.parse(json) as CardBlock;
      } catch {
        flags.push({
          file: `${lang}/${file}`,
          rule: '(unparseable)',
          reason: 'block is not valid JSON',
          example: '',
          answer: '',
        });
        return match;
      }

      const example = card.example ?? '';
      const rawAnswer = card.answer ?? '';
      const { token, gloss } = parseAnswer(rawAnswer, example);

      const problem = suspicious(card, token);
      if (problem) {
        flags.push({
          file: `${lang}/${file}`,
          rule: card.rule,
          reason: problem,
          example,
          answer: rawAnswer,
        });
        return match;
      }

      // Prompts with no blank are questions rather than fill-ins; their answer
      // is never substituted anywhere, so leave the authored wording alone.
      if (!hasBlank(example)) return match;

      const nextExplanation = combineExplanation(card.explanation, gloss);
      if (token === rawAnswer && nextExplanation === card.explanation) return match;

      changed = true;
      rewritten++;
      const next: CardBlock = {
        ...card,
        answer: token,
        explanation: nextExplanation,
      };
      return `<!-- grammar-card: ${JSON.stringify(next)} -->`;
    });

    if (changed && write) fs.writeFileSync(filePath, updated);
  }
}

console.log(`Scanned ${total} grammar-card blocks.`);
console.log(`${write ? 'Rewrote' : 'Would rewrite'} ${rewritten}.`);
console.log(`Flagged ${flags.length} for manual review.`);
if (flags.length) {
  console.log('');
  for (const flag of flags) {
    console.log(`  ${flag.file} — ${flag.reason}`);
    console.log(`    rule:    ${flag.rule}`);
    if (flag.example) console.log(`    example: ${flag.example}`);
    if (flag.answer) console.log(`    answer:  ${flag.answer}`);
  }
}
if (!write) console.log('\nRe-run with --write to apply.');
