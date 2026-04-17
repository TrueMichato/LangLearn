import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../db/schema';
import { todayStr } from '../../lib/streaks';

export default function DailyChallengeCard() {
  const [complete, setComplete] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      const today = todayStr();
      const record = await db.dailyActivity.get(today);
      setComplete(record?.challengeComplete === true);
    }
    check();
  }, []);

  if (complete === null) return null; // loading

  if (complete) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">
              Daily Challenge Complete!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Come back tomorrow for a new challenge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">
              Daily Challenge
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Complete today's challenge for 1.5× XP!
            </p>
          </div>
        </div>
        <Link
          to="/daily-challenge"
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Start
        </Link>
      </div>
    </div>
  );
}
