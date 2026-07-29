/**
 * Resolving "which language am I studying?".
 *
 * Kept as pure functions rather than folded into the store or the hook so the
 * rules that caused real bugs — a stored language that is no longer active, a
 * persisted install that predates the field, a surface that supports only a
 * subset — can be tested without a DOM or a store.
 */

export interface ResolvedLanguage {
  /** The language this surface should show. `undefined` when it supports none. */
  language: string | undefined;
  /** The learner's choice, even when this surface can't show it. */
  requested: string | undefined;
  /** Active languages this surface can actually show. */
  options: string[];
  /** False when the learner's chosen language isn't available here. */
  isSupported: boolean;
}

/**
 * `stored` may be `''` (installs that predate the field) or stale (the language
 * was removed in Settings). Resolving here rather than at write time means no
 * store migration is needed: every read is validated against what's active now.
 */
export function resolveCurrentLanguage(
  activeLanguages: readonly string[],
  stored: string | undefined,
  supported?: readonly string[],
): ResolvedLanguage {
  const options = supported
    ? activeLanguages.filter((l) => supported.includes(l))
    : [...activeLanguages];

  const requested =
    stored && activeLanguages.includes(stored) ? stored : activeLanguages[0];

  const isSupported = requested !== undefined && options.includes(requested);

  return {
    language: isSupported ? requested : options[0],
    requested,
    options,
    isSupported,
  };
}

/**
 * The current language read once, imperatively.
 *
 * For forms that ask "where does this word go?" — Add Word, CSV import, deck
 * export, study sets, the dictionary. They should *default* to what you are
 * studying, but must never subscribe to it: re-reading reactively would change
 * the destination under a half-filled form, and picking a different language
 * there is a filing decision, not a change of what you are studying.
 */
export function currentLanguageOf(state: {
  activeLanguages: readonly string[];
  currentLanguage: string;
}): string | undefined {
  return resolveCurrentLanguage(state.activeLanguages, state.currentLanguage).language;
}

/**
 * Onboarding's first pick has to become the current language, or the learner
 * lands on a surface showing something they never chose.
 */
export function languageStateOnAdd(
  activeLanguages: readonly string[],
  currentLanguage: string,
  lang: string,
): { activeLanguages: string[]; currentLanguage: string } {
  const next = activeLanguages.includes(lang)
    ? [...activeLanguages]
    : [...activeLanguages, lang];

  return {
    activeLanguages: next,
    currentLanguage: next.includes(currentLanguage) ? currentLanguage : lang,
  };
}

/**
 * Removing the language you were studying must land on a real one — a dangling
 * code would leave every surface defending against it separately.
 */
export function languageStateOnRemove(
  activeLanguages: readonly string[],
  currentLanguage: string,
  lang: string,
): { activeLanguages: string[]; currentLanguage: string } {
  const next = activeLanguages.filter((l) => l !== lang);

  return {
    activeLanguages: next,
    currentLanguage: next.includes(currentLanguage)
      ? currentLanguage
      : (next[0] ?? ''),
  };
}
