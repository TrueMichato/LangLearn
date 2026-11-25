import { useState } from 'react';
import { refreshSavedGrammarCards, type GrammarRefreshResult } from '../../db/refresh-grammar';
import type { Word } from '../../db/schema';

export default function GrammarRefresh({ words }: { words: Word[] }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<GrammarRefreshResult>();
  const [failed, setFailed] = useState(false);

  async function refresh() {
    setBusy(true);
    setFailed(false);
    setResult(undefined);
    try {
      setResult(await refreshSavedGrammarCards(words));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="grammar-refresh-heading" className="space-y-1">
      <h2 id="grammar-refresh-heading" className="font-semibold text-slate-800 dark:text-slate-100">Refresh lesson wording</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Check saved grammar cards from revised lessons against their latest wording. Your own wording and review dates stay as they are. No cards are added or removed.
      </p>
      <button type="button" onClick={refresh} disabled={busy}
        className="min-h-[44px] rounded-xl font-medium text-indigo-600 hover:underline dark:text-indigo-400 disabled:opacity-50">
        {busy ? 'Checking lesson cards…' : failed || result?.unavailable ? 'Retry refresh' : 'Refresh saved lesson cards'}
      </button>
      <div role="status" className="text-sm text-slate-700 dark:text-slate-200">
        {failed && <p>We couldn’t save this refresh. No card changes were made. You can try again.</p>}
        {result && <>
          <p>Card wording: {result.updated} updated · {result.unchanged} unchanged · {result.skipped} skipped · {result.unavailable} unavailable.</p>
          {result.skipped > 0 && <p>Skipped cards keep their wording: they’re personal, or their original lesson wording couldn’t be verified.</p>}
          {result.unavailable > 0 && <p>Some lesson content couldn’t be loaded or verified. Those cards weren’t changed. Try again when the lessons are available.</p>}
        </>}
      </div>
    </section>
  );
}
