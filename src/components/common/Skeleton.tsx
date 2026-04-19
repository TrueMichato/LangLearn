interface SkeletonProps {
  className?: string;
}

export function SkeletonLine({ className = '' }: SkeletonProps) {
  return <div className={`skeleton h-4 ${className}`} />;
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`rounded-2xl bg-white dark:bg-slate-800/90 shadow p-4 space-y-3 ${className}`}>
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-8 w-1/3 mt-2" />
    </div>
  );
}

export function SkeletonStatGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl bg-white dark:bg-slate-800/90 shadow p-4 space-y-2">
          <div className="skeleton h-3 w-2/3 mx-auto" />
          <div className="skeleton h-7 w-1/2 mx-auto" />
          <div className="skeleton h-3 w-3/4 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonFlashcard() {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800/90 shadow-lg border-2 border-slate-200 dark:border-slate-700 p-6 min-h-[240px] flex flex-col items-center justify-center space-y-4">
      <div className="skeleton h-8 w-1/2" />
      <div className="skeleton h-4 w-2/3" />
      <div className="skeleton h-4 w-1/3" />
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white dark:bg-slate-800/90 shadow p-4 flex items-center gap-4">
          <div className="skeleton h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 page-enter">
      <div className="skeleton h-6 w-1/3" />
      <SkeletonStatGrid />
      <SkeletonCard />
      <SkeletonList count={3} />
    </div>
  );
}
