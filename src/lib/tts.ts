import { useSettingsStore } from '../stores/settingsStore';

const LANG_VOICE_MAP: Record<string, string> = {
  ja: 'ja-JP',
  ru: 'ru-RU',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  zh: 'zh-CN',
  ko: 'ko-KR',
};

export function speak(text: string, language: string): void {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_VOICE_MAP[language] ?? language;
  utterance.rate = useSettingsStore.getState().ttsRate;
  window.speechSynthesis.speak(utterance);
}

export function isTTSSupported(): boolean {
  return 'speechSynthesis' in window;
}
