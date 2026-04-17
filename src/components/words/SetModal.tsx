import { useState, useEffect } from 'react';
import { useStudySetsStore, type StudySet } from '../../stores/studySetsStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getAllTags, getWordsForSet } from '../../lib/study-sets';
import { getLanguageLabel } from '../../lib/languages';

interface SetModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSet?: StudySet;
}

export default function SetModal({ isOpen, onClose, editingSet }: SetModalProps) {
  const { addSet, updateSet } = useStudySetsStore();
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    getAllTags().then(setAllTags);
    if (editingSet) {
      setName(editingSet.name);
      setDescription(editingSet.description);
      setLanguage(editingSet.language ?? '');
      setSelectedTags([...editingSet.tags]);
    } else {
      setName('');
      setDescription('');
      setLanguage('');
      setSelectedTags([]);
    }
    setPreviewCount(null);
  }, [isOpen, editingSet]);

  // Live preview of matching word count
  useEffect(() => {
    if (!isOpen || selectedTags.length === 0) {
      setPreviewCount(selectedTags.length === 0 ? 0 : null);
      return;
    }
    const preview: StudySet = {
      id: 'preview',
      name: '',
      description: '',
      type: 'custom',
      tags: selectedTags,
      language: language || undefined,
      createdAt: '',
    };
    getWordsForSet(preview).then((r) => setPreviewCount(r.length));
  }, [isOpen, selectedTags, language]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleSave() {
    if (!name.trim()) return;
    if (editingSet) {
      updateSet(editingSet.id, {
        name: name.trim(),
        description: description.trim(),
        tags: selectedTags,
        language: language || undefined,
      });
    } else {
      const id = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
      addSet({
        id,
        name: name.trim(),
        description: description.trim(),
        type: 'custom',
        tags: selectedTags,
        language: language || undefined,
        createdAt: new Date().toISOString(),
      });
    }
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {editingSet ? 'Edit Study Set' : 'Create Study Set'}
          </h2>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. JLPT N5 Verbs"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Language filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Language <span className="text-gray-400">(optional)</span>
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">All languages</option>
              {activeLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {getLanguageLabel(lang)}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags <span className="text-gray-400">(word must have ALL selected)</span>
            </label>
            {allTags.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                No tags found. Add tags to your words first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {allTags.map((tag) => (
                  <label
                    key={tag}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm cursor-pointer select-none transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                      className="sr-only"
                    />
                    {tag}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {previewCount !== null
              ? `${previewCount} word${previewCount !== 1 ? 's' : ''} match${previewCount === 1 ? 'es' : ''}`
              : 'Select tags to preview'}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingSet ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
