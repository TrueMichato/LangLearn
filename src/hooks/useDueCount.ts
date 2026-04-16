import { useState, useEffect } from 'react';
import { getDueCount } from '../db/reviews';

export function useDueCount(pollIntervalMs = 60_000): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      const c = await getDueCount();
      if (mounted) setCount(c);
    };

    refresh();
    const id = setInterval(refresh, pollIntervalMs);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [pollIntervalMs]);

  return count;
}
