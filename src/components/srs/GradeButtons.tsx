import type { SM2Grade } from '../../lib/sm2';

interface GradeButtonsProps {
  onGrade: (grade: SM2Grade) => void;
}

const grades: Array<{ grade: SM2Grade; label: string; sublabel: string; color: string }> = [
  { grade: 0, label: 'Again', sublabel: "Didn't know", color: 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:hover:bg-orange-800' },
  { grade: 3, label: 'Hard', sublabel: 'Struggled', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800' },
  { grade: 4, label: 'Good', sublabel: 'Got it', color: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800' },
  { grade: 5, label: 'Easy', sublabel: 'Instant', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800' },
];

export default function GradeButtons({ onGrade }: GradeButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-2 mt-4">
      {grades.map(({ grade, label, sublabel, color }) => (
        <button
          key={grade}
          onClick={() => onGrade(grade)}
          className={`${color} rounded-xl py-3 px-2 transition-colors`}
        >
          <div className="font-semibold text-sm">{label}</div>
          <div className="text-xs opacity-70">{sublabel}</div>
        </button>
      ))}
    </div>
  );
}
