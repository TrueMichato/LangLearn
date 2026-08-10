/**
 * Insert authored `<!-- grammar-card: … -->` blocks into grammar lessons.
 *
 * `extract-card-candidates.ts` proposes raw material; a human turns each
 * proposal into a real card by writing the `rule`, `hint` and `explanation`
 * that the proposal cannot know. This script is the last step: it places the
 * finished block at the end of the section it belongs to — the convention the
 * already-covered languages follow — so the card sits with the material it
 * tests rather than in a pile at the end of the file.
 *
 * Every block is validated against the real card engine before anything is
 * written, so a malformed card fails here rather than in a learner's review
 * queue. Nothing is written unless the whole batch validates.
 *
 * Input is JSON keyed by `lang/lessonId`:
 *
 *   {
 *     "ru/comparatives": [
 *       { "section": "Irregular Comparatives", "rule": "…", "hint": "…",
 *         "example": "Москва ___ Петербурга.", "answer": "больше",
 *         "explanation": "…" }
 *     ]
 *   }
 *
 * Usage:
 *   npx tsx scripts/apply-grammar-cards.ts authored.json          # validate
 *   npx tsx scripts/apply-grammar-cards.ts authored.json --write  # apply
 */

import fs from 'node:fs';
import path from 'node:path';
import { fillBlank, hasBlank, parseAnswer } from '../src/lib/grammar-cards';

const CONTENT_ROOT = path.join('public', 'content', 'grammar');

interface AuthoredCard {
  section: string;
  rule: string;
  hint?: string;
  example: string;
  answer: string;
  explanation: string;
}

type Authored = Record<string, AuthoredCard[]>;

/** The card engine's contract, checked before the block reaches a lesson. */
function validate(card: AuthoredCard, lessonTitle: string): string[] {
  const problems: string[] = [];
  if (!card.rule?.trim()) problems.push('rule is empty');
  if (!card.explanation?.trim()) problems.push('explanation is empty');
  if (!card.example?.trim()) problems.push('example is empty');
  if (!card.answer?.trim()) problems.push('answer is empty');
  if (problems.length > 0) return problems;

  if (card.rule.trim().toLowerCase() === lessonTitle.trim().toLowerCase()) {
    problems.push('rule merely echoes the lesson title');
  }
  if (!hasBlank(card.example)) problems.push('example has no ___ blank');
  if (/[—–]/.test(card.answer)) problems.push('answer carries a gloss suffix');
  if (/[❌✗]/.test(`${card.example}${card.answer}`)) {
    problems.push('card is built from a ❌ counter-example');
  }

  const { token, gloss } = parseAnswer(card.answer, card.example);
  if (gloss) problems.push(`answer should be a bare token, got gloss "${gloss}"`);
  if (hasBlank(card.example)) {
    const filled = fillBlank(card.example, token);
    if (filled === card.example) problems.push('filling the blank does not change the prompt');
    if (hasBlank(filled)) problems.push('a blank survives filling');
  }
  if (/^correct answer/i.test(card.explanation)) {
    problems.push('explanation restates the answer instead of explaining it');
  }
  return problems;
}

function serialise(card: AuthoredCard): string {
  const payload: Record<string, string> = { rule: card.rule.trim() };
  if (card.hint?.trim()) payload.hint = card.hint.trim();
  payload.example = card.example.trim();
  payload.answer = card.answer.trim();
  payload.explanation = card.explanation.trim();
  return `<!-- grammar-card: ${JSON.stringify(payload)} -->`;
}

/**
 * The insertion point is the end of the section's prose: after its last
 * content line, but before the blank lines and `---` rule that separate it
 * from the next heading.
 */
function insertionPoint(lines: string[], section: string): number | null {
  const normalise = (text: string): string =>
    text
      .replace(/\*\*/g, '')
      .replace(/^\d+[.)]\s*/, '')
      .replace(/\s*\(.*\)\s*$/, '')
      .trim()
      .toLowerCase();

  let start = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const heading = /^##\s+(?!#)(.+)$/.exec(lines[index]);
    if (heading && normalise(heading[1]) === normalise(section)) {
      start = index;
      break;
    }
  }
  if (start < 0) return null;

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+(?!#)/.test(lines[index])) {
      end = index;
      break;
    }
  }
  while (end > start + 1) {
    const previous = lines[end - 1].trim();
    if (previous === '' || previous === '---' || previous === '***') {
      end -= 1;
      continue;
    }
    break;
  }
  return end;
}

function lessonTitles(lang: string): Map<string, string> {
  const file = path.join(CONTENT_ROOT, lang, 'index.json');
  const titles = new Map<string, string>();
  if (!fs.existsSync(file)) return titles;
  const parsed: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
  const lessons = Array.isArray(parsed)
    ? parsed
    : ((parsed as { lessons?: unknown[] }).lessons ?? []);
  for (const lesson of lessons as { id?: string; title?: string }[]) {
    if (lesson.id) titles.set(lesson.id, lesson.title ?? '');
  }
  return titles;
}

function main(): void {
  const [input, ...rest] = process.argv.slice(2);
  const write = rest.includes('--write');
  if (!input) {
    console.error('Usage: apply-grammar-cards.ts <authored.json> [--write]');
    process.exit(1);
  }

  const authored = JSON.parse(fs.readFileSync(input, 'utf8')) as Authored;
  const titleCache = new Map<string, Map<string, string>>();
  const failures: string[] = [];
  const edits: { file: string; contents: string; count: number }[] = [];

  for (const [key, cards] of Object.entries(authored)) {
    const [lang, lessonId] = key.split('/');
    const file = path.join(CONTENT_ROOT, lang, `${lessonId}.md`);
    if (!fs.existsSync(file)) {
      failures.push(`${key}: no such lesson`);
      continue;
    }
    if (!titleCache.has(lang)) titleCache.set(lang, lessonTitles(lang));
    const title = titleCache.get(lang)?.get(lessonId) ?? '';

    const lines = fs.readFileSync(file, 'utf8').split('\n');
    // Insert from the bottom up so earlier indices stay valid.
    const placements: { at: number; block: string }[] = [];
    for (const card of cards) {
      const problems = validate(card, title);
      if (problems.length > 0) {
        failures.push(`${key} [${card.section}]: ${problems.join('; ')}`);
        continue;
      }
      const at = insertionPoint(lines, card.section);
      if (at === null) {
        failures.push(`${key}: no section titled "${card.section}"`);
        continue;
      }
      placements.push({ at, block: serialise(card) });
    }
    placements.sort((a, b) => b.at - a.at);
    for (const placement of placements) {
      lines.splice(placement.at, 0, '', placement.block);
    }
    if (placements.length > 0) {
      edits.push({ file, contents: lines.join('\n'), count: placements.length });
    }
  }

  for (const failure of failures) console.error(`✗ ${failure}`);
  if (failures.length > 0) {
    console.error(`\n${failures.length} card(s) rejected — nothing written.`);
    process.exit(1);
  }

  const total = edits.reduce((sum, edit) => sum + edit.count, 0);
  if (write) {
    for (const edit of edits) fs.writeFileSync(edit.file, edit.contents, 'utf8');
    console.log(`Wrote ${total} cards across ${edits.length} lessons.`);
  } else {
    console.log(`${total} cards across ${edits.length} lessons validate. Re-run with --write.`);
  }
}

main();
