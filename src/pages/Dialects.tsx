import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import {
  DIALECTS,
  DIALECT_CODES,
  getDialectInfo,
  type DialectCode,
} from '../lib/arabic-dialects';
import { DIALECT_PROFILES, DIALECT_PHRASES } from '../data/dialects/phrases';
import { rtlProps } from '../lib/rtl';

/** The five spoken dialects a learner can choose (MSA is the shared core). */
const SPOKEN: DialectCode[] = DIALECT_CODES.filter((c) => c !== 'msa');

type CompareMode = 'mine' | 'all';

function FormTile({ code, ar, tr, highlight }: { code: DialectCode; ar: string; tr: string; highlight?: boolean }) {
  const info = getDialectInfo(code)!;
  return (
    <div
      className={`rounded-xl px-3 py-2 border ${
        highlight
          ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30'
          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'
      }`}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
        <span>{info.flag}</span>
        <span>{info.name}</span>
      </div>
      <div className="text-xl text-slate-800 dark:text-slate-100 leading-snug" {...rtlProps('ar')}>
        {ar}
      </div>
      <div className="text-xs text-slate-400 dark:text-slate-500">{tr}</div>
    </div>
  );
}

export default function DialectsPage() {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const arabicDialect = useSettingsStore((s) => s.arabicDialect);
  const setArabicDialect = useSettingsStore((s) => s.setArabicDialect);
  const arabicColloquialFocus = useSettingsStore((s) => s.arabicColloquialFocus);
  const setArabicColloquialFocus = useSettingsStore((s) => s.setArabicColloquialFocus);

  const [mode, setMode] = useState<CompareMode>('mine');

  if (!activeLanguages.includes('ar')) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="text-5xl">🗣️</div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Arabic Dialects</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          Add Arabic in Settings to explore the spoken dialects and how they differ from Modern
          Standard Arabic.
        </p>
      </div>
    );
  }

  const hasDialect = arabicDialect !== 'msa';
  const chosen = hasDialect ? (arabicDialect as DialectCode) : null;
  const chosenInfo = chosen ? getDialectInfo(chosen)! : null;
  const chosenProfile = chosen ? DIALECT_PROFILES[chosen] : null;

  const compareCodes: DialectCode[] =
    mode === 'all' ? DIALECT_CODES : chosen ? ['msa', chosen] : ['msa'];

  return (
    <div className="space-y-5">
      <div>
        <Link
          to="/learn"
          className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline press-feedback inline-block mb-2"
        >
          ← Back to Learn
        </Link>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">🗣️ Arabic Dialects</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Modern Standard Arabic (fuṣḥā) is the shared written core. Pick a spoken dialect to see how
          everyday speech differs — pronunciation, grammar markers and common phrases.
        </p>
      </div>

      {/* Dialect picker (bound to the app-wide preference) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Your dialect</p>
        <div className="flex flex-wrap gap-2">
          {SPOKEN.map((code) => {
            const info = DIALECTS[code];
            const active = arabicDialect === code;
            return (
              <button
                key={code}
                onClick={() => setArabicDialect(active ? 'msa' : code)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors press-feedback min-h-[44px] ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {info.flag} {info.name}
              </button>
            );
          })}
        </div>
        {!hasDialect && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
            No dialect selected — showing Modern Standard Arabic only. Pick one above to unlock its
            colloquial content across the app.
          </p>
        )}
      </div>

      {/* Chosen dialect spotlight */}
      {chosen && chosenInfo && chosenProfile && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="text-4xl leading-none">{chosenInfo.flag}</div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  {chosenInfo.name}
                </h3>
                <span className="text-sm text-slate-500 dark:text-slate-400" {...rtlProps('ar')}>
                  {chosenInfo.nativeName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{chosenInfo.region}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{chosenInfo.blurb}</p>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
                🔊 Pronunciation
              </p>
              <ul className="space-y-1.5">
                {chosenProfile.pronunciation.map((f) => (
                  <li key={f.label} className="text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{f.label}</span>
                    <span className="text-slate-500 dark:text-slate-400"> — {f.note}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
                🔧 Grammar markers
              </p>
              <ul className="space-y-1.5">
                {chosenProfile.grammar.map((f) => (
                  <li key={f.label} className="text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{f.label}</span>
                    <span className="text-slate-500 dark:text-slate-400"> — {f.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Colloquial focus toggle */}
          <label className="flex items-center justify-between gap-3 pt-1">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Surface colloquial lessons first across the app
            </span>
            <input
              type="checkbox"
              checked={arabicColloquialFocus}
              onChange={() => setArabicColloquialFocus(!arabicColloquialFocus)}
              className="h-5 w-5 accent-indigo-600"
            />
          </label>
          <Link
            to="/vocab-lessons"
            className="inline-block text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline press-feedback"
          >
            Browse {chosenInfo.name} vocabulary lessons →
          </Link>
        </div>
      )}

      {/* Phrase comparison */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Everyday phrases</p>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setMode('mine')}
              disabled={!chosen}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                mode === 'mine'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              } disabled:opacity-40`}
            >
              Mine vs MSA
            </button>
            <button
              onClick={() => setMode('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                mode === 'all'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              All dialects
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {DIALECT_PHRASES.map((p) => (
            <div key={p.en} className="border-t border-slate-100 dark:border-slate-700/60 pt-3 first:border-t-0 first:pt-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{p.en}</p>
              <div className={`grid gap-2 ${mode === 'all' ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {compareCodes.map((code) => (
                  <FormTile
                    key={code}
                    code={code}
                    ar={p.forms[code].ar}
                    tr={p.forms[code].tr}
                    highlight={code === chosen}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center px-4">
        Dialect forms are the most widely-taught spoken variants; real usage varies by country and
        city. Learn the fuṣḥā core first — it unlocks every dialect.
      </p>
    </div>
  );
}
