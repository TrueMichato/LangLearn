export interface DiffSegment {
  text: string;
  status: 'correct' | 'incorrect' | 'missing';
}

export interface DiffResult {
  score: number; // 0-100 percentage
  segments: DiffSegment[];
}

/**
 * Compute the longest common subsequence length table.
 */
function lcsTable(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

/**
 * Backtrack through the LCS table to produce diff segments.
 */
function buildSegments(
  user: string[],
  ref: string[],
  dp: number[][],
  joiner: string,
): DiffSegment[] {
  const segments: DiffSegment[] = [];
  let i = user.length;
  let j = ref.length;

  // Collect operations in reverse then flip
  const ops: DiffSegment[] = [];

  while (i > 0 && j > 0) {
    if (user[i - 1] === ref[j - 1]) {
      ops.push({ text: ref[j - 1], status: 'correct' });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      ops.push({ text: user[i - 1], status: 'incorrect' });
      i--;
    } else {
      ops.push({ text: ref[j - 1], status: 'missing' });
      j--;
    }
  }
  while (i > 0) {
    ops.push({ text: user[i - 1], status: 'incorrect' });
    i--;
  }
  while (j > 0) {
    ops.push({ text: ref[j - 1], status: 'missing' });
    j--;
  }

  ops.reverse();

  // Merge consecutive segments of the same status
  for (const op of ops) {
    const last = segments[segments.length - 1];
    if (last && last.status === op.status) {
      last.text += joiner + op.text;
    } else {
      segments.push({ ...op });
    }
  }

  return segments;
}

function normalizeJapanese(text: string): string {
  // Remove spaces, convert half-width kana to full-width
  return text
    .replace(/\s+/g, '')
    .normalize('NFKC');
}

function normalizeRussian(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ');
}

export function compareTexts(userInput: string, reference: string, language: string): DiffResult {
  if (language === 'ja') {
    return compareCharLevel(userInput, reference);
  }
  return compareWordLevel(userInput, reference);
}

function compareCharLevel(userInput: string, reference: string): DiffResult {
  const userChars = [...normalizeJapanese(userInput)];
  const refChars = [...normalizeJapanese(reference)];

  if (refChars.length === 0) {
    return { score: userChars.length === 0 ? 100 : 0, segments: [] };
  }

  const dp = lcsTable(userChars, refChars);
  const segments = buildSegments(userChars, refChars, dp, '');
  const correctCount = dp[userChars.length][refChars.length];
  const score = Math.round((correctCount / refChars.length) * 100);

  return { score, segments };
}

function compareWordLevel(userInput: string, reference: string): DiffResult {
  const userWords = normalizeRussian(userInput).split(' ').filter(Boolean);
  const refWords = normalizeRussian(reference).split(' ').filter(Boolean);

  if (refWords.length === 0) {
    return { score: userWords.length === 0 ? 100 : 0, segments: [] };
  }

  const dp = lcsTable(userWords, refWords);
  const segments = buildSegments(userWords, refWords, dp, ' ');
  const correctCount = dp[userWords.length][refWords.length];
  const score = Math.round((correctCount / refWords.length) * 100);

  return { score, segments };
}
