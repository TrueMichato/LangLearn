import { useState, useRef, useCallback } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { currentLanguageOf } from '../../lib/current-language';
import { useXPStore } from '../../stores/xpStore';
import { bulkAddWords, wordExists } from '../../db/words';
import { getLanguageLabel } from '../../lib/languages';
import type { Word } from '../../db/schema';

interface CSVImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (count: number) => void;
}

type ColumnRole = 'word' | 'reading' | 'meaning' | 'context' | 'tags' | 'skip';

interface ParsedData {
  headers: string[];
  rows: string[][];
}

const HEADER_MAP: Record<string, ColumnRole> = {
  word: 'word',
  vocab: 'word',
  vocabulary: 'word',
  term: 'word',
  '単語': 'word',
  '語彙': 'word',
  'слово': 'word',
  reading: 'reading',
  kana: 'reading',
  furigana: 'reading',
  pronunciation: 'reading',
  '読み': 'reading',
  'かな': 'reading',
  meaning: 'meaning',
  definition: 'meaning',
  english: 'meaning',
  translation: 'meaning',
  '意味': 'meaning',
  '英語': 'meaning',
  'перевод': 'meaning',
  context: 'context',
  sentence: 'context',
  example: 'context',
  '例文': 'context',
  tags: 'tags',
  tag: 'tags',
  category: 'tags',
};

function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0];
  if (firstLine.includes('\t')) return '\t';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  return semiCount > commaCount ? ';' : ',';
}

function parseLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSV(text: string): ParsedData {
  const delimiter = detectDelimiter(text);
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseLine(lines[0], delimiter);
  const rows = lines.slice(1).map((l) => parseLine(l, delimiter));
  return { headers, rows };
}

function autoMapColumns(headers: string[]): ColumnRole[] {
  return headers.map((h) => {
    const key = h.toLowerCase().trim();
    return HEADER_MAP[key] ?? 'skip';
  });
}

export default function CSVImport({ isOpen, onClose, onImportComplete }: CSVImportProps) {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [columnMap, setColumnMap] = useState<ColumnRole[]>([]);
  // Defaults to what you're studying, but never writes back: picking a language
  // here answers "where does this word go?", not "what am I studying now?".
  const [language, setLanguage] = useState(() => currentLanguageOf(useSettingsStore.getState()) ?? 'ja');
  const [pasteText, setPasteText] = useState('');
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState({ imported: 0, skipped: 0 });
  const [dupCount, setDupCount] = useState(0);
  const [validCount, setValidCount] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep(1);
    setParsed(null);
    setColumnMap([]);
    setPasteText('');
    setError('');
    setImporting(false);
    setImportResult({ imported: 0, skipped: 0 });
    setDupCount(0);
    setValidCount(0);
  }, []);

  function handleClose() {
    reset();
    onClose();
  }

  function handleParsed(data: ParsedData) {
    if (data.rows.length === 0) {
      setError('No data rows found. Make sure your CSV has a header row and at least one data row.');
      return;
    }
    setParsed(data);
    setColumnMap(autoMapColumns(data.headers));
    setError('');
    setStep(2);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      handleParsed(parseCSV(text));
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsText(file);
  }

  function handlePaste() {
    if (!pasteText.trim()) {
      setError('Please paste some data first.');
      return;
    }
    handleParsed(parseCSV(pasteText));
  }

  function setColumnRole(index: number, role: ColumnRole) {
    setColumnMap((prev) => {
      const next = [...prev];
      next[index] = role;
      return next;
    });
  }

  function buildWords(): Omit<Word, 'id' | 'createdAt'>[] {
    if (!parsed) return [];
    const wordIdx = columnMap.indexOf('word');
    const readIdx = columnMap.indexOf('reading');
    const meanIdx = columnMap.indexOf('meaning');
    const ctxIdx = columnMap.indexOf('context');
    const tagIdx = columnMap.indexOf('tags');

    if (wordIdx === -1) return [];

    return parsed.rows
      .map((row) => ({
        language,
        word: row[wordIdx]?.trim() ?? '',
        reading: readIdx >= 0 ? (row[readIdx]?.trim() ?? '') : '',
        meaning: meanIdx >= 0 ? (row[meanIdx]?.trim() ?? '') : '',
        contextSentence: ctxIdx >= 0 ? (row[ctxIdx]?.trim() ?? '') : '',
        tags: tagIdx >= 0 ? (row[tagIdx]?.trim() ?? '').split(/[,;]/).map((t) => t.trim()).filter(Boolean) : [],
        sourceTextId: null,
        type: 'word' as const,
      }))
      .filter((w) => w.word.length > 0);
  }

  async function goToPreview() {
    if (!columnMap.includes('word')) {
      setError('Please map at least one column as "Word".');
      return;
    }
    setError('');
    const words = buildWords();
    let dups = 0;
    for (const w of words) {
      if (await wordExists(w.word, w.language)) dups++;
    }
    setDupCount(dups);
    setValidCount(words.length);
    setStep(3);
  }

  async function doImport() {
    setImporting(true);
    setError('');
    try {
      const words = buildWords();
      const toAdd: typeof words = [];
      for (const w of words) {
        if (!(await wordExists(w.word, w.language))) {
          toAdd.push(w);
        }
      }
      const count = await bulkAddWords(toAdd);
      const xp = count * 5;
      if (xp > 0) useXPStore.getState().addXP(xp);
      setImportResult({ imported: count, skipped: words.length - count });
      setStep(4);
      onImportComplete?.(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  }

  if (!isOpen) return null;

  const previewRows = parsed?.rows.slice(0, 5) ?? [];

  const roleLabels: Record<ColumnRole, string> = {
    word: 'Word',
    reading: 'Reading',
    meaning: 'Meaning',
    context: 'Context Sentence',
    tags: 'Tags',
    skip: 'Skip',
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 overflow-y-auto p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full mt-12 sm:mt-20 p-6 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-6 h-0.5 ${
                    step > s ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          {step === 1 && 'Import from CSV'}
          {step === 2 && 'Map Columns'}
          {step === 3 && 'Preview Import'}
          {step === 4 && 'Import Complete'}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: File Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Upload a file
              </label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFile}
                className="block w-full text-sm text-slate-500 dark:text-slate-400
                  file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0
                  file:text-sm file:font-medium file:bg-indigo-100 file:text-indigo-700
                  dark:file:bg-indigo-900 dark:file:text-indigo-300
                  file:cursor-pointer file:min-h-[44px]
                  hover:file:bg-indigo-200 dark:hover:file:bg-indigo-800"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-sm text-slate-500 dark:text-slate-400">or paste data</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"word,reading,meaning\n食べる,たべる,to eat\n飲む,のむ,to drink"}
              rows={5}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
            />

            <button
              onClick={handlePaste}
              disabled={!pasteText.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] press-feedback"
            >
              Parse Data
            </button>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Supports CSV, TSV, and semicolon-delimited files. First row should be headers.
            </p>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 2 && parsed && (
          <div className="space-y-4">
            {/* Language selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Language
              </label>
              <select aria-label="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 min-h-[44px]"
              >
                {activeLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {getLanguageLabel(lang)}
                  </option>
                ))}
              </select>
            </div>

            {/* Column mapping dropdowns */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Map each column
              </label>
              {parsed.headers.map((header, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400 w-28 truncate shrink-0" title={header}>
                    {header}
                  </span>
                  <select aria-label="Map CSV column"
                    value={columnMap[i]}
                    onChange={(e) => setColumnRole(i, e.target.value as ColumnRole)}
                    className="flex-1 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm min-h-[44px]"
                  >
                    {(Object.entries(roleLabels) as [ColumnRole, string][]).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Preview table */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Preview ({Math.min(previewRows.length, 5)} of {parsed.rows.length} rows)
              </label>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900">
                      {parsed.headers.map((h, i) => (
                        <th key={i} className="px-2 py-1.5 text-left font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} className="border-t border-slate-100 dark:border-slate-700">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-2 py-1.5 text-slate-700 dark:text-slate-300 whitespace-nowrap max-w-[120px] truncate">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { reset(); }}
                className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors min-h-[44px] press-feedback"
              >
                Back
              </button>
              <button
                onClick={goToPreview}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[44px] press-feedback"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Import */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">Ready to import</span>
                <span className="font-bold text-indigo-700 dark:text-indigo-300">
                  {validCount - dupCount} word{validCount - dupCount !== 1 ? 's' : ''}
                </span>
              </div>
              {dupCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">Duplicates (will skip)</span>
                  <span className="font-bold text-amber-700 dark:text-amber-300">
                    {dupCount} word{dupCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">Language</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {getLanguageLabel(language)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">XP to earn</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  +{(validCount - dupCount) * 5} XP
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors min-h-[44px] press-feedback"
              >
                Back
              </button>
              <button
                onClick={doImport}
                disabled={importing || validCount - dupCount === 0}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] press-feedback"
              >
                {importing ? 'Importing…' : 'Import'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 4 && (
          <div className="space-y-4 text-center">
            <p className="text-5xl">🎉</p>
            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Imported {importResult.imported} word{importResult.imported !== 1 ? 's' : ''}!
              </p>
              {importResult.skipped > 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Skipped {importResult.skipped} duplicate{importResult.skipped !== 1 ? 's' : ''}
                </p>
              )}
              {importResult.imported > 0 && (
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  +{importResult.imported * 5} XP earned!
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[44px] press-feedback"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
