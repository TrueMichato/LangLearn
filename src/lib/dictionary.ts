export interface DictionaryResult {
  word: string;
  reading: string;
  meanings: string[];
}

function withTimeout(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(id) };
}

async function lookupJisho(word: string): Promise<DictionaryResult | null> {
  const { signal, clear } = withTimeout(5000);
  try {
    const res = await fetch(
      `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`,
      { signal },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const entry = json?.data?.[0];
    if (!entry) return null;

    const reading = entry.japanese?.[0]?.reading ?? '';
    const meanings = entry.senses?.[0]?.english_definitions ?? [];
    return { word, reading, meanings };
  } catch {
    return null;
  } finally {
    clear();
  }
}

async function lookupGeneric(
  word: string,
  language: string,
): Promise<DictionaryResult | null> {
  const { signal, clear } = withTimeout(5000);
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/${encodeURIComponent(language)}/${encodeURIComponent(word)}`,
      { signal },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const entry = json?.[0];
    if (!entry) return null;

    const reading = entry.phonetic ?? '';
    const definition =
      entry.meanings?.[0]?.definitions?.[0]?.definition ?? '';
    return {
      word,
      reading,
      meanings: definition ? [definition] : [],
    };
  } catch {
    return null;
  } finally {
    clear();
  }
}

export async function lookupWord(
  word: string,
  language: string,
): Promise<DictionaryResult | null> {
  if (language === 'ja') {
    return lookupJisho(word);
  }
  return lookupGeneric(word, language);
}
