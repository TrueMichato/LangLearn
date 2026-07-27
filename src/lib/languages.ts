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
  en: { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  es: { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  fr: { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  de: { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  zh: { code: 'zh', name: 'Chinese', flag: '🇨🇳', nativeName: '中文', hasLetterSystem: 'hanzi' },
  ko: { code: 'ko', name: 'Korean', flag: '🇰🇷', nativeName: '한국어', hasLetterSystem: 'hangul' },
  pt: { code: 'pt', name: 'Portuguese', flag: '🇧🇷', nativeName: 'Português', hasLetterSystem: 'latin-accents' },
  ar: { code: 'ar', name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية', hasLetterSystem: 'arabic', rtl: true },
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
