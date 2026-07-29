import { useCallback, useMemo } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { resolveCurrentLanguage } from '../lib/current-language';

/**
 * The language the learner is currently studying.
 *
 * Before this existed, fifteen surfaces each kept their own `useState`
 * initialised to `activeLanguages[0]`. Every navigation reset it, so someone
 * studying Japanese and Russian had to re-pick Russian on Grammar, then again
 * on Vocab, then again on Reader — and surfaces that hid the picker behind a
 * setup screen never said which language they were showing at all.
 *
 * `currentLanguage` is persisted, but it can be `''` on installs that predate
 * it and it can go stale if the language is removed. Resolution lives here
 * rather than in the store so no migration is needed: read through this hook
 * and you always get a language that is actually active.
 */
export function useCurrentLanguage(supported?: readonly string[]) {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const stored = useSettingsStore((s) => s.currentLanguage);
  const setCurrentLanguage = useSettingsStore((s) => s.setCurrentLanguage);

  const resolved = useMemo(
    () => resolveCurrentLanguage(activeLanguages, stored, supported),
    [activeLanguages, stored, supported],
  );

  const setLanguage = useCallback(
    (lang: string) => setCurrentLanguage(lang),
    [setCurrentLanguage]
  );

  return {
    ...resolved,
    setLanguage,
    /** All active languages, regardless of what this surface supports. */
    activeLanguages,
  };
}
