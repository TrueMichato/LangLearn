import fs from 'fs';
import path from 'path';

const dir = 'public/content/grammar/ja';
const hasJP = (s) => /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(s);

function extractExamples(markdown) {
  const examples = [];
  const lines = markdown.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    if (!trimmed.startsWith('- ')) continue;
    const text = trimmed.slice(2).trim();
    if (!hasJP(text)) continue;

    // Find next non-empty line
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    if (j >= lines.length) continue;

    const nextTrimmed = lines[j].trimStart();
    if (!nextTrimmed.startsWith('- ')) continue;
    const enText = nextTrimmed.slice(2).trim();
    if (hasJP(enText) || enText.length < 4 || enText.startsWith('*') || enText.startsWith('(')) continue;

    examples.push({ japanese: text, english: enText });
    i = j;
  }
  return examples;
}

function makeQuizzes(examples) {
  const quizzes = [];
  const selected = examples.slice(0, Math.min(3, examples.length));
  for (const ex of selected) {
    const distractors = examples
      .filter(e => e.english !== ex.english)
      .map(e => e.english)
      .slice(0, 3);
    const fallbacks = [
      'This sentence is grammatically incorrect',
      'This is a polite expression',
      'This describes a past action',
    ];
    while (distractors.length < 3) distractors.push(fallbacks[distractors.length]);
    quizzes.push({
      type: 'multiple-choice',
      question: `What does "${ex.japanese}" mean?`,
      options: [ex.english, ...distractors.slice(0, 3)],
      answer: 0,
    });
  }
  return quizzes;
}

const files = fs.readdirSync(dir).filter(f => f.startsWith('tofugu-') && f.endsWith('.md'));
let totalQuizzes = 0;
let totalExamples = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Remove old quiz blocks
  const quizRe = /\n*<!-- quiz: .*? -->/g;
  content = content.replace(quizRe, '');

  // Remove old Sources section (find last ## Sources)
  const sourcesIdx = content.lastIndexOf('\n## Sources');
  if (sourcesIdx !== -1) content = content.slice(0, sourcesIdx);

  content = content.trimEnd();

  const examples = extractExamples(content);
  totalExamples += examples.length;

  const quizzes = makeQuizzes(examples);
  totalQuizzes += quizzes.length;

  // Append quizzes
  for (const q of quizzes) {
    content += '\n\n<!-- quiz: ' + JSON.stringify(q) + ' -->';
  }

  // Append sources
  const slug = file.replace('tofugu-', '').replace('.md', '');
  content += `\n\n## Sources\n\n- [Tofugu](https://www.tofugu.com/japanese-grammar/${slug}/)\n`;

  fs.writeFileSync(filePath, content, 'utf-8');
}

console.log(`Updated ${files.length} files: ${totalExamples} examples, ${totalQuizzes} quizzes`);
