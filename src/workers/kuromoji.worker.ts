import kuromoji from 'kuromoji';

interface TokenizeRequest {
  id: number;
  text: string;
}

interface TokenResult {
  surface_form: string;
  reading: string;
  word_type: string;
}

interface TokenizeResponse {
  id: number;
  tokens?: TokenResult[];
  error?: string;
}

let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null;
let initPromise: Promise<void> | null = null;

function initTokenizer(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    kuromoji
      .builder({ dicPath: '/langlearn/dict/' })
      .build((err, built) => {
        if (err) {
          initPromise = null;
          reject(err);
          return;
        }
        tokenizer = built;
        resolve();
      });
  });

  return initPromise;
}

self.onmessage = async (e: MessageEvent<TokenizeRequest>) => {
  const { id, text } = e.data;

  try {
    await initTokenizer();

    const results = tokenizer!.tokenize(text);
    const tokens: TokenResult[] = results.map((t) => ({
      surface_form: t.surface_form,
      reading: t.reading ?? '',
      word_type: t.word_type,
    }));

    const response: TokenizeResponse = { id, tokens };
    self.postMessage(response);
  } catch (err) {
    const response: TokenizeResponse = {
      id,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(response);
  }
};
