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
  ro: 'ro-RO',
};

// ─── Voice loading ───

let voicesReady = false;
// eslint-disable-next-line @typescript-eslint/no-empty-function
let resolveVoices: () => void = () => {};
const voicesPromise = new Promise<void>((resolve) => {
  resolveVoices = resolve;
});

function onVoicesLoaded(): void {
  if (voicesReady) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    voicesReady = true;
    resolveVoices();
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const initial = window.speechSynthesis.getVoices();
  if (initial.length > 0) {
    voicesReady = true;
    resolveVoices();
  }
  window.speechSynthesis.onvoiceschanged = onVoicesLoaded;
}

async function ensureVoices(timeoutMs = 2000): Promise<boolean> {
  if (voicesReady) return true;
  window.speechSynthesis.getVoices();
  return Promise.race([
    voicesPromise.then(() => true),
    new Promise<boolean>((r) => setTimeout(() => r(false), timeoutMs)),
  ]);
}

// ─── Google Translate TTS fallback ───
// When the device's speech synthesis engine is broken (synthesis-failed),
// we fall back to Google Translate's TTS endpoint via an <audio> element.

let useFallback = false; // Switch to fallback after first synthesis-failed

function getGoogleTTSUrl(text: string, language: string, slow = false): string {
  const tl = language.slice(0, 2).toLowerCase();
  const encoded = encodeURIComponent(text.slice(0, 200));
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${tl}&total=1&idx=0&textlen=${text.length}&client=tw-ob${slow ? '&ttsspeed=0.5' : ''}`;
}

let audioEl: HTMLAudioElement | null = null;

function speakViaFallback(text: string, language: string, rate?: number): Promise<void> {
  return new Promise((resolve) => {
    if (!audioEl) {
      audioEl = new Audio();
    }
    const slow = (rate ?? 1) < 0.7;
    audioEl.src = getGoogleTTSUrl(text, language, slow);
    audioEl.playbackRate = Math.max(0.5, Math.min(rate ?? 1, 2));
    audioEl.onended = () => resolve();
    audioEl.onerror = () => resolve();
    audioEl.play().catch(() => resolve());
  });
}

// ─── Main speak functions ───

/**
 * Speak text aloud.
 * Tries native speechSynthesis first; if it fails with synthesis-failed,
 * permanently switches to Google Translate TTS audio fallback.
 */
export async function speak(text: string, language: string, rateOverride?: number): Promise<void> {
  const rate = rateOverride ?? useSettingsStore.getState().ttsRate ?? 0.9;

  if (useFallback) {
    return speakViaFallback(text, language, rate);
  }

  if (!('speechSynthesis' in window)) {
    useFallback = true;
    return speakViaFallback(text, language, rate);
  }

  const synth = window.speechSynthesis;
  await ensureVoices();

  if (synth.speaking || synth.pending) {
    synth.cancel();
    await new Promise((r) => setTimeout(r, 50));
  }

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_VOICE_MAP[language] ?? language;
    utterance.rate = rate;

    // Try to pick an explicit voice for better cross-browser reliability
    const voices = synth.getVoices();
    const prefix = language.slice(0, 2).toLowerCase();
    const langVoice = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
    if (langVoice) utterance.voice = langVoice;

    let settled = false;
    const settle = () => { if (!settled) { settled = true; resolve(); } };

    utterance.onend = settle;
    utterance.onerror = (e) => {
      if (e.error === 'synthesis-failed' || e.error === 'audio-busy' || e.error === 'network') {
        // Native TTS is broken — switch to fallback permanently
        useFallback = true;
        if (!settled) { settled = true; speakViaFallback(text, language, rate).then(resolve); }
      } else {
        settle();
      }
    };

    synth.speak(utterance);

    // Safety timeout: resolve the promise but do NOT flip to fallback permanently.
    // Only actual synthesis errors should trigger the permanent fallback switch.
    setTimeout(settle, 8000);
  });
}

/**
 * Speak with a specific speed and return a Promise that resolves when done.
 */
export async function speakWithSpeed(text: string, language: string, rate: number): Promise<void> {
  if (useFallback) {
    return speakViaFallback(text, language, rate);
  }

  if (!('speechSynthesis' in window)) {
    useFallback = true;
    return speakViaFallback(text, language, rate);
  }

  const synth = window.speechSynthesis;
  await ensureVoices();

  if (synth.speaking || synth.pending) {
    synth.cancel();
  }

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_VOICE_MAP[language] ?? language;
    utterance.rate = rate;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      if (e.error === 'synthesis-failed' || e.error === 'audio-busy' || e.error === 'network') {
        useFallback = true;
        speakViaFallback(text, language, rate).then(resolve);
      } else {
        resolve();
      }
    };

    synth.speak(utterance);
  });
}

export const TTS_SPEEDS = [
  { label: '0.5×', value: 0.5 },
  { label: '0.75×', value: 0.75 },
  { label: '1×', value: 1.0 },
] as const;

export type TTSSpeed = (typeof TTS_SPEEDS)[number]['value'];

export function isTTSSupported(): boolean {
  return true; // Always true now thanks to fallback
}

// ─── Diagnostics ───

interface DiagResult {
  label: string;
  result: 'started' | 'error' | 'timeout';
  error?: string;
}

export interface TTSDiagnostics {
  displayMode: string;
  supported: boolean;
  voiceCount: number;
  voicesForLang: string[];
  tests: DiagResult[];
}

function testSpeak(opts: {
  text: string;
  lang?: string;
  voice?: SpeechSynthesisVoice;
  rate?: number;
}): Promise<DiagResult & { label: string }> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const label = [
      opts.lang ? `lang=${opts.lang}` : 'no-lang',
      opts.voice ? `voice=${opts.voice.name}` : 'no-voice',
      `rate=${opts.rate ?? 1}`,
      `"${opts.text}"`,
    ].join(', ');

    const utterance = new SpeechSynthesisUtterance(opts.text);
    if (opts.lang) utterance.lang = opts.lang;
    if (opts.voice) utterance.voice = opts.voice;
    if (opts.rate) utterance.rate = opts.rate;

    let resolved = false;
    const done = (r: DiagResult) => { if (!resolved) { resolved = true; resolve({ ...r, label }); } };

    utterance.onstart = () => done({ label, result: 'started' });
    utterance.onerror = (e) => done({ label, result: 'error', error: e.error });
    setTimeout(() => done({
      label,
      result: 'timeout',
      error: `speaking=${synth.speaking}, pending=${synth.pending}, paused=${synth.paused}`,
    }), 3000);

    synth.speak(utterance);
  });
}

export async function diagnoseTTS(language: string): Promise<TTSDiagnostics> {
  const displayMode = window.matchMedia?.('(display-mode: standalone)').matches
    ? 'standalone'
    : window.matchMedia?.('(display-mode: browser)').matches
      ? 'browser'
      : 'unknown';

  if (!('speechSynthesis' in window)) {
    return { displayMode, supported: false, voiceCount: 0, voicesForLang: [], tests: [] };
  }

  const synth = window.speechSynthesis;
  const voicesLoaded = await ensureVoices(3000);
  const allVoices = synth.getVoices();
  const bcp47 = LANG_VOICE_MAP[language] ?? language;
  const prefix = language.slice(0, 2).toLowerCase();
  const langVoices = allVoices.filter(v => v.lang.toLowerCase().startsWith(prefix));
  const firstVoice = langVoices[0] ?? null;

  const testText = language === 'ja' ? 'こんにちは' : language === 'ru' ? 'Привет' : 'Hello';
  const tests: DiagResult[] = [];

  if (!voicesLoaded) {
    tests.push({ label: 'voices-load', result: 'error', error: `voices did not load (${allVoices.length} found)` });
  }

  // Test 1: Native speechSynthesis (lang-only)
  synth.cancel();
  await new Promise(r => setTimeout(r, 100));
  tests.push(await testSpeak({ text: testText, lang: bcp47 }));

  // Test 2: With explicit voice
  if (firstVoice) {
    synth.cancel();
    await new Promise(r => setTimeout(r, 100));
    tests.push(await testSpeak({ text: testText, lang: bcp47, voice: firstVoice, rate: 0.9 }));
  }

  // Test 3: English fallback
  synth.cancel();
  await new Promise(r => setTimeout(r, 100));
  tests.push(await testSpeak({ text: 'Hello', lang: 'en-US', rate: 1.0 }));

  // Test 4: Google Translate fallback
  try {
    await speakViaFallback(testText, language, 1.0);
    tests.push({ label: `Google TTS fallback "${testText}"`, result: 'started' });
  } catch {
    tests.push({ label: 'Google TTS fallback', result: 'error', error: 'audio playback failed' });
  }

  return {
    displayMode,
    supported: true,
    voiceCount: allVoices.length,
    voicesForLang: langVoices.map(v => `${v.name} (${v.lang})`),
    tests,
  };
}
