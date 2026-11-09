import { db, type SkillProgress } from './schema';

export async function loadSkillProgress(language: string, activity: SkillProgress['activity']) {
  return db.skillProgress.where('[language+activity]').equals([language, activity]).toArray();
}

export async function recordSkillAnswer(
  language: string, activity: SkillProgress['activity'], skill: string, correct: boolean,
) {
  const id = `${language}/${activity}/${skill}`;
  await db.transaction('rw', db.skillProgress, async () => {
    const previous = await db.skillProgress.get(id);
    await db.skillProgress.put({
      id, language, activity, skill,
      attempts: (previous?.attempts ?? 0) + 1,
      correct: (previous?.correct ?? 0) + Number(correct),
    });
  });
}
