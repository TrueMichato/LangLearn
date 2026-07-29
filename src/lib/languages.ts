export interface LanguageInfo {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
  hasLetterSystem?: 'hiragana-katakana' | 'cyrillic' | 'hanzi' | 'hangul' | 'latin-accents' | 'arabic';
  /** Right-to-left script (Arabic, Hebrew, Persian…). Drives dir="rtl" on target text. */
  rtl?: boolean;
}

export const LANGUAGES: Record<string, LanguageInfo> = {
  ja: { code: 'ja', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語', hasLetterSystem: 'hiragana-katakana' },
  ru: { code: 'ru', name: 'Russian', flag: '🇷🇺', nativeName: 'Русский', hasLetterSystem: 'cyrillic' },
  es: { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  pt: { code: 'pt', name: 'Portuguese', flag: '🇧🇷', nativeName: 'Português', hasLetterSystem: 'latin-accents' },
  ar: { code: 'ar', name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية', hasLetterSystem: 'arabic', rtl: true },
  ro: { code: 'ro', name: 'Romanian', flag: '🇷🇴', nativeName: 'Română', hasLetterSystem: 'latin-accents' },
};

export const ALL_LANGUAGE_CODES = Object.keys(LANGUAGES);

/** Get full display label like "🇯🇵 Japanese". Falls back to uppercase code. */
export function getLanguageLabel(code: string): string {
  const lang = LANGUAGES[code];
  return lang ? `${lang.flag} ${lang.name}` : code.toUpperCase();
}

/** Get just the name like "Japanese". Falls back to uppercase code. */
export function getLanguageName(code: string): string {
  return LANGUAGES[code]?.name ?? code.toUpperCase();
}

/** Get flag emoji. Falls back to 🌐. */
export function getLanguageFlag(code: string): string {
  return LANGUAGES[code]?.flag ?? '🌐';
}

/** Whether a language is written right-to-left (Arabic, etc.). */
export function isRTLLanguage(code: string): boolean {
  return LANGUAGES[code]?.rtl === true;
}
