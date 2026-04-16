export interface Token {
  surface: string;
  reading: string;
  isKanji: boolean;
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
};

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, PendingRequest>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('../workers/kuromoji.worker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = (e: MessageEvent) => {
      const { id, tokens, error } = e.data;
      const req = pending.get(id);
      if (!req) return;
      pending.delete(id);

      if (error) {
        req.reject(new Error(error));
      } else {
        const mapped: Token[] = tokens.map(
          (t: { surface_form: string; reading: string }) => ({
            surface: t.surface_form,
            reading: katakanaToHiragana(t.reading),
            isKanji: KANJI_RE.test(t.surface_form),
          }),
        );
        req.resolve(mapped);
      }
    };

    worker.onerror = (err) => {
      for (const req of pending.values()) {
        req.reject(new Error(err.message));
      }
      pending.clear();
    };
  }
  return worker;
}

export function tokenizeJapanese(text: string): Promise<Token[]> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, text });
  });
}
