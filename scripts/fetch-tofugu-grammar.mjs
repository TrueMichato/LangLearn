#!/usr/bin/env node
/**
 * Tofugu Grammar Lesson Converter
 * 
 * Fetches Tofugu grammar articles and converts them to LangLearn's
 * markdown + quiz format. Content sourced from tofugu.com for personal use.
 * 
 * Usage: node scripts/fetch-tofugu-grammar.mjs
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GRAMMAR_DIR = join(__dirname, '..', 'public', 'content', 'grammar', 'ja');

// All Tofugu grammar point URLs with metadata
const TOFUGU_GRAMMAR_POINTS = [
  // === Particles ===
  { slug: 'particle-wa', title: 'は (wa) — Topic Marker', group: 'Particles', order: 36 },
  { slug: 'particle-ga', title: 'が (ga) — Subject Marker', group: 'Particles', order: 37 },
  { slug: 'particle-wo', title: 'を (wo) — Object Marker', group: 'Particles', order: 38 },
  { slug: 'particle-ni', title: 'に (ni) — Target / Location / Time', group: 'Particles', order: 39 },
  { slug: 'particle-de', title: 'で (de) — Location of Action / Means', group: 'Particles', order: 40 },
  { slug: 'particle-he', title: 'へ (he) — Direction', group: 'Particles', order: 41 },
  { slug: 'particle-to', title: 'と (to) — And / With / Quotation', group: 'Particles', order: 42 },
  { slug: 'particle-mo', title: 'も (mo) — Also / Too', group: 'Particles', order: 43 },
  { slug: 'particle-ka', title: 'か (ka) — Question Marker', group: 'Particles', order: 44 },
  { slug: 'particle-ne', title: 'ね (ne) — Confirmation / Agreement', group: 'Particles', order: 45 },
  { slug: 'particle-yo', title: 'よ (yo) — Emphasis / New Info', group: 'Particles', order: 46 },
  { slug: 'particle-yone', title: 'よね (yone) — Seeking Agreement', group: 'Particles', order: 47 },
  { slug: 'particle-ya', title: 'や (ya) — Non-exhaustive Listing', group: 'Particles', order: 48 },
  { slug: 'particle-no-noun-modifier', title: 'の (no) — Noun Modifier', group: 'Particles', order: 49 },
  { slug: 'particle-no-nominalizer', title: 'の (no) — Nominalizer', group: 'Particles', order: 50 },
  { slug: 'particle-kara', title: 'から (kara) — From / Because', group: 'Particles', order: 51 },
  { slug: 'particle-made', title: 'まで (made) — Until / Up To', group: 'Particles', order: 52 },
  { slug: 'particle-yori-than', title: 'より (yori) — Than (Comparison)', group: 'Particles', order: 53 },
  { slug: 'particle-yori-from', title: 'より (yori) — From (Formal)', group: 'Particles', order: 54 },
  // === Copula & Existence ===
  { slug: 'desu', title: 'です (desu) — Polite Copula', group: 'Copula & Existence', order: 55 },
  { slug: 'da', title: 'だ (da) — Plain Copula', group: 'Copula & Existence', order: 56 },
  { slug: 'janai-dewanai', title: 'じゃない / ではない — Negative Copula', group: 'Copula & Existence', order: 57 },
  { slug: 'datta', title: 'だった (datta) — Past Copula (Plain)', group: 'Copula & Existence', order: 58 },
  { slug: 'deshita', title: 'でした (deshita) — Past Copula (Polite)', group: 'Copula & Existence', order: 59 },
  { slug: 'iru-aru', title: 'いる vs ある — Existence Verbs', group: 'Copula & Existence', order: 60 },
  { slug: 'iku-kuru', title: '行く vs 来る — Go and Come', group: 'Copula & Existence', order: 61 },
  // === Verb Forms ===
  { slug: 'verb-plain-present-form', title: 'Plain Present Form (Dictionary Form)', group: 'Verb Forms', order: 62 },
  { slug: 'masu', title: 'ます (masu) — Polite Form', group: 'Verb Forms', order: 63 },
  { slug: 'te-form', title: 'て-Form — Connecting / Requesting', group: 'Verb Forms', order: 64 },
  { slug: 'verb-past-ta-form', title: 'た-Form — Past Tense', group: 'Verb Forms', order: 65 },
  { slug: 'verb-negative-nai-form', title: 'ない-Form — Negative', group: 'Verb Forms', order: 66 },
  { slug: 'verb-negative-past-nakatta-form', title: 'なかった — Negative Past', group: 'Verb Forms', order: 67 },
  { slug: 'verb-conditional-form-ba', title: 'ば-Form — Conditional', group: 'Verb Forms', order: 68 },
  { slug: 'verb-potential-form-reru', title: 'れる / られる — Potential', group: 'Verb Forms', order: 69 },
  { slug: 'verb-passive-form-rareru', title: 'られる — Passive', group: 'Verb Forms', order: 70 },
  { slug: 'verb-causative-form-saseru', title: 'させる — Causative', group: 'Verb Forms', order: 71 },
  { slug: 'verb-volitional-form-you', title: 'よう — Volitional ("Let\'s")', group: 'Verb Forms', order: 72 },
  { slug: 'verb-command-form-ro', title: 'ろ / れ — Command Form', group: 'Verb Forms', order: 73 },
  { slug: 'verb-imperative-form-nasai', title: 'なさい — Imperative (Polite)', group: 'Verb Forms', order: 74 },
  { slug: 'verb-continuous-form-teiru', title: 'ている — Continuous / State', group: 'Verb Forms', order: 75 },
  { slug: 'verb-past-continuous-form-teita', title: 'ていた — Past Continuous', group: 'Verb Forms', order: 76 },
  { slug: 'verb-stem-form-conjugation', title: 'Verb Stem Form', group: 'Verb Forms', order: 77 },
  { slug: 'verb-sou', title: '〜そう — Looks Like (Verb)', group: 'Verb Forms', order: 78 },
  { slug: 'verb-to', title: 'と — Conditional (Natural Consequence)', group: 'Verb Forms', order: 79 },
  { slug: 'verb-nagara', title: 'ながら — While Doing', group: 'Verb Forms', order: 80 },
  { slug: 'suru', title: 'する — To Do (Irregular)', group: 'Verb Forms', order: 81 },
  // === て-Form Patterns ===
  { slug: 'tearu', title: 'てある — Resulting State', group: 'て-Form Patterns', order: 82 },
  { slug: 'teiku-tekuru', title: 'ていく / てくる — Coming & Going', group: 'て-Form Patterns', order: 83 },
  { slug: 'temiru', title: 'てみる — Try Doing', group: 'て-Form Patterns', order: 84 },
  { slug: 'temoii', title: 'てもいい — Permission ("May I?")', group: 'て-Form Patterns', order: 85 },
  { slug: 'teoku', title: 'ておく — Prepare in Advance', group: 'て-Form Patterns', order: 86 },
  { slug: 'tehoshii', title: 'てほしい — Want Someone to Do', group: 'て-Form Patterns', order: 87 },
  // === Adjective Forms ===
  { slug: 'i-adjective', title: 'い-Adjectives — Overview', group: 'Adjective Forms', order: 88 },
  { slug: 'i-adjective-ku-form', title: 'い-Adjective く-Form', group: 'Adjective Forms', order: 89 },
  { slug: 'i-adjective-ku-form-adverb', title: 'い → く Adverb Form', group: 'Adjective Forms', order: 90 },
  { slug: 'i-adjective-ku-form-linking', title: 'い → くて Linking Form', group: 'Adjective Forms', order: 91 },
  { slug: 'i-adjective-ku-form-noun', title: 'い → く + Noun Form', group: 'Adjective Forms', order: 92 },
  { slug: 'i-adjective-negative-form-kunai', title: 'い → くない Negative', group: 'Adjective Forms', order: 93 },
  { slug: 'i-adjective-past-form-katta', title: 'い → かった Past', group: 'Adjective Forms', order: 94 },
  { slug: 'i-adjective-garu', title: 'い-Adjective + がる', group: 'Adjective Forms', order: 95 },
  { slug: 'i-adjective-conditional-form-kereba', title: 'い → ければ Conditional', group: 'Adjective Forms', order: 96 },
  // === Ko-So-A-Do Words ===
  { slug: 'kore-sore-are-dore', title: 'これ・それ・あれ・どれ', group: 'Ko-So-A-Do Words', order: 97 },
  { slug: 'kono-sono-ano-dono', title: 'この・その・あの・どの', group: 'Ko-So-A-Do Words', order: 98 },
  { slug: 'koko-soko-asoko-doko', title: 'ここ・そこ・あそこ・どこ', group: 'Ko-So-A-Do Words', order: 99 },
  { slug: 'kochira-sochira-achira-dochira', title: 'こちら・そちら・あちら・どちら', group: 'Ko-So-A-Do Words', order: 100 },
  { slug: 'konna-sonna-anna-donna', title: 'こんな・そんな・あんな・どんな', group: 'Ko-So-A-Do Words', order: 101 },
  { slug: 'kou-sou-aa-dou', title: 'こう・そう・ああ・どう', group: 'Ko-So-A-Do Words', order: 102 },
  { slug: 'koitsu-soitsu-aitsu-doitsu', title: 'こいつ・そいつ・あいつ・どいつ', group: 'Ko-So-A-Do Words', order: 103 },
  { slug: 'konata-sonata-anata-donata', title: 'こなた・そなた・あなた・どなた', group: 'Ko-So-A-Do Words', order: 104 },
  // === Uncertainty & Conjecture ===
  { slug: 'darou', title: 'だろう — Probably (Plain)', group: 'Uncertainty & Conjecture', order: 105 },
  { slug: 'deshou', title: 'でしょう — Probably (Polite)', group: 'Uncertainty & Conjecture', order: 106 },
  { slug: 'kamoshirenai', title: 'かもしれない — Might / Maybe', group: 'Uncertainty & Conjecture', order: 107 },
  { slug: 'kurai', title: 'くらい / ぐらい — About / Approximately', group: 'Uncertainty & Conjecture', order: 108 },
  { slug: 'adjective-sou', title: '〜そう — Looks Like / Seems', group: 'Uncertainty & Conjecture', order: 109 },
  // === Conjunctive ===
  { slug: 'conjunctive-particle-ga-kedo', title: 'が / けど — But / However', group: 'Conjunctive', order: 110 },
  { slug: 'conjunctive-particle-node', title: 'ので — Because (Soft)', group: 'Conjunctive', order: 111 },
  { slug: 'conjunctive-particle-noni', title: 'のに — Even Though / Despite', group: 'Conjunctive', order: 112 },
  { slug: 'shi', title: 'し — And What\'s More', group: 'Conjunctive', order: 113 },
  { slug: 'nagara', title: 'ながら — While', group: 'Conjunctive', order: 114 },
  // === Conditionals ===
  { slug: 'conditional-form-tara', title: 'たら — If / When (Conditional)', group: 'Conditionals', order: 115 },
  { slug: 'conditional-form-nara', title: 'なら — If (Contextual)', group: 'Conditionals', order: 116 },
  // === Grammar Patterns ===
  { slug: 'tai-form', title: '〜たい — Want to Do', group: 'Grammar Patterns', order: 117 },
  { slug: 'tagaru-form', title: '〜たがる — Wants to (3rd Person)', group: 'Grammar Patterns', order: 118 },
  { slug: 'naru', title: 'なる — To Become', group: 'Grammar Patterns', order: 119 },
  { slug: 'sugiru', title: '〜すぎる — Too Much', group: 'Grammar Patterns', order: 120 },
  { slug: 'nikui', title: '〜にくい — Hard to Do', group: 'Grammar Patterns', order: 121 },
  { slug: 'yasui', title: '〜やすい — Easy to Do', group: 'Grammar Patterns', order: 122 },
  { slug: 'koto', title: 'こと — Nominalizer', group: 'Grammar Patterns', order: 123 },
  { slug: 'kotogaaru', title: 'ことがある — Sometimes', group: 'Grammar Patterns', order: 124 },
  { slug: 'takotogaaru', title: 'たことがある — Have Done Before', group: 'Grammar Patterns', order: 125 },
  { slug: 'toiu', title: 'という — Called / Known As', group: 'Grammar Patterns', order: 126 },
  { slug: 'tsumori', title: 'つもり — Intend To', group: 'Grammar Patterns', order: 127 },
  { slug: 'tarisuru', title: 'たりする — Do Things Like', group: 'Grammar Patterns', order: 128 },
  { slug: 'toki', title: 'とき — When / At the Time', group: 'Grammar Patterns', order: 129 },
  // === Pronouns ===
  { slug: 'first-person-pronouns', title: 'First Person Pronouns (I / We)', group: 'Pronouns', order: 130 },
  { slug: 'second-person-pronouns', title: 'Second Person Pronouns (You)', group: 'Pronouns', order: 131 },
  { slug: 'third-person-pronouns', title: 'Third Person Pronouns (He/She/They)', group: 'Pronouns', order: 132 },
  { slug: 'jibun', title: '自分 (jibun) — Self / Oneself', group: 'Pronouns', order: 133 },
  { slug: 'question-words', title: 'Question Words (誰, 何, どこ, etc.)', group: 'Pronouns', order: 134 },
  // === Other Grammar ===
  { slug: 'explanatory-nda-ndesu-noda-nodesu', title: 'んです / のです — Explanatory', group: 'Other Grammar', order: 135 },
  { slug: 'kudasai', title: 'ください — Please', group: 'Other Grammar', order: 136 },
  { slug: 'kureru-ageru-morau', title: 'くれる・あげる・もらう — Giving/Receiving', group: 'Other Grammar', order: 137 },
  { slug: 'honorific-prefix-o-go', title: 'お〜 / ご〜 — Honorific Prefixes', group: 'Other Grammar', order: 138 },
  { slug: 'mada', title: 'まだ — Still / Not Yet', group: 'Other Grammar', order: 139 },
  { slug: 'mou-already-not-anymore', title: 'もう — Already / Not Anymore', group: 'Other Grammar', order: 140 },
  { slug: 'mou-little-more', title: 'もう — A Little More', group: 'Other Grammar', order: 141 },
  { slug: 'sentence-ending-particle-wa', title: 'わ — Sentence-Ending (Feminine)', group: 'Other Grammar', order: 142 },
  { slug: 'adjective-suffix-sa', title: '〜さ — Adjective → Noun (Degree)', group: 'Other Grammar', order: 143 },
  { slug: 'adjective-suffix-mi', title: '〜み — Adjective → Noun (Quality)', group: 'Other Grammar', order: 144 },
  { slug: 'na', title: 'な — Prohibition', group: 'Other Grammar', order: 145 },
  { slug: 'dake', title: 'だけ — Only / Just', group: 'Other Grammar', order: 146 },
  { slug: 'chuu', title: '中 (ちゅう) — In the Middle of', group: 'Other Grammar', order: 147 },
  { slug: 'juu', title: '中 (じゅう) — Throughout / All Over', group: 'Other Grammar', order: 148 },
  { slug: 'uchi', title: 'うちに — While / Before It\'s Too Late', group: 'Other Grammar', order: 149 },
  { slug: 'naka', title: '中 (なか) — Inside / Among', group: 'Other Grammar', order: 150 },
  { slug: 'mae-ushiro', title: '前・後ろ — Front / Behind', group: 'Other Grammar', order: 151 },
  { slug: 'amarinai', title: 'あまり〜ない — Not Very / Not Much', group: 'Other Grammar', order: 152 },
  { slug: 'sasuga', title: 'さすが — As Expected', group: 'Other Grammar', order: 153 },
  { slug: 'plural-suffix', title: 'Plural Suffixes (〜たち, 〜ら)', group: 'Other Grammar', order: 154 },
];

function htmlToMarkdown(html) {
  let text = html;

  // Remove script/style/nav/header/footer
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<header[^>]*class=['"]header[^>]*>[\s\S]*?<\/header>/gi, '');
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');

  // Try to extract article content
  const bodyMatch = text.match(/<div class=['"]?article-body['"]?[^>]*>([\s\S]*?)<\/div>\s*<div class=['"]?article-footnotes/i)
    || text.match(/<div class=['"]?article-body['"]?[^>]*>([\s\S]*)/i);
  if (bodyMatch) text = bodyMatch[1];

  // Headers
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n');
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
  text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n');

  // Bold/italic
  text = text.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  text = text.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**');
  text = text.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');

  // Lists
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
  text = text.replace(/<\/?[uo]l[^>]*>/gi, '\n');

  // Paragraphs
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<hr\s*\/?>/gi, '\n---\n');

  // Blockquotes
  text = text.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
    return content.split('\n').map(l => '> ' + l.trim()).join('\n');
  });

  // Links - keep text
  text = text.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1');

  // Images/figures - skip
  text = text.replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '');
  text = text.replace(/<img[^>]*>/gi, '');
  text = text.replace(/<figcaption[^>]*>[\s\S]*?<\/figcaption>/gi, '');

  // Ruby (furigana)
  text = text.replace(/<ruby[^>]*>([\s\S]*?)<rp[^>]*>[\s\S]*?<\/rp>\s*<rt[^>]*>([\s\S]*?)<\/rt>\s*<rp[^>]*>[\s\S]*?<\/rp>\s*<\/ruby>/gi, '$1($2)');
  text = text.replace(/<ruby[^>]*>([\s\S]*?)<rt[^>]*>([\s\S]*?)<\/rt><\/ruby>/gi, '$1($2)');

  // Table of contents - remove
  text = text.replace(/## Table of Contents[\s\S]*?(?=\n## )/i, '');

  // Remove remaining HTML
  text = text.replace(/<[^>]+>/g, '');

  // Decode entities
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
  text = text.replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));

  // Clean whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();

  return text;
}

function extractExampleSentences(markdown) {
  const examples = [];
  const lines = markdown.split('\n');
  const hasJP = (s) => /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(s);
  const listItemRe = /^\s*-\s+/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    if (listItemRe.test(line) && hasJP(line)) {
      const jpText = line.replace(listItemRe, '').trim();
      // Skip ahead past blank lines to find the English translation
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j++;
      if (j < lines.length) {
        const nextLine = lines[j].trimEnd();
        if (listItemRe.test(nextLine) && !hasJP(nextLine)) {
          const enText = nextLine.replace(listItemRe, '').trim();
          if (enText.length > 3 && !enText.startsWith('*')) {
            examples.push({ japanese: jpText, english: enText });
          }
          i = j;
        }
      }
    }
  }
  return examples;
}

function generateQuizzes(title, examples, slug) {
  const quizzes = [];
  if (examples.length === 0) return quizzes;

  const selected = examples.slice(0, Math.min(3, examples.length));
  for (const ex of selected) {
    const distractors = examples
      .filter(e => e.english !== ex.english)
      .map(e => e.english)
      .slice(0, 3);
    const fallbacks = ['This sentence is grammatically incorrect', 'This is a polite expression', 'This describes a past action'];
    while (distractors.length < 3) {
      distractors.push(fallbacks[distractors.length] || 'None of the above');
    }
    quizzes.push({
      type: 'multiple-choice',
      question: `What does "${ex.japanese}" mean?`,
      options: [ex.english, ...distractors.slice(0, 3)],
      answer: 0,
    });
  }
  return quizzes;
}

async function fetchPage(slug) {
  const url = `https://www.tofugu.com/japanese-grammar/${slug}/`;
  try {
    const res = await fetch(url);
    if (!res.ok) { console.error(`  ❌ ${slug}: HTTP ${res.status}`); return null; }
    return await res.text();
  } catch (e) {
    console.error(`  ❌ ${slug}: ${e.message}`);
    return null;
  }
}

async function processGrammarPoint(point) {
  const filePath = join(GRAMMAR_DIR, `tofugu-${point.slug}.md`);
  if (existsSync(filePath)) {
    console.log(`  ⏭️  ${point.slug} (exists)`);
    return point;
  }

  const html = await fetchPage(point.slug);
  if (!html) return null;

  const markdown = htmlToMarkdown(html);
  const examples = extractExampleSentences(markdown);
  const quizzes = generateQuizzes(point.title, examples, point.slug);

  let md = `# ${point.title}\n\n`;
  md += `> **Source:** Content from [Tofugu](https://www.tofugu.com/japanese-grammar/${point.slug}/). For personal study.\n\n`;
  md += markdown + '\n\n';
  for (const q of quizzes) md += `\n<!-- quiz: ${JSON.stringify(q)} -->\n`;
  md += '\n## Sources\n\n';
  md += `- [Tofugu: ${point.title}](https://www.tofugu.com/japanese-grammar/${point.slug}/)\n`;

  writeFileSync(filePath, md, 'utf-8');
  console.log(`  ✅ ${point.slug} (${examples.length} examples, ${quizzes.length} quizzes)`);
  return point;
}

async function updateIndex(processed) {
  const indexPath = join(GRAMMAR_DIR, 'index.json');
  let existing = [];
  if (existsSync(indexPath)) existing = JSON.parse(readFileSync(indexPath, 'utf-8'));

  for (const p of processed) {
    if (!p) continue;
    const id = `tofugu-${p.slug}`;
    if (!existing.find(e => e.id === id)) {
      existing.push({ id, title: p.title, order: p.order, group: p.group, source: 'tofugu' });
    }
  }
  existing.sort((a, b) => a.order - b.order);
  writeFileSync(indexPath, JSON.stringify(existing, null, 2), 'utf-8');
  console.log(`\n📋 index.json: ${existing.length} total lessons`);
}

async function main() {
  console.log('🌸 Tofugu Grammar Lesson Converter');
  console.log(`📝 ${TOFUGU_GRAMMAR_POINTS.length} grammar points\n`);

  const BATCH = 5;
  const results = [];
  for (let i = 0; i < TOFUGU_GRAMMAR_POINTS.length; i += BATCH) {
    const batch = TOFUGU_GRAMMAR_POINTS.slice(i, i + BATCH);
    console.log(`\n--- Batch ${Math.floor(i/BATCH)+1}/${Math.ceil(TOFUGU_GRAMMAR_POINTS.length/BATCH)} ---`);
    const r = await Promise.all(batch.map(p => processGrammarPoint(p)));
    results.push(...r);
    if (i + BATCH < TOFUGU_GRAMMAR_POINTS.length) await new Promise(r => setTimeout(r, 500));
  }

  await updateIndex(results.filter(Boolean));
  console.log('\n✨ Done!');
}

main().catch(console.error);
