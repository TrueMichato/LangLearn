import type { SM2Grade } from '../../lib/sm2';

interface GradeButtonsProps {
  onGrade: (grade: SM2Grade) => void;
}

const grades: Array<{ grade: SM2Grade; emoji: string; label: string; sublabel: string; color: string }> = [
  { grade: 0, emoji: '🔄', label: 'Again', sublabel: "Didn't know", color: 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 dark:bg-orange-900/25 dark:text-orange-300 dark:border-orange-800/60 dark:hover:bg-orange-900/40' },
  { grade: 3, emoji: '😤', label: 'Hard', sublabel: 'Struggled', color: 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-800/60 dark:hover:bg-amber-900/40' },
  { grade: 4, emoji: '😊', label: 'Good', sublabel: 'Got it', color: 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 dark:bg-green-900/25 dark:text-green-300 dark:border-green-800/60 dark:hover:bg-green-900/40' },
  { grade: 5, emoji: '🎯', label: 'Easy', sublabel: 'Instant', color: 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/25 dark:text-blue-300 dark:border-blue-800/60 dark:hover:bg-blue-900/40' },
];

export default function GradeButtons({ onGrade }: GradeButtonsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
      {grades.map(({ grade, emoji, label, sublabel, color }) => (
        <button
          key={grade}
          onClick={() => onGrade(grade)}
          className={`${color} press-feedback rounded-xl min-h-[52px] py-3 px-3 transition-colors font-medium`}
        >
          <div className="text-lg leading-none mb-0.5">{emoji}</div>
          <div className="font-medium text-sm">{label}</div>
          <div className="text-xs opacity-70">{sublabel}</div>
        </button>
      ))}
    </div>
  );
}
