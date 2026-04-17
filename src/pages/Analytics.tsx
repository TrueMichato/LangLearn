import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getRetentionData,
  getReviewForecast,
  getWeakestWords,
  getMasteryDistribution,
  getStudyTimeTrend,
  getOverallStats,
} from '../lib/analytics';
import type { Word, Review } from '../db/schema';
import LineChart from '../components/analytics/LineChart';
import BarChart from '../components/analytics/BarChart';
import SegmentedBar from '../components/analytics/SegmentedBar';

interface AnalyticsData {
  retention: { date: string; percent: number }[];
  forecast: { date: string; count: number }[];
  weakest: { word: Word; review: Review }[];
  mastery: { new: number; learning: number; mastered: number };
  studyTime: { date: string; minutes: number }[];
  stats: {
    totalWords: number;
    totalReviews: number;
    averageEase: number;
    totalStudyMinutes: number;
  };
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    async function load() {
      const [retention, forecast, weakest, mastery, studyTime, stats] =
        await Promise.all([
          getRetentionData(30),
          getReviewForecast(7),
          getWeakestWords(10),
          getMasteryDistribution(),
          getStudyTimeTrend(14),
          getOverallStats(),
        ]);
      setData({ retention, forecast, weakest, mastery, studyTime, stats });
    }
    load();
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 dark:text-gray-500">Loading analytics…</p>
      </div>
    );
  }

  const { retention, forecast, weakest, mastery, studyTime, stats } = data;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          to="/"
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Back"
        >
          ←
        </Link>
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          📈 SRS Analytics
        </h2>
      </div>

      {/* Overall Stats Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard icon="📚" label="Total Words" value={stats.totalWords} />
        <StatCard icon="🔄" label="Total Reviews" value={stats.totalReviews} />
        <StatCard icon="📊" label="Avg Ease" value={stats.averageEase.toFixed(2)} />
        <StatCard
          icon="⏱️"
          label="Study Time"
          value={
            stats.totalStudyMinutes >= 60
              ? `${Math.floor(stats.totalStudyMinutes / 60)}h ${stats.totalStudyMinutes % 60}m`
              : `${stats.totalStudyMinutes}m`
          }
        />
      </div>

      {/* Retention Rate */}
      <Section title="Retention Rate (30 days)">
        <LineChart
          data={retention.map((r) => ({
            label: shortDate(r.date),
            value: r.percent,
          }))}
          unit="%"
        />
      </Section>

      {/* Review Forecast */}
      <Section title="Upcoming Reviews (7 days)">
        <BarChart
          data={forecast.map((f) => ({
            label: shortDate(f.date),
            value: f.count,
          }))}
          color="bg-indigo-500"
        />
      </Section>

      {/* Mastery Distribution */}
      <Section title="Mastery Distribution">
        <SegmentedBar
          segments={[
            { label: 'New', value: mastery.new, color: 'bg-red-500' },
            { label: 'Learning', value: mastery.learning, color: 'bg-yellow-500' },
            { label: 'Mastered', value: mastery.mastered, color: 'bg-green-500' },
          ]}
        />
      </Section>

      {/* Study Time Trend */}
      <Section title="Study Time (14 days)">
        <BarChart
          data={studyTime.map((s) => ({
            label: shortDate(s.date),
            value: s.minutes,
          }))}
          color="bg-green-500"
          unit="m"
        />
      </Section>

      {/* Weakest Words */}
      <Section title="Weakest Words">
        {weakest.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
            No reviews yet — add some words to get started!
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {weakest.map(({ word, review }) => (
              <div
                key={review.id}
                className="flex items-center justify-between py-2"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                    {word.word}
                    {word.reading && (
                      <span className="text-xs text-gray-400 ml-1">
                        ({word.reading})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {word.meaning}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-semibold text-red-500">
                    {review.ease.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {review.lastReviewDate
                      ? shortDate(review.lastReviewDate)
                      : 'Never'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
      <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 text-center">
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">
        {value}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
