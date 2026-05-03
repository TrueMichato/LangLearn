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
  pt: 'pt-BR',
};

// Voice cache — eagerly populated via voiceschanged event.
// On Android PWA standalone mode, getVoices() returns [] until this fires.
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

function loadVoices(): void {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    cachedVoices = voices;
    voicesLoaded = true;
  }
}

// Eagerly load voices and listen for the async voiceschanged event
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

/** Find the best matching voice for a language code. */
export function findVoice(langCode: string): SpeechSynthesisVoice | null {
  const bcp = LANG_VOICE_MAP[langCode] ?? langCode;
  // Exact match on BCP-47 tag (e.g. "ja-JP")
  const exact = cachedVoices.find((v) => v.lang === bcp);
  if (exact) return exact;
  // Prefix match (e.g. "ja-JP" matches voice with lang "ja")
  const prefix = bcp.split('-')[0];
  const partial = cachedVoices.find((v) => v.lang.startsWith(prefix));
  return partial ?? null;
}

function doSpeak(text: string, language: string, rate: number): void {
  // Only cancel if actively speaking/pending — calling cancel() when idle
  // puts Chrome Android PWA into a broken state that silently drops utterances
  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    window.speechSynthesis.cancel();
  }
  // Wake up engine if Chrome put it to sleep (idle timeout workaround)
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_VOICE_MAP[language] ?? language;
  utterance.rate = rate || 0.9;
  const voice = findVoice(language);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function speak(text: string, language: string, rateOverride?: number): void {
  if (!('speechSynthesis' in window)) return;

  const rate = rateOverride ?? useSettingsStore.getState().ttsRate;

  if (voicesLoaded) {
    doSpeak(text, language, rate);
    return;
  }

  // Voices not loaded yet — try a synchronous refresh, then retry after voiceschanged
  loadVoices();
  if (voicesLoaded) {
    doSpeak(text, language, rate);
    return;
  }

  // Last resort: wait briefly for voiceschanged then retry once
  const onReady = () => {
    window.speechSynthesis.removeEventListener('voiceschanged', onReady);
    clearTimeout(timeout);
    loadVoices();
    doSpeak(text, language, rate);
  };
  window.speechSynthesis.addEventListener('voiceschanged', onReady);
  // Fallback: if voiceschanged never fires, try anyway after 300ms
  const timeout = window.setTimeout(() => {
    window.speechSynthesis.removeEventListener('voiceschanged', onReady);
    loadVoices();
    doSpeak(text, language, rate);
  }, 300);
}

/**
 * Speak with a specific speed and return a Promise that resolves when done.
 * Use this for sequential TTS playback (e.g. Listening page passages).
 */
export function speakWithSpeed(text: string, language: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return; }

    const fire = () => {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG_VOICE_MAP[language] ?? language;
      utterance.rate = rate;
      const voice = findVoice(language);
      if (voice) utterance.voice = voice;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    };

    if (voicesLoaded) { fire(); return; }
    loadVoices();
    if (voicesLoaded) { fire(); return; }

    const onReady = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onReady);
      clearTimeout(timeout);
      loadVoices();
      fire();
    };
    window.speechSynthesis.addEventListener('voiceschanged', onReady);
    const timeout = window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onReady);
      loadVoices();
      fire();
    }, 300);
  });
}

export const TTS_SPEEDS = [
  { label: '0.5×', value: 0.5 },
  { label: '0.75×', value: 0.75 },
  { label: '1×', value: 1.0 },
] as const;

export type TTSSpeed = (typeof TTS_SPEEDS)[number]['value'];

export function isTTSSupported(): boolean {
  return 'speechSynthesis' in window;
}
