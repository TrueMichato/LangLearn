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

// Chrome Android standalone PWA requires speechSynthesis.speak() to run
// synchronously inside a user-gesture callback. setTimeout(fn, 0) breaks
// the gesture chain, silently dropping the utterance.
//
// Strategy:
//  - First call: speak() synchronously (no cancel needed) — gesture preserved.
//  - Subsequent calls while still speaking: cancel(), then setTimeout to give
//    the engine time to reset before re-speaking.
//  - Warm-up: use AudioContext unlock on first touch (more reliable than an
//    empty SpeechSynthesisUtterance which some engines ignore).

let audioUnlocked = false;

function unlockAudio(): void {
  if (audioUnlocked) return;
  audioUnlocked = true;
  try {
    const ctx = new (window.AudioContext || (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext)();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    ctx.resume().catch(() => {});
  } catch {
    // AudioContext not available — not critical
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });
}

function doSpeak(utterance: SpeechSynthesisUtterance): void {
  const synth = window.speechSynthesis;
  if (synth.paused) synth.resume();
  synth.speak(utterance);
}

/**
 * Speak text aloud. Keeps the call synchronous within the user gesture
 * when nothing is currently playing (the common case for button taps).
 * Only defers via setTimeout when we need to cancel ongoing speech first.
 */
export function speak(text: string, language: string, rateOverride?: number): void {
  if (!('speechSynthesis' in window)) return;

  const synth = window.speechSynthesis;
  const rate = rateOverride ?? useSettingsStore.getState().ttsRate ?? 0.9;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_VOICE_MAP[language] ?? language;
  utterance.rate = rate;
  utterance.onerror = (e) => {
    if (e.error !== 'interrupted') {
      console.warn('[TTS] error:', e.error, 'text:', text.slice(0, 40));
    }
  };

  if (synth.speaking || synth.pending) {
    synth.cancel();
    // Delay only after cancel — engine needs time to reset
    setTimeout(() => doSpeak(utterance), 60);
  } else {
    // Synchronous — preserves user gesture chain
    doSpeak(utterance);
  }
}

/**
 * Speak with a specific speed and return a Promise that resolves when done.
 * Used for sequential TTS playback (Listening page, Dictation drills).
 */
export function speakWithSpeed(text: string, language: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return; }

    const synth = window.speechSynthesis;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_VOICE_MAP[language] ?? language;
    utterance.rate = rate;
    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        console.warn('[TTS] error:', e.error, 'text:', text.slice(0, 40));
      }
      resolve();
    };

    if (synth.speaking || synth.pending) {
      synth.cancel();
      setTimeout(() => doSpeak(utterance), 60);
    } else {
      doSpeak(utterance);
    }
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
