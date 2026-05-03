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

// Chrome Android (especially in standalone PWA mode) needs a one-time
// "warm-up" speak on the first user gesture to unlock the speech engine.
let warmedUp = false;

function warmUp(): void {
  if (warmedUp || !('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance('');
  u.volume = 0;
  u.onerror = () => {}; // swallow warm-up errors
  window.speechSynthesis.speak(u);
  warmedUp = true;
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', warmUp, { once: true });
  document.addEventListener('touchstart', warmUp, { once: true });
}

/**
 * Speak text aloud. Uses a short delay after cancel() to work around
 * a Chrome Android bug where cancel + immediate speak silently drops
 * the utterance.
 */
export function speak(text: string, language: string, rateOverride?: number): void {
  if (!('speechSynthesis' in window)) return;

  const synth = window.speechSynthesis;
  const rate = rateOverride ?? useSettingsStore.getState().ttsRate ?? 0.9;

  // Cancel previous speech only if needed
  const needsCancel = synth.speaking || synth.pending;
  if (needsCancel) {
    synth.cancel();
  }

  // Chrome Android: small delay after cancel lets the engine reset properly
  const delay = needsCancel ? 50 : 0;

  setTimeout(() => {
    if (synth.paused) synth.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_VOICE_MAP[language] ?? language;
    utterance.rate = rate;
    utterance.onerror = (e) => {
      console.warn('[TTS] error:', e.error, 'text:', text.slice(0, 40));
    };

    synth.speak(utterance);
  }, delay);
}

/**
 * Speak with a specific speed and return a Promise that resolves when done.
 * Used for sequential TTS playback (Listening page, Dictation drills).
 */
export function speakWithSpeed(text: string, language: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return; }

    const synth = window.speechSynthesis;

    const needsCancel = synth.speaking || synth.pending;
    if (needsCancel) {
      synth.cancel();
    }

    const delay = needsCancel ? 50 : 0;

    setTimeout(() => {
      if (synth.paused) synth.resume();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG_VOICE_MAP[language] ?? language;
      utterance.rate = rate;
      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        console.warn('[TTS] error:', e.error, 'text:', text.slice(0, 40));
        resolve();
      };

      synth.speak(utterance);
    }, delay);
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
