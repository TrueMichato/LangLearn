import { useEffect } from 'react';

export function useKeyboardShortcuts(
  shortcuts: Record<string, () => void>,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;

    function handler(e: KeyboardEvent) {
      if (e.defaultPrevented || e.isComposing || e.keyCode === 229 || e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.target instanceof HTMLElement) {
        if (e.target.isContentEditable || e.target.closest('input, textarea, select')) return;
        // Leave native activation (e.g. Space on a hint) to the focused control.
        if ((e.key === ' ' || e.key === 'Enter') && e.target.closest('button, summary, a[href]')) return;
      }

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
