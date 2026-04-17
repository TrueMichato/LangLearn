import { useEffect, useRef } from 'react';
import { checkBadges, gatherBadgeStats } from '../lib/badge-checker';
import { useBadgeStore } from '../stores/badgeStore';
import { db } from '../db/schema';

const CHECK_INTERVAL_MS = 30_000;

export function useBadgeChecker() {
  const unlockBadge = useBadgeStore((s) => s.unlockBadge);
  const running = useRef(false);

  useEffect(() => {
    async function run() {
      if (running.current) return;
      running.current = true;
      try {
        const stats = await gatherBadgeStats();
        const newBadgeIds = checkBadges(stats);

        for (const id of newBadgeIds) {
          unlockBadge(id);
          await db.badges.put({ id, unlockedAt: new Date().toISOString() });
        }
      } finally {
        running.current = false;
      }
    }

    run();
    const timer = setInterval(run, CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [unlockBadge]);
}
