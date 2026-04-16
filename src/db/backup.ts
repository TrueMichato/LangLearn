import { db } from './schema';

export async function exportAllData(): Promise<string> {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    words: await db.words.toArray(),
    reviews: await db.reviews.toArray(),
    texts: await db.texts.toArray(),
    studySessions: await db.studySessions.toArray(),
    settings: await db.settings.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json);

  await db.transaction(
    'rw',
    [db.words, db.reviews, db.texts, db.studySessions, db.settings],
    async () => {
      await db.words.clear();
      await db.reviews.clear();
      await db.texts.clear();
      await db.studySessions.clear();
      await db.settings.clear();

      if (data.words?.length) await db.words.bulkAdd(data.words);
      if (data.reviews?.length) await db.reviews.bulkAdd(data.reviews);
      if (data.texts?.length) await db.texts.bulkAdd(data.texts);
      if (data.studySessions?.length) await db.studySessions.bulkAdd(data.studySessions);
      if (data.settings?.length) await db.settings.bulkAdd(data.settings);
    }
  );
}

export function downloadJson(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
