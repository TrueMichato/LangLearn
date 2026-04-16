import { db, type CharacterProgress } from './schema';

export async function getCharacterProgress(language: string): Promise<CharacterProgress[]> {
  return db.characterProgress.where('language').equals(language).toArray();
}

export async function updateCharacterProgress(
  id: string,
  language: string,
  character: string,
  romanji: string,
  correct: boolean,
): Promise<void> {
  const existing = await db.characterProgress.get(id);
  if (existing) {
    const correctCount = existing.correctCount + (correct ? 1 : 0);
    const totalAttempts = existing.totalAttempts + 1;
    const accuracy = correctCount / totalAttempts;
    const mastery = totalAttempts >= 5 && accuracy >= 0.8 ? 'mastered' : 'learning';
    await db.characterProgress.put({
      ...existing,
      correctCount,
      totalAttempts,
      lastPracticed: new Date().toISOString(),
      mastery,
    });
  } else {
    await db.characterProgress.put({
      id,
      language,
      character,
      romanji,
      correctCount: correct ? 1 : 0,
      totalAttempts: 1,
      lastPracticed: new Date().toISOString(),
      mastery: 'new',
    });
  }
}
