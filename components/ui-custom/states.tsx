import * as React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ==========================================
// 1. SKELETON CARDS GRID
// ==========================================
interface SkeletonGridProps {
  count?: number;
  className?: string;
}

export function SkeletonCards({ count = 3, className }: SkeletonGridProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-5 space-y-4 bg-white dark:bg-zinc-950/60"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-1.5">
                <Skeleton className="h-4.5 w-12 rounded" />
                <Skeleton className="h-4.5 w-16 rounded" />
              </div>
            </div>
          </div>
          <div className="border-y border-neutral-100 dark:border-zinc-900 py-3 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3.5 w-1/4" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3.5 w-1/3" />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

// ==========================================
// 2. SKELETON TABLE
// ==========================================
export function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 rounded-2xl overflow-hidden', className)}>
      <div className="bg-neutral-50/50 dark:bg-zinc-900/30 border-b border-neutral-200 dark:border-zinc-800 p-4 flex gap-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/5" />
        <Skeleton className="h-4 w-1/6" />
        <Skeleton className="h-4 w-1/5" />
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex gap-4 items-center">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 3. LOADING SPINNER
// ==========================================
export function LoadingSpinner({ label = 'Fetching data...', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-10 space-y-3', className)}>
      <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
      {label && <span className="text-xs text-neutral-400 font-sans">{label}</span>}
    </div>
  );
}

// ==========================================
// 4. EMPTY STATE / NO DATA
// ==========================================
interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
  className?: string;
}

export function EmptyState({
  title = 'No Listings Found',
  description = 'There are no active public offerings matching your filters at this time.',
  onReset,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('border border-dashed border-neutral-300 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950/40 p-10 flex flex-col items-center text-center max-w-md mx-auto my-6', className)}>
      <div className="w-12 h-12 rounded-full bg-neutral-50 dark:bg-zinc-900/60 border border-neutral-200 dark:border-zinc-800/80 flex items-center justify-center text-neutral-400 dark:text-zinc-500 mb-4">
        <Inbox className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">{title}</h3>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 mb-5 leading-relaxed">
        {description}
      </p>
      {onReset && (
        <Button onClick={onReset} variant="outline" className="h-9 rounded-xl text-xs">
          Reset Filters
        </Button>
      )}
    </div>
  );
}
