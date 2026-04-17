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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          📚 Study Sets
        </h2>
        <span className="text-gray-400 dark:text-gray-500 text-sm">
          {collapsed ? '▶' : '▼'}
        </span>
      </button>

      {!collapsed && (
        <div className="space-y-3">
          {/* Smart sets */}
          {smartSets.length > 0 && (
            <div className="space-y-2">
              {smartSets.map(({ set, wordCount, dueCount }) => (
                <SetCard
                  key={set.id}
                  set={set}
                  wordCount={wordCount}
                  dueCount={dueCount}
                  onReview={() => handleReview(set.id)}
                />
              ))}
            </div>
          )}

          {/* Custom sets */}
          {customSets.length > 0 && (
            <div className="space-y-2">
              {customSets.map(({ set, wordCount, dueCount }) => (
                <div key={set.id}>
                  <SetCard
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
                </div>
              ))}
            </div>
          )}

          {/* Create button */}
          <button
            onClick={handleCreate}
            className="w-full py-2.5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:border-indigo-400 hover:text-indigo-500 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-colors"
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

function SetCard({
  set,
  wordCount,
  dueCount,
  onReview,
  onEdit,
  onDelete,
  deleteConfirm,
  onDeleteCancel,
}: SetCardProps) {
  const badgeClass =
    set.type === 'smart'
      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs'
      : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-xs';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {set.name}
            </h3>
            <span className={badgeClass}>{set.type}</span>
          </div>
          {set.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {set.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span>{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
            <span>{dueCount} due</span>
          </div>
        </div>

        <button
          onClick={onReview}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Review
        </button>
      </div>

      {/* Edit/Delete for custom sets */}
      {set.type === 'custom' && (
        <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Edit
            </button>
          )}
          {deleteConfirm ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-red-600 dark:text-red-400">Delete?</span>
              <button
                onClick={onDelete}
                className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Yes
              </button>
              <button
                onClick={onDeleteCancel}
                className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                No
              </button>
            </div>
          ) : (
            onDelete && (
              <button
                onClick={onDelete}
                className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800"
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
