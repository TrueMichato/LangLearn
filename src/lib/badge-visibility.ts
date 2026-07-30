import { BADGES, type BadgeDefinition } from '../data/badges';

/**
 * Which badges a given learner is actually playing for.
 *
 * Roughly a third of the catalogue is language-locked — Portuguese letter
 * badges, per-language vocabulary tiers, proficiency tests. Counting those
 * against someone studying Japanese and Russian turns a full set into a
 * permanent 74%, which is exactly the quiet punishment this app refuses.
 *
 * Already-earned badges always stay visible, so dropping a language never
 * deletes something you did.
 *
 * This lives here rather than inside BadgeCollection because three surfaces
 * now report a badge count — the collection itself, the Achievements summary,
 * and the Dashboard link — and they must never disagree.
 */
export function visibleBadges(
  activeLanguages: string[],
  unlockedBadges: Record<string, unknown>,
): BadgeDefinition[] {
  const active = new Set(activeLanguages);
  return BADGES.filter(
    (b) => !b.language || active.has(b.language) || b.id in unlockedBadges,
  );
}

export function badgeTally(
  activeLanguages: string[],
  unlockedBadges: Record<string, unknown>,
): { unlocked: number; total: number } {
  const visible = visibleBadges(activeLanguages, unlockedBadges);
  return {
    unlocked: visible.filter((b) => b.id in unlockedBadges).length,
    total: visible.length,
  };
}
