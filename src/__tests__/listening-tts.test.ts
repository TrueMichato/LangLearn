import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../stores/settingsStore', () => ({ useSettingsStore: { getState: () => ({ ttsRate: 0.9 }) } }));

class Utterance {
  text: string;
  lang = '';
  rate = 1;
  voice: SpeechSynthesisVoice | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  constructor(text: string) { this.text = text; }
}
const voice = (lang: string) => ({ lang, name: lang, localService: true }) as SpeechSynthesisVoice;
let voices: SpeechSynthesisVoice[];
let utterances: Utterance[];
const synth = {
  getVoices: vi.fn(() => voices),
  speak: vi.fn((utterance: Utterance) => { utterances.push(utterance); }),
  cancel: vi.fn(),
  speaking: false,
  pending: false,
  onvoiceschanged: null as (() => void) | null,
};
const audio = vi.fn();

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.useFakeTimers();
  voices = [voice('en-US'), voice('es-ES')];
  utterances = [];
  synth.speak.mockImplementation((utterance: Utterance) => { utterances.push(utterance); });
  synth.onvoiceschanged = null;
  vi.stubGlobal('window', { speechSynthesis: synth });
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
  vi.stubGlobal('Audio', audio);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('observable, cancellable listening playback', () => {
  it('speaks the full passage with the chosen voice/rate and waits for real completion beyond eight seconds', async () => {
    const { playListeningPassage } = await import('../lib/tts');
    const text = 'Una frase larga. '.repeat(30);
    const playback = playListeningPassage(text, 'es', 0.5);
    const finished = vi.fn();
    void playback.finished.then(finished);
    await Promise.resolve();
    expect(utterances[0]).toMatchObject({ text, lang: 'es-ES', rate: 0.5, voice: voices[1] });
    utterances[0].onstart?.();
    await vi.advanceTimersByTimeAsync(8001);
    expect(finished).not.toHaveBeenCalled();
    utterances[0].onend?.();
    await expect(playback.finished).resolves.toEqual({ status: 'ended' });
    expect(audio).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops while voices are loading and never starts the cancelled passage afterwards', async () => {
    voices = [];
    const { playListeningPassage } = await import('../lib/tts');
    const playback = playListeningPassage('Hola', 'es', 1);
    playback.stop();
    await expect(playback.finished).resolves.toEqual({ status: 'cancelled' });
    voices = [voice('es-ES')];
    synth.onvoiceschanged?.();
    await vi.advanceTimersByTimeAsync(2500);
    expect(synth.speak).not.toHaveBeenCalled();
  });

  it('reports absent and missing-language voices without sending a passage to an external fallback', async () => {
    voices = [voice('en-US')];
    const { playListeningPassage } = await import('../lib/tts');
    await expect(playListeningPassage('Hola', 'es', 1).finished)
      .resolves.toEqual({ status: 'unavailable', reason: 'no-voice' });
    voices = [];
    const empty = playListeningPassage('Hola', 'es', 1);
    await vi.advanceTimersByTimeAsync(2100);
    await expect(empty.finished).resolves.toEqual({ status: 'unavailable', reason: 'no-voice' });
    vi.stubGlobal('window', {});
    await expect(playListeningPassage('Hola', 'es', 1).finished)
      .resolves.toEqual({ status: 'unavailable', reason: 'unsupported' });
    expect(synth.speak).not.toHaveBeenCalled();
    expect(audio).not.toHaveBeenCalled();
  });

  it('reports native errors, retries natively, and leaves legacy void-returning callers intact', async () => {
    const { playListeningPassage, speakWithSpeed, speak } = await import('../lib/tts');
    const playback = playListeningPassage('Hola', 'es', 1);
    await Promise.resolve();
    utterances[0].onerror?.({ error: 'synthesis-failed' });
    await expect(playback.finished).resolves.toEqual({ status: 'error', reason: 'synthesis-failed' });
    const retry = playListeningPassage('Hola', 'es', 0.75);
    await Promise.resolve();
    utterances[1].onend?.();
    await expect(retry.finished).resolves.toEqual({ status: 'ended' });
    const dictation = speakWithSpeed('Hola', 'es', 1.25);
    await Promise.resolve();
    utterances[2].onend?.();
    await expect(dictation).resolves.toBeUndefined();
    const word = speak('Hola', 'es');
    await Promise.resolve();
    utterances[3].onend?.();
    await expect(word).resolves.toBeUndefined();
    expect(audio).not.toHaveBeenCalled();
  });

  it('settles a silent start failure, thrown error, and interrupted utterance instead of hanging', async () => {
    const { playListeningPassage } = await import('../lib/tts');
    const stalled = playListeningPassage('Hola', 'es', 1);
    await vi.advanceTimersByTimeAsync(10_001);
    await expect(stalled.finished).resolves.toEqual({ status: 'error', reason: 'timeout' });
    expect(synth.cancel).toHaveBeenCalled();
    synth.speak.mockImplementationOnce(() => { throw new Error('device failure'); });
    await expect(playListeningPassage('Hola', 'es', 1).finished)
      .resolves.toEqual({ status: 'error', reason: 'playback-failed' });
    const interrupted = playListeningPassage('Hola', 'es', 1);
    await Promise.resolve();
    utterances.at(-1)?.onerror?.({ error: 'interrupted' });
    await expect(interrupted.finished).resolves.toEqual({ status: 'cancelled' });
  });

  it('replaces its previous playback and ignores late completion or stop from the old handle', async () => {
    const { playListeningPassage } = await import('../lib/tts');
    const old = playListeningPassage('Hola', 'es', 1);
    await Promise.resolve();
    const lateEnd = utterances[0].onend!;
    const current = playListeningPassage('Otra frase', 'es', 1);
    await Promise.resolve();
    await expect(old.finished).resolves.toEqual({ status: 'cancelled' });
    const cancellations = synth.cancel.mock.calls.length;
    old.stop();
    lateEnd();
    expect(synth.cancel).toHaveBeenCalledTimes(cancellations);
    current.stop();
    current.stop();
    await expect(current.finished).resolves.toEqual({ status: 'cancelled' });
    expect(synth.cancel).toHaveBeenCalledTimes(cancellations + 1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
