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

function getDifficultyColor(ease: number): string {
  if (ease < 1.8) return 'bg-red-500';
  if (ease < 2.2) return 'bg-amber-500';
  return 'bg-yellow-500';
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
      <div className="space-y-4 page-enter">
        <div className="flex items-center gap-3 mb-4">
          <div className="skeleton h-8 w-8 rounded-full" />
          <div className="skeleton h-6 w-40" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-slate-200/60 dark:border-white/10 p-4">
              <div className="skeleton h-6 w-6 mx-auto mb-2 rounded" />
              <div className="skeleton h-7 w-16 mx-auto mb-1" />
              <div className="skeleton h-3 w-20 mx-auto" />
            </div>
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-slate-200/60 dark:border-white/10 p-4">
            <div className="skeleton h-5 w-40 mb-3" />
            <div className="skeleton h-[180px] w-full" />
          </div>
        ))}
      </div>
    );
  }

  const { retention, forecast, weakest, mastery, studyTime, stats } = data;

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          to="/"
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Back"
        >
          ←
        </Link>
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
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
          gradient="green"
          unit="m"
        />
      </Section>

      {/* Weakest Words */}
      <Section title="Weakest Words">
        {weakest.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
            No reviews yet — add some words to get started!
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {weakest.map(({ word, review }) => (
              <div
                key={review.id}
                className="flex items-center justify-between py-2 px-1 -mx-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${getDifficultyColor(review.ease)}`} />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                      {word.word}
                      {word.reading && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                          ({word.reading})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {word.meaning}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-semibold text-red-500 dark:text-red-400">
                    {review.ease.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
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
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-slate-200/60 dark:border-white/10 p-4 mb-4">
      <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">
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
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-slate-200/60 dark:border-white/10 p-4 text-center">
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1 animate-[countUp_0.3s_ease-out]">
        {value}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
