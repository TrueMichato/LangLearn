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

// ─── Voice loading ───
// Chrome Android (especially standalone PWA) loads voices asynchronously.
// Speaking before voices are loaded silently fails. We eagerly load voices
// and cache them by language prefix.

const voiceCache = new Map<string, SpeechSynthesisVoice>();
let voicesLoaded = false;

function loadVoices(): void {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return;
  voicesLoaded = true;
  voiceCache.clear();
  for (const voice of voices) {
    // Store first voice found for each language prefix (e.g. "ja", "ru", "en")
    const prefix = voice.lang.slice(0, 2).toLowerCase();
    if (!voiceCache.has(prefix)) {
      voiceCache.set(prefix, voice);
    }
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  // Try immediately (voices may already be cached in browser mode)
  loadVoices();
  // Also listen for async load (standalone PWA mode)
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
  // Fallback: some browsers use onvoiceschanged property instead of addEventListener
  if (!window.speechSynthesis.addEventListener) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

// ─── Audio context unlock ───
// Some Android browsers require an audio context unlock from a user gesture
// before any audio (including speech synthesis) will play.

let audioUnlocked = false;

function unlockAudio(): void {
  if (audioUnlocked) return;
  audioUnlocked = true;
  // Force voices to load on first interaction too
  loadVoices();
  try {
    const Ctx = window.AudioContext || (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext;
    if (Ctx) {
      const ctx = new Ctx();
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      ctx.resume().catch(() => {});
      // Close after a short time to free resources
      setTimeout(() => ctx.close().catch(() => {}), 1000);
    }
  } catch {
    // Not critical
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });
}

// ─── Core speak logic ───

function getVoiceForLang(language: string): SpeechSynthesisVoice | null {
  // Try cached voice for the 2-letter prefix
  const prefix = language.slice(0, 2).toLowerCase();
  if (voiceCache.has(prefix)) return voiceCache.get(prefix)!;

  // Voices might not have loaded yet — try a synchronous getVoices() call
  if (!voicesLoaded) loadVoices();
  return voiceCache.get(prefix) ?? null;
}

function doSpeak(utterance: SpeechSynthesisUtterance): void {
  const synth = window.speechSynthesis;
  if (synth.paused) synth.resume();
  synth.speak(utterance);
}

function createUtterance(text: string, language: string, rate: number): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  const bcp47 = LANG_VOICE_MAP[language] ?? language;
  utterance.lang = bcp47;
  utterance.rate = rate;

  // Explicitly set voice — critical for Android PWA where lang-only may fail
  const voice = getVoiceForLang(language);
  if (voice) {
    utterance.voice = voice;
  }

  return utterance;
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

  const utterance = createUtterance(text, language, rate);
  utterance.onerror = (e) => {
    if (e.error !== 'interrupted') {
      console.warn('[TTS] error:', e.error, 'text:', text.slice(0, 40));
    }
  };

  if (synth.speaking || synth.pending) {
    synth.cancel();
    setTimeout(() => doSpeak(utterance), 80);
  } else {
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

    const utterance = createUtterance(text, language, rate);
    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        console.warn('[TTS] error:', e.error, 'text:', text.slice(0, 40));
      }
      resolve();
    };

    if (synth.speaking || synth.pending) {
      synth.cancel();
      setTimeout(() => doSpeak(utterance), 80);
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
