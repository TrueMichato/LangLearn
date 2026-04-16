import { db, type Text } from './schema';

export async function getAllTexts(language?: string): Promise<Text[]> {
  let collection = db.texts.orderBy('createdAt');
  if (language) {
    collection = db.texts.where('language').equals(language);
  }
  const texts = await collection.toArray();
  // Sort newest first (reverse chronological)
  return texts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteText(id: number): Promise<void> {
  await db.texts.delete(id);
}

export async function getTextCount(): Promise<number> {
  return db.texts.count();
}
