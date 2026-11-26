import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../../db/schema';
import { isReadingProgress, type ReadingProgress } from '../../db/reading-progress';
import { isRTL } from '../../lib/rtl';

export default function ContinueReading({ language, onContinue }: {
  language: string;
  onContinue: (progress: ReadingProgress) => void;
}) {
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const subscription = liveQuery(() => db.readingProgress.where('language').equals(language).toArray()).subscribe({
      next: (rows) => {
        const valid = rows.filter(isReadingProgress).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
        setProgress(valid[0] ?? null);
        setError(rows.length !== valid.length ? 'A saved reading place could not be read. It is kept in your backup, not discarded.' : '');
      },
      error: () => setError('Reading places could not be loaded. Your library is still available.'),
    });
    return () => subscription.unsubscribe();
  }, [language]);
  const current = progress?.language === language ? progress : null;
  return (
    <>
      {error && <p role="status" className="mb-3 text-sm text-slate-500 dark:text-slate-400">{error}</p>}
      {current && (
        <section aria-label="Continue reading" className="mb-4 rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-white/10 dark:bg-slate-800">
          <h3 dir={isRTL(language) ? 'rtl' : 'ltr'} className="font-semibold text-slate-800 dark:text-slate-100">{current.title || 'Reading'}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {current.purpose === 'main-idea' ? 'Main idea' : 'Close study'} · Your place is saved by paragraph.
          </p>
          <button type="button" onClick={() => onContinue(current)}
            className="mt-2 min-h-[44px] rounded-xl bg-indigo-600 px-4 font-medium text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:text-white">
            Continue reading
          </button>
        </section>
      )}
    </>
  );
}
