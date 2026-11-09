import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));

/** Only authored word fields, never readings, example prose, or exercises. */
export async function collectLessonTargets() {
  const result = {};
  const directory = path.join(root, 'public/content/vocab');
  for (const language of (await readdir(directory)).sort()) {
    const index = JSON.parse(await readFile(path.join(directory, language, 'index.json'), 'utf8'));
    result[language] = {};
    for (const { id } of index) {
      const lesson = JSON.parse(await readFile(path.join(directory, language, `${id}.json`), 'utf8'));
      // Progress uses the index/file ID; several legacy Japanese bodies have
      // prefixed internal IDs (e.g. ja-vocab-verbs) that are not progress IDs.
      if (!Array.isArray(lesson.words) ||
        lesson.words.some((word) => typeof word.word !== 'string' || !word.word.trim())) {
        throw new Error(`Invalid vocabulary targets: ${language}/${id}`);
      }
      result[language][id] = [...new Set(lesson.words.map((word) => word.word))];
    }
  }
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await writeFile(path.join(root, 'src/data/lesson-targets.json'),
    `${JSON.stringify(await collectLessonTargets())}\n`);
}
