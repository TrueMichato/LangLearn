import type { SM2Grade } from '../../lib/sm2';

interface GradeButtonsProps {
  onGrade: (grade: SM2Grade) => void;
}

const grades: Array<{ grade: SM2Grade; emoji: string; label: string; sublabel: string; color: string; border: string }> = [
  { grade: 0, emoji: '🔄', label: 'Again', sublabel: "Didn't know", color: 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 hover:from-orange-200 hover:to-amber-200 dark:from-orange-900/40 dark:to-amber-900/40 dark:text-orange-300', border: 'border-l-4 border-orange-400' },
  { grade: 3, emoji: '😤', label: 'Hard', sublabel: 'Struggled', color: 'bg-gradient-to-r from-yellow-100 to-amber-50 text-yellow-700 hover:from-yellow-200 hover:to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 dark:text-yellow-300', border: 'border-l-4 border-yellow-400' },
  { grade: 4, emoji: '😊', label: 'Good', sublabel: 'Got it', color: 'bg-gradient-to-r from-green-100 to-emerald-50 text-green-700 hover:from-green-200 hover:to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 dark:text-green-300', border: 'border-l-4 border-green-400' },
  { grade: 5, emoji: '🎯', label: 'Easy', sublabel: 'Instant', color: 'bg-gradient-to-r from-blue-100 to-indigo-50 text-blue-700 hover:from-blue-200 hover:to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 dark:text-blue-300', border: 'border-l-4 border-blue-400' },
];

export default function GradeButtons({ onGrade }: GradeButtonsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
      {grades.map(({ grade, emoji, label, sublabel, color, border }) => (
        <button
          key={grade}
          onClick={() => onGrade(grade)}
          className={`${color} ${border} press-feedback rounded-xl min-h-[52px] py-3 px-3 transition-colors font-medium`}
        >
          <div className="text-lg leading-none mb-0.5">{emoji}</div>
          <div className="font-medium text-sm">{label}</div>
          <div className="text-xs opacity-70">{sublabel}</div>
        </button>
      ))}
    </div>
  );
}
