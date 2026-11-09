export interface Token {
  surface: string;
  reading: string;
  isKanji: boolean;
  lemma?: string;
  partOfSpeech?: string;
  partOfSpeechDetail?: string;
  wordType?: string;
}

const KANJI_RE = /[\u4e00-\u9faf]/;

/** Convert katakana string to hiragana */
function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
}

type PendingRequest = {
  resolve: (tokens: Token[]) => void;
  reject: (err: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, PendingRequest>();

function getWorker(): Worker {
  if (!worker) {
    const currentWorker = new Worker(
      new URL('../workers/kuromoji.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker = currentWorker;

    currentWorker.onmessage = (e: MessageEvent) => {
      if (worker !== currentWorker) return;
      const { id, tokens, error } = e.data;
      const req = pending.get(id);
      if (!req) return;
      pending.delete(id);
      clearTimeout(req.timeout);

      if (error) {
        req.reject(new Error(error));
      } else {
        const mapped: Token[] = tokens.map(
          (t: { surface_form: string; reading: string; basic_form?: string;
            pos?: string; pos_detail_1?: string; word_type?: string }) => ({
            surface: t.surface_form,
            reading: katakanaToHiragana(t.reading),
            isKanji: KANJI_RE.test(t.surface_form),
            lemma: t.basic_form && t.basic_form !== '*' ? t.basic_form : undefined,
            partOfSpeech: t.pos,
            partOfSpeechDetail: t.pos_detail_1,
            wordType: t.word_type,
          }),
        );
        req.resolve(mapped);
      }
    };

    currentWorker.onerror = (err) => {
      if (worker !== currentWorker) return;
      for (const req of pending.values()) {
        clearTimeout(req.timeout);
        req.reject(new Error(err.message));
      }
      pending.clear();
      currentWorker.terminate();
      worker = null;
    };
  }
  return worker;
}

export function tokenizeJapanese(text: string): Promise<Token[]> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    try {
      const currentWorker = getWorker();
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error('Japanese tokenization timed out'));
        if (pending.size === 0) {
          worker?.terminate();
          worker = null;
        }
      }, 30_000);
      pending.set(id, { resolve, reject, timeout });
      currentWorker.postMessage({ id, text });
    } catch (error) {
      const request = pending.get(id);
      if (request) clearTimeout(request.timeout);
      pending.delete(id);
      reject(error);
    }
  });
}
