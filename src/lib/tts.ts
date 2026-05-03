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

/**
 * Speak text aloud.
 * Intentionally kept simple — the original minimal approach that used to work.
 * Chrome Android standalone has quirks with explicit .voice assignment and
 * .cancel()→.speak() timing, so we avoid both when possible.
 */
export function speak(text: string, language: string, rateOverride?: number): void {
  if (!('speechSynthesis' in window)) return;

  const synth = window.speechSynthesis;
  const rate = rateOverride ?? useSettingsStore.getState().ttsRate ?? 0.9;

  // Only cancel if something is actively playing
  if (synth.speaking || synth.pending) {
    synth.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_VOICE_MAP[language] ?? language;
  utterance.rate = rate;
  // Do NOT set utterance.voice — let the engine pick. Explicit voice
  // assignment causes synthesis-failed on some Android Chrome versions.

  synth.speak(utterance);
}

/**
 * Speak with a specific speed and return a Promise that resolves when done.
 */
export function speakWithSpeed(text: string, language: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return; }

    const synth = window.speechSynthesis;

    if (synth.speaking || synth.pending) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_VOICE_MAP[language] ?? language;
    utterance.rate = rate;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

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
  return 'speechSynthesis' in window;
}

// ─── Diagnostics (used by Settings page) ───

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
  const allVoices = synth.getVoices();
  const bcp47 = LANG_VOICE_MAP[language] ?? language;
  const prefix = language.slice(0, 2).toLowerCase();
  const langVoices = allVoices.filter(v => v.lang.toLowerCase().startsWith(prefix));
  const firstVoice = langVoices[0] ?? null;

  const testText = language === 'ja' ? 'こんにちは' : language === 'ru' ? 'Привет' : 'Hello';
  const tests: DiagResult[] = [];

  // Test 1: Minimal — just lang, default rate, no explicit voice
  synth.cancel();
  await new Promise(r => setTimeout(r, 100));
  tests.push(await testSpeak({ text: testText, lang: bcp47 }));

  // Test 2: With explicit voice
  if (firstVoice) {
    synth.cancel();
    await new Promise(r => setTimeout(r, 100));
    tests.push(await testSpeak({ text: testText, lang: bcp47, voice: firstVoice, rate: 0.9 }));
  }

  // Test 3: English fallback (to check if TTS works at all)
  synth.cancel();
  await new Promise(r => setTimeout(r, 100));
  tests.push(await testSpeak({ text: 'Hello', lang: 'en-US', rate: 1.0 }));

  // Test 4: Completely bare — no lang, no voice, no rate
  synth.cancel();
  await new Promise(r => setTimeout(r, 100));
  tests.push(await testSpeak({ text: 'Test' }));

  return {
    displayMode,
    supported: true,
    voiceCount: allVoices.length,
    voicesForLang: langVoices.map(v => `${v.name} (${v.lang})`),
    tests,
  };
}
