import { useEffect } from 'react';

const IGNORED_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function useKeyboardShortcuts(
  shortcuts: Record<string, () => void>,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;

    function handler(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && IGNORED_TAGS.has(e.target.tagName)) return;

      const key = e.key === ' ' ? 'Space' : e.key;
      const normalised = key.length === 1 ? key.toLowerCase() : key;
      const action = shortcuts[normalised] ?? shortcuts[key];

      if (action) {
        e.preventDefault();
        action();
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts, enabled]);
}
