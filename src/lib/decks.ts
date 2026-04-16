import { db } from '../db/schema';
import { addWord } from '../db/words';
import { wordExists } from '../db/words';

export interface DeckWord {
  word: string;
  reading: string;
  meaning: string;
  tags: string[];
}

export interface Deck {
  format: 'langlearn-deck';
  version: 1;
  name: string;
  language: string;
  exportedAt: string;
  words: DeckWord[];
}

export async function exportDeck(
  name: string,
  language: string,
  tag?: string
): Promise<string> {
  let words = await db.words.where('language').equals(language).toArray();

  if (tag) {
    words = words.filter((w) => w.tags.includes(tag));
  }

  const deck: Deck = {
    format: 'langlearn-deck',
    version: 1,
    name,
    language,
    exportedAt: new Date().toISOString(),
    words: words.map((w) => ({
      word: w.word,
      reading: w.reading,
      meaning: w.meaning,
      tags: w.tags,
    })),
  };

  return JSON.stringify(deck, null, 2);
}

export function parseDeck(json: string): Deck {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON: file is not valid JSON');
  }

  const d = data as Record<string, unknown>;

  if (d.format !== 'langlearn-deck') {
    throw new Error('Invalid deck format: missing or incorrect "format" field');
  }
  if (d.version !== 1) {
    throw new Error('Unsupported deck version: expected version 1');
  }
  if (typeof d.name !== 'string' || !d.name) {
    throw new Error('Invalid deck: missing "name" field');
  }
  if (typeof d.language !== 'string' || !d.language) {
    throw new Error('Invalid deck: missing "language" field');
  }
  if (!Array.isArray(d.words)) {
    throw new Error('Invalid deck: missing "words" array');
  }

  for (let i = 0; i < d.words.length; i++) {
    const w = d.words[i] as Record<string, unknown>;
    if (typeof w.word !== 'string') {
      throw new Error(`Invalid word at index ${i}: missing "word" field`);
    }
    if (typeof w.meaning !== 'string') {
      throw new Error(`Invalid word at index ${i}: missing "meaning" field`);
    }
  }

  return data as Deck;
}

export async function importDeck(
  deck: Deck
): Promise<{ added: number; skipped: number }> {
  let added = 0;
  let skipped = 0;

  for (const w of deck.words) {
    const exists = await wordExists(w.word, deck.language);
    if (exists) {
      skipped++;
      continue;
    }

    await addWord({
      word: w.word,
      reading: w.reading || '',
      meaning: w.meaning,
      language: deck.language,
      tags: w.tags || [],
      contextSentence: '',
      sourceTextId: null,
    });
    added++;
  }

  return { added, skipped };
}
