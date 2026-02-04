'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('skeleton animate-pulse', className)} />
  );
}

// Pre-built skeleton patterns for common use cases
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            'h-4 rounded',
            i === lines - 1 ? 'w-4/5' : 'w-full'
          )} 
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700', className)}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3 rounded" />
          <Skeleton className="h-3 w-1/4 rounded" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonQuestion() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
      {/* Header skeleton */}
      <div className="bg-gray-50 dark:bg-slate-900 px-6 py-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <Skeleton className="h-5 w-32 rounded" />
      </div>
      
      {/* Context skeleton */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-900/10">
        <Skeleton className="h-4 w-20 rounded mb-3" />
        <SkeletonText lines={4} />
      </div>

      {/* Prompt skeleton */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700">
        <Skeleton className="h-4 w-24 rounded mb-3" />
        <SkeletonText lines={2} />
      </div>

      {/* Response area skeleton */}
      <div className="px-6 py-5">
        <div className="flex justify-between items-center mb-3">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonResults() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Score overview skeleton */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Tier badge skeleton */}
        <div className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-6 animate-pulse">
          <div className="text-center">
            <Skeleton className="w-16 h-16 mx-auto rounded-full mb-4" />
            <Skeleton className="h-8 w-32 mx-auto rounded mb-2" />
            <Skeleton className="h-4 w-24 mx-auto rounded mb-4" />
            <Skeleton className="h-16 w-20 mx-auto rounded" />
          </div>
        </div>

        {/* Summary skeleton */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
          <Skeleton className="h-6 w-24 rounded mb-4" />
          <SkeletonText lines={4} className="mb-6" />
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-28 rounded mb-3" />
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-3 w-full rounded" />
                ))}
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-32 rounded mb-3" />
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-3 w-full rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills breakdown skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
        <Skeleton className="h-6 w-40 rounded mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i}>
              <div className="flex justify-between items-center mb-1">
                <Skeleton className="h-3 w-28 rounded" />
                <Skeleton className="h-3 w-10 rounded" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonAssessmentIntro() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden animate-fade-in">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 px-6 py-8">
        <Skeleton className="h-8 w-3/4 rounded mb-2" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </div>

      {/* Info grid skeleton */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl">
              <Skeleton className="w-8 h-8 rounded mb-2" />
              <Skeleton className="h-3 w-16 rounded mb-1" />
              <Skeleton className="h-5 w-24 rounded" />
            </div>
          ))}
        </div>

        {/* Instructions skeleton */}
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-6">
          <Skeleton className="h-5 w-32 rounded mb-3" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-3 w-full rounded" />
            ))}
          </div>
        </div>

        {/* Button skeleton */}
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}
