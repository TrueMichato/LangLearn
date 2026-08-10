/**
 * Propose `<!-- grammar-card: … -->` candidates for the lessons that have none.
 *
 * 223 of the 555 grammar lessons (all `ja` and `ru`) ship without SRS cards,
 * because the low-quality quiz-derived fallback that used to cover them was
 * removed — no cards beats bad cards. Authoring ~550 replacements by hand
 * means first finding, in each lesson, the sentences that can carry a card.
 *
 * This script *proposes only*. It never writes a card into a lesson. It mines
 * two shapes that the existing content already uses consistently:
 *
 *   T. A sentence with exactly one bold run, e.g. `Я вижу **студента**.`
 *      The bold is the author marking the form under discussion, so it is
 *      also exactly the token to blank. Highest confidence.
 *
 *   S. A bold sentence with a gloss, e.g.
 *      `- **Она читает газету.** *(…)* — She reads a newspaper.`
 *      Nothing marks a token here, so one is only accepted when the sentence
 *      contains a form that the surrounding section bolded elsewhere (its
 *      paradigm table). That intersection is what makes the blank meaningful
 *      rather than arbitrary.
 *
 * The `rule`/`hint`/`explanation` it emits are seeds carrying the section
 * heading and the gloss — they are the parts a human still has to write. The
 * content gate in `src/__tests__/grammar-cards-content.test.ts` rejects seeds
 * that were left unedited (a `rule` that merely echoes the lesson title).
 *
 * Usage:
 *   npx tsx scripts/extract-card-candidates.ts --lang ru --out candidates.json
 *   npx tsx scripts/extract-card-candidates.ts --lang ja --lesson tofugu-tara
 */

import fs from 'node:fs';
import path from 'node:path';

const CONTENT_ROOT = path.join('public', 'content', 'grammar');
const COMMENT_REGEX = /<!--[\s\S]*?-->/g;
const BLANK = '___';

/** Characters that only occur in the target language, used to reject English. */
const TARGET_SCRIPT: Record<string, RegExp> = {
  ru: /[\u0400-\u04FF]/,
  ja: /[\u3040-\u30FF\u4E00-\u9FFF]/,
};

/**
 * Whether the language separates words with spaces. Russian does, so a form
 * may only be blanked where it stands as a word (or as a word-final ending);
 * matching `со` inside `собакой` produces a nonsense card. Japanese does not,
 * so no such constraint can be applied there.
 */
const WORD_BOUNDARIES: Record<string, boolean> = { ru: true, ja: false };

const SENTENCE_END = /[.!?。？！]["»））]?$/;

export interface Candidate {
  lang: string;
  lessonId: string;
  lessonTitle: string;
  section: string;
  kind: 'T' | 'S';
  example: string;
  answer: string;
  gloss: string;
  source: string;
  score: number;
}

interface Section {
  heading: string;
  lines: string[];
}

/** Split a lesson into its `##` sections, keeping `###` headings as content. */
function splitSections(markdown: string): Section[] {
  const sections: Section[] = [];
  let current: Section = { heading: '', lines: [] };
  for (const line of markdown.split('\n')) {
    const top = /^##\s+(?!#)(.+)$/.exec(line);
    if (top) {
      if (current.lines.length > 0) sections.push(current);
      current = { heading: cleanHeading(top[1]), lines: [] };
      continue;
    }
    current.lines.push(line);
  }
  if (current.lines.length > 0) sections.push(current);
  return sections;
}

/** `## 3. Accusative Endings` → `Accusative Endings`. */
function cleanHeading(raw: string): string {
  return raw
    .replace(/\*\*/g, '')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/\s*\(.*\)\s*$/, '')
    .trim();
}

function stripInline(text: string): string {
  return text.replace(/\*\*/g, '').replace(/\*/g, '').trim();
}

/**
 * Remove ASCII-only parentheticals, which in this content are always
 * transliteration aids (`Я вижу стол. (Ya vizhu stol)`). Two reasons: they
 * would otherwise dominate the target-script density check, and leaving one in
 * an example leaks the pronunciation of the very token being blanked. Japanese
 * furigana — `安(やす)い` — is not ASCII, so it survives untouched.
 */
function stripTransliteration(text: string): string {
  return text
    .replace(/[（(][\x20-\x7E]*?[)）]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.!?。？！])/g, '$1')
    .trim();
}

/**
 * Every single-word form the section bolds, and how it was bolded. A form
 * bolded on its own (`**с** другом`) is a *word*; one bolded inside a word
 * (`нов**ого**`) is an *ending*. The distinction decides where the form may
 * legitimately be blanked later.
 */
type FormKind = 'word' | 'ending';

function sectionForms(lines: string[], script: RegExp): Map<string, FormKind> {
  const forms = new Map<string, FormKind>();
  const letter = /\p{L}/u;
  for (const line of lines) {
    for (const match of line.matchAll(/\*\*([^*]+)\*\*/g)) {
      const form = match[1].trim();
      if (!script.test(form)) continue;
      if (form.includes(' ') || form.length > 24) continue;
      if (SENTENCE_END.test(form)) continue;
      const before = line[match.index - 1] ?? '';
      const kind: FormKind = letter.test(before) ? 'ending' : 'word';
      // A form seen standing alone anywhere is treated as a word.
      if (forms.get(form) === 'word') continue;
      forms.set(form, kind);
    }
  }
  return forms;
}

/**
 * Where `form` may be blanked in `sentence`, or -1. A word must sit between
 * non-letters; an ending must terminate a word it does not constitute.
 */
function blankIndexFor(
  sentence: string,
  form: string,
  kind: FormKind,
  strict: boolean,
): number {
  const letter = /\p{L}/u;
  let from = 0;
  for (;;) {
    const index = sentence.indexOf(form, from);
    if (index < 0) return -1;
    from = index + 1;
    if (!strict) return index;
    const before = sentence[index - 1] ?? '';
    const after = sentence[index + form.length] ?? '';
    if (kind === 'word') {
      if (!letter.test(before) && !letter.test(after)) return index;
      continue;
    }
    // An ending: preceded by the stem, and nothing of the word after it.
    if (letter.test(before) && !letter.test(after) && form.length >= 2) return index;
  }
}

/**
 * A candidate's example must read as a target-language sentence — not a table
 * fragment, and not English prose that merely quotes a word. Requiring the
 * target script to dominate is what rejects lines like
 * `Also note: **いつも** without a negative means "always"!`.
 */
function usableSentence(text: string, script: RegExp): boolean {
  if (!script.test(text)) return false;
  if (!SENTENCE_END.test(text)) return false;
  const length = text.length;
  if (length < 8 || length > 90) return false;
  const dense = text.replace(/[\s\p{P}\p{S}]/gu, '');
  if (dense.length === 0) return false;
  const target = [...dense].filter((char) => script.test(char)).length;
  return target / dense.length >= 0.6;
}

function scoreCandidate(example: string, answer: string, gloss: string, kind: 'T' | 'S'): number {
  let score = kind === 'T' ? 10 : 6;
  if (gloss) score += 4;
  const length = example.length;
  if (length >= 14 && length <= 60) score += 3;
  if (answer.length <= 12) score += 2;
  if (answer.includes(' ')) score -= 2;
  return score;
}

const GLOSSED = /^\s*[-*]?\s*\*\*([^*]+)\*\*\s*(?:\*?\(([^)]*)\)\*?)?\s*[—–]\s*(.+?)\s*$/;

function candidatesFromSection(
  section: Section,
  meta: {
    lang: string;
    lessonId: string;
    lessonTitle: string;
    script: RegExp;
    strict: boolean;
  },
): Candidate[] {
  const { lang, lessonId, lessonTitle, script, strict } = meta;
  const forms = sectionForms(section.lines, script);
  const found: Candidate[] = [];

  for (const line of section.lines) {
    // Type S — a bold sentence with an English gloss after an em dash.
    const glossed = GLOSSED.exec(line);
    if (glossed) {
      const sentence = stripTransliteration(glossed[1].trim());
      const gloss = stripInline(glossed[3]);
      if (usableSentence(sentence, script)) {
        // Prefer the longest section form present: the most specific match.
        const ranked = [...forms.entries()].sort((a, b) => b[0].length - a[0].length);
        for (const [form, kind] of ranked) {
          const at = blankIndexFor(sentence, form, kind, strict);
          if (at < 0) continue;
          const example = `${sentence.slice(0, at)}${BLANK}${sentence.slice(at + form.length)}`;
          found.push({
            lang,
            lessonId,
            lessonTitle,
            section: section.heading,
            kind: 'S',
            example,
            answer: form,
            gloss,
            source: line.trim(),
            score: scoreCandidate(example, form, gloss, 'S'),
          });
          break;
        }
      }
      continue;
    }

    // Type T — a sentence whose single bold run marks the form being taught.
    // Lessons deliberately show incorrect Russian/Japanese next to a ❌ to warn
    // against it; mining those would teach the mistake, so skip the line.
    if (/[❌✗×]|\bWrong\b|\bIncorrect\b/i.test(line)) continue;
    const cells = line.includes('|') ? line.split('|') : [line];
    const rowGloss = line.includes('|') ? rowMeaning(cells) : '';
    for (const cell of cells) {
      const bolds = [...cell.matchAll(/\*\*([^*]+)\*\*/g)];
      if (bolds.length !== 1) continue;
      const token = bolds[0][1].trim();
      if (!script.test(token) || token.length > 24) continue;
      // A whole sentence in the bold run is a highlighted example, not a form.
      if (SENTENCE_END.test(token)) continue;
      const tidy = (text: string): string =>
        stripTransliteration(stripInline(text)).replace(/^[-*>]\s+/, '');
      const sentence = tidy(cell);
      if (!usableSentence(sentence, script)) continue;
      if (sentence === token) continue;
      // Blank at the bold run's own position. Searching for the token instead
      // finds its first occurrence anywhere, which for a one-letter form like
      // `**а**` lands inside an unrelated word (`чит[а]ю`).
      const at = bolds[0].index;
      const example = tidy(`${cell.slice(0, at)}${BLANK}${cell.slice(at + bolds[0][0].length)}`);
      if (!example.includes(BLANK)) continue;
      found.push({
        lang,
        lessonId,
        lessonTitle,
        section: section.heading,
        kind: 'T',
        example,
        answer: token,
        gloss: rowGloss,
        source: line.trim(),
        score: scoreCandidate(example, token, rowGloss, 'T'),
      });
    }
  }

  return found;
}

/** The last cell of a table row that is plain English is usually its meaning. */
function rowMeaning(cells: string[]): string {
  for (let index = cells.length - 1; index >= 0; index -= 1) {
    const text = stripInline(cells[index]);
    if (!text || text === '---') continue;
    if (/^[\x20-\x7E]+$/.test(text) && /[a-z]{3}/i.test(text)) return text;
  }
  return '';
}

/** Keep the best few, spread across sections and never repeating an answer. */
export function selectCandidates(all: Candidate[], limit = 3): Candidate[] {
  const ranked = [...all].sort((a, b) => b.score - a.score);
  const chosen: Candidate[] = [];
  const seenAnswers = new Set<string>();
  const seenExamples = new Set<string>();
  for (const pass of [1, 2]) {
    for (const candidate of ranked) {
      if (chosen.length >= limit) break;
      if (seenAnswers.has(candidate.answer)) continue;
      if (seenExamples.has(candidate.example)) continue;
      const sectionUsed = chosen.some((c) => c.section === candidate.section);
      if (pass === 1 && sectionUsed) continue;
      chosen.push(candidate);
      seenAnswers.add(candidate.answer);
      seenExamples.add(candidate.example);
    }
  }
  return chosen;
}

export function extractLesson(
  lang: string,
  lessonId: string,
  lessonTitle: string,
  markdown: string,
): Candidate[] {
  const script = TARGET_SCRIPT[lang];
  if (!script) return [];
  const body = markdown.replace(COMMENT_REGEX, '');
  const meta = { lang, lessonId, lessonTitle, script, strict: WORD_BOUNDARIES[lang] ?? false };
  return splitSections(body).flatMap((section) => candidatesFromSection(section, meta));
}

function readIndex(lang: string): Map<string, string> {
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
  const args = process.argv.slice(2);
  const flag = (name: string): string | undefined => {
    const index = args.indexOf(`--${name}`);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const langs = flag('lang')?.split(',') ?? ['ru', 'ja'];
  const only = flag('lesson');
  const limit = Number(flag('limit') ?? 3);
  const out = flag('out');

  const report: Record<string, Candidate[]> = {};
  let lessonsWith = 0;
  let lessonsWithout = 0;

  for (const lang of langs) {
    const dir = path.join(CONTENT_ROOT, lang);
    if (!fs.existsSync(dir)) continue;
    const titles = readIndex(lang);
    for (const file of fs.readdirSync(dir).sort()) {
      if (!file.endsWith('.md')) continue;
      const lessonId = file.replace(/\.md$/, '');
      if (only && lessonId !== only) continue;
      const markdown = fs.readFileSync(path.join(dir, file), 'utf8');
      if (markdown.includes('grammar-card:')) continue;
      const chosen = selectCandidates(
        extractLesson(lang, lessonId, titles.get(lessonId) ?? '', markdown),
        limit,
      );
      if (chosen.length === 0) {
        lessonsWithout += 1;
        continue;
      }
      lessonsWith += 1;
      report[`${lang}/${lessonId}`] = chosen;
    }
  }

  if (out) {
    fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${out}`);
  } else {
    for (const [key, list] of Object.entries(report)) {
      console.log(`\n## ${key}`);
      for (const candidate of list) {
        console.log(`  [${candidate.kind}${candidate.score}] ${candidate.section}`);
        console.log(`     example: ${candidate.example}`);
        console.log(`     answer : ${candidate.answer}`);
        if (candidate.gloss) console.log(`     gloss  : ${candidate.gloss}`);
      }
    }
  }

  const total = Object.values(report).reduce((sum, list) => sum + list.length, 0);
  console.log(
    `\n${total} candidates across ${lessonsWith} lessons; ${lessonsWithout} lessons yielded none.`,
  );
}

if (process.argv[1] && process.argv[1].endsWith('extract-card-candidates.ts')) {
  main();
}
