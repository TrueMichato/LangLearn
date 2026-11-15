import { useState, useEffect, useRef } from 'react';
import { useStudySetsStore, type StudySet } from '../../stores/studySetsStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { currentLanguageOf } from '../../lib/current-language';
import { getAllTags, getSavedCards, getWordsForSet, type SavedCard } from '../../lib/study-sets';
import { getLanguageLabel } from '../../lib/languages';
import { rtlProps } from '../../lib/rtl';

interface SetModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSet?: StudySet;
}

const fieldClass = 'w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100';
const secondaryClass = 'min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700';

export default function SetModal({ isOpen, onClose, editingSet }: SetModalProps) {
  return isOpen ? <SetEditor onClose={onClose} editingSet={editingSet} /> : null;
}

function SetEditor({ onClose, editingSet }: Omit<SetModalProps, 'isOpen'>) {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const dialog = useRef<HTMLDialogElement>(null);
  const [id] = useState(() => editingSet?.id ?? `custom-${crypto.randomUUID()}`);
  const [name, setName] = useState(editingSet?.name ?? '');
  const [description, setDescription] = useState(editingSet?.description ?? '');
  const [language, setLanguage] = useState(() => editingSet ? editingSet.language ?? '' : currentLanguageOf(useSettingsStore.getState()) ?? '');
  const [mode, setMode] = useState<'manual' | 'tags'>(editingSet ? editingSet.selectionMode ?? 'tags' : 'manual');
  const [selectedIds, setSelectedIds] = useState<number[]>(() => [...new Set(editingSet?.wordIds ?? [])]);
  const [selectedTags, setSelectedTags] = useState<string[]>(() => [...(editingSet?.tags ?? [])]);
  const [search, setSearch] = useState('');
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ key: string; count: number | null; error: string } | null>(null);
  const [saveError, setSaveError] = useState('');
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const previewKey = JSON.stringify([mode, selectedIds, selectedTags, language, retry]);
  const previewCount = preview?.key === previewKey ? preview.count : null;
  const previewError = preview?.key === previewKey ? preview.error : '';

  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    let live = true;
    Promise.all([getSavedCards(), getAllTags()]).then(([saved, tags]) => {
      if (!live) return;
      setCards(saved);
      setAllTags(tags);
      setLoading(false);
    }).catch(() => {
      if (live) { setError('Your saved cards could not be loaded. Please try again.'); setLoading(false); }
    });
    return () => { live = false; };
  }, [retry]);

  useEffect(() => {
    let live = true;
    getWordsForSet({
      id: 'preview', name: '', description: '', type: 'custom', createdAt: '',
      selectionMode: mode, wordIds: selectedIds, tags: selectedTags, language: language || undefined,
    }).then((matches) => {
      if (live) setPreview({ key: previewKey, count: matches.length, error: '' });
    }).catch(() => {
      if (live) setPreview({ key: previewKey, count: null, error: 'The set preview could not be loaded. Please try again.' });
    });
    return () => { live = false; };
  }, [mode, selectedIds, selectedTags, language, previewKey]);

  function handleSave() {
    if (!name.trim() || loading || error || previewError || previewCount === null) return;
    const value: StudySet = {
      id, name: name.trim(), description: description.trim(), type: 'custom',
      selectionMode: mode, wordIds: mode === 'manual' ? selectedIds : [],
      tags: mode === 'tags' ? selectedTags : [], language: language || undefined,
      createdAt: editingSet?.createdAt ?? new Date().toISOString(),
    };
    try {
      const store = useStudySetsStore.getState();
      if (store.sets.some((set) => set.id === id)) store.updateSet(id, value);
      else store.addSet(value);
      onClose();
    } catch {
      setSaveError('This set could not be saved on this device. Try saving again.');
    }
  }

  const scoped = cards.filter(({ word }) => !language || word.language === language);
  const query = search.trim().toLocaleLowerCase();
  const visible = scoped.filter(({ word }) =>
    [word.word, word.reading, word.meaning].some((value) => value.toLocaleLowerCase().includes(query)));
  const languages = [...new Set([...activeLanguages, ...cards.map(({ word }) => word.language), ...(language ? [language] : [])])];
  const tags = [...new Set([...allTags, ...selectedTags])].sort();
  const availableSelected = scoped.filter(({ word }) => selectedIds.includes(word.id!)).length;

  return (
    <dialog
      ref={dialog}
      aria-labelledby="study-set-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-800 p-5 text-slate-800 dark:text-slate-100 shadow-xl backdrop:bg-black/50"
    >
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); handleSave(); }}>
        <h2 id="study-set-title" className="text-lg font-semibold">{editingSet ? 'Edit study set' : 'Create study set'}</h2>
        <div>
          <label htmlFor="set-name" className="mb-1 block text-sm font-medium">Name</label>
          <input id="set-name" autoFocus required value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="set-description" className="mb-1 block text-sm font-medium">Description (optional)</label>
          <input id="set-description" value={description} onChange={(event) => setDescription(event.target.value)} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="set-language" className="mb-1 block text-sm font-medium">Set language</label>
          <select id="set-language" value={language} onChange={(event) => setLanguage(event.target.value)} className={fieldClass}>
            <option value="">All languages (cross-language set)</option>
            {languages.map((lang) => <option key={lang} value={lang}>{getLanguageLabel(lang)}</option>)}
          </select>
        </div>
        <fieldset>
          <legend className="mb-1 text-sm font-medium">Choose cards by</legend>
          <div className="flex gap-2">
            {(['manual', 'tags'] as const).map((value) => (
              <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)}
                className={`min-h-[44px] rounded-xl px-3 text-sm font-medium ${mode === value ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                {value === 'manual' ? 'Select words' : 'Tag rules'}
              </button>
            ))}
          </div>
        </fieldset>
        {loading ? <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Loading saved cards…</p> : error ? (
          <p role="alert" className="text-sm text-slate-700 dark:text-slate-200">{error}</p>
        ) : mode === 'manual' ? (
          <div className="space-y-2">
            <label htmlFor="set-search" className="block text-sm font-medium">Search word, reading or meaning</label>
            <input id="set-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} className={fieldClass} />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {selectedIds.length} selected · {availableSelected} available in this language scope. Search keeps all selections.
            </p>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-200 dark:divide-white/10">
              {visible.map(({ word }) => (
                <label key={word.id} className="flex min-h-[44px] cursor-pointer items-center gap-3 py-2">
                  <input type="checkbox" checked={selectedIds.includes(word.id!)} onChange={() => setSelectedIds((ids) =>
                    ids.includes(word.id!) ? ids.filter((id) => id !== word.id) : [...ids, word.id!])}
                    className="h-5 w-5 shrink-0 accent-indigo-600" />
                  <span className="min-w-0">
                    <span className="block break-words font-medium" {...rtlProps(word.language)}>{word.word}{word.reading ? ` · ${word.reading}` : ''}</span>
                    <span className="block break-words text-sm text-slate-500 dark:text-slate-400">{word.meaning}</span>
                    {!language && <span className="text-xs text-slate-500 dark:text-slate-400">{getLanguageLabel(word.language)}</span>}
                  </span>
                </label>
              ))}
              {!visible.length && <p className="py-3 text-sm text-slate-500 dark:text-slate-400">{scoped.length ? 'No matching cards. Try another search.' : 'No saved cards in this scope yet. Lessons can help you get started.'}</p>}
            </div>
          </div>
        ) : (
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Cards must have all selected tags</legend>
            <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
              {tags.map((tag) => (
                <label key={tag} className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl px-3 text-sm ${selectedTags.includes(tag) ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
                  <input type="checkbox" checked={selectedTags.includes(tag)} onChange={() => setSelectedTags((values) => values.includes(tag) ? values.filter((value) => value !== tag) : [...values, tag])} className="h-4 w-4 accent-indigo-600" />
                  {tag}
                </label>
              ))}
              {!tags.length && <p className="text-sm text-slate-500 dark:text-slate-400">No tags yet. Add tags in Words, or select individual words instead.</p>}
            </div>
          </fieldset>
        )}
        <p role="status" className="text-sm text-slate-500 dark:text-slate-400">
          {previewCount === null ? 'Checking available cards…' : `${previewCount} available card${previewCount === 1 ? '' : 's'} in this set`}
        </p>
        {previewError && <p role="alert" className="text-sm text-slate-700 dark:text-slate-200">{previewError}</p>}
        {(error || previewError) && <button type="button" onClick={() => { setError(''); setLoading(true); setRetry((value) => value + 1); }} className={secondaryClass}>Retry loading</button>}
        {saveError && <p role="alert" className="text-sm text-slate-700 dark:text-slate-200">{saveError}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={secondaryClass}>Cancel</button>
          <button type="submit" disabled={!name.trim() || loading || !!error || !!previewError || previewCount === null}
            className="min-h-[44px] rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">
            {editingSet ? 'Save set' : 'Create set'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
