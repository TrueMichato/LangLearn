import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudySetsStore, type StudySet } from '../../stores/studySetsStore';
import { getWordsForSet } from '../../lib/study-sets';
import { getFilteredReviewQueue } from '../../lib/filtered-review';
import SetModal from './SetModal';

interface SetCardData {
  set: StudySet;
  wordCount: number;
  dueCount: number;
}

export default function StudySets() {
  const { sets, deleteSet, ensureDefaults } = useStudySetsStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSet, setEditingSet] = useState<StudySet | undefined>(undefined);
  const [cardData, setCardData] = useState<SetCardData[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    ensureDefaults();
  }, [ensureDefaults]);

  const loadCounts = useCallback(async () => {
    const data: SetCardData[] = [];
    for (const set of sets) {
      const words = await getWordsForSet(set);
      const due = await getFilteredReviewQueue(set.id);
      data.push({ set, wordCount: words.length, dueCount: due.length });
    }
    setCardData(data);
  }, [sets]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  function handleReview(setId: string) {
    navigate(`/review?set=${encodeURIComponent(setId)}`);
  }

  function handleEdit(set: StudySet) {
    setEditingSet(set);
    setShowModal(true);
  }

  function handleDelete(id: string) {
    deleteSet(id);
    setDeleteConfirmId(null);
  }

  function handleCreate() {
    setEditingSet(undefined);
    setShowModal(true);
  }

  const smartSets = cardData.filter((d) => d.set.type === 'smart');
  const customSets = cardData.filter((d) => d.set.type === 'custom');

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        className="flex items-center justify-between w-full"
        onClick={() => setCollapsed(!collapsed)}
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          📚 Study Sets
        </h2>
        <span className="text-slate-400 dark:text-slate-500 text-sm">
          {collapsed ? '▶' : '▼'}
        </span>
      </button>

      {!collapsed && (
        <div className="space-y-3">
          {/* Smart sets — horizontal scroll pills */}
          {smartSets.length > 0 && (
            <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1">
              {smartSets.map(({ set, wordCount, dueCount }) => (
                <SetPill
                  key={set.id}
                  set={set}
                  wordCount={wordCount}
                  dueCount={dueCount}
                  onReview={() => handleReview(set.id)}
                />
              ))}
            </div>
          )}

          {/* Custom sets — horizontal scroll pills */}
          {customSets.length > 0 && (
            <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1">
              {customSets.map(({ set, wordCount, dueCount }) => (
                <SetPill
                  key={set.id}
                  set={set}
                  wordCount={wordCount}
                  dueCount={dueCount}
                  onReview={() => handleReview(set.id)}
                  onEdit={() => handleEdit(set)}
                  onDelete={
                    deleteConfirmId === set.id
                      ? () => handleDelete(set.id)
                      : () => setDeleteConfirmId(set.id)
                  }
                  deleteConfirm={deleteConfirmId === set.id}
                  onDeleteCancel={() => setDeleteConfirmId(null)}
                />
              ))}
            </div>
          )}

          {/* Create button */}
          <button
            onClick={handleCreate}
            className="w-full py-2.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-sm font-medium hover:border-indigo-400 hover:text-indigo-500 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-colors press-feedback"
          >
            ➕ Create Set
          </button>
        </div>
      )}

      <SetModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingSet(undefined);
          loadCounts();
        }}
        editingSet={editingSet}
      />
    </div>
  );
}

interface SetCardProps {
  set: StudySet;
  wordCount: number;
  dueCount: number;
  onReview: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  deleteConfirm?: boolean;
  onDeleteCancel?: () => void;
}

function SetPill({
  set,
  wordCount,
  dueCount,
  onReview,
  onEdit,
  onDelete,
  deleteConfirm,
  onDeleteCancel,
}: SetCardProps) {
  const isActive = dueCount > 0;

  return (
    <div
      className={`snap-start shrink-0 rounded-2xl shadow p-3 min-w-[180px] max-w-[220px] flex flex-col gap-2 ${
        isActive
          ? 'gradient-primary text-white'
          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <h3 className="font-semibold text-sm truncate">{set.name}</h3>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
          isActive
            ? 'bg-white/20 text-white'
            : set.type === 'smart'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
        }`}>
          {set.type}
        </span>
      </div>

      <div className={`flex items-center gap-2 text-xs ${isActive ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
        <span>{wordCount} words</span>
        <span>{dueCount} due</span>
      </div>

      <button
        onClick={onReview}
        className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors press-feedback ${
          isActive
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        Review
      </button>

      {set.type === 'custom' && (
        <div className={`flex gap-1.5 pt-1 border-t ${isActive ? 'border-white/20' : 'border-slate-100 dark:border-slate-700'}`}>
          {onEdit && (
            <button
              onClick={onEdit}
              className={`text-[10px] px-1.5 py-0.5 rounded press-feedback ${
                isActive ? 'bg-white/15 text-white/80 hover:bg-white/25' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Edit
            </button>
          )}
          {deleteConfirm ? (
            <div className="flex items-center gap-1">
              <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-red-600 dark:text-red-400'}`}>Delete?</span>
              <button
                onClick={onDelete}
                className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white hover:bg-red-700 press-feedback"
              >
                Yes
              </button>
              <button
                onClick={onDeleteCancel}
                className={`text-[10px] px-1.5 py-0.5 rounded press-feedback ${
                  isActive ? 'bg-white/15 text-white/80' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                No
              </button>
            </div>
          ) : (
            onDelete && (
              <button
                onClick={onDelete}
                className={`text-[10px] px-1.5 py-0.5 rounded press-feedback ${
                  isActive ? 'bg-white/15 text-white/80 hover:bg-white/25' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
                }`}
              >
                Delete
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
