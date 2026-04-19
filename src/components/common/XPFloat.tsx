import { useEffect, useState } from 'react';

interface XPFloatProps {
  amount: number;
  className?: string;
}

export default function XPFloat({ amount, className = '' }: XPFloatProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <span
      className={`pointer-events-none font-bold text-indigo-600 dark:text-indigo-400 text-sm animate-[floatUp_1s_ease-out_forwards] ${className}`}
    >
      +{amount} XP
    </span>
  );
}
