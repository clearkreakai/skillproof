'use client';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ current, total, showLabel = true, className }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Question {current} of {total}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
            {percentage}% complete
          </span>
        </div>
      )}
      
      {/* Progress bar container */}
      <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        {/* Filled portion */}
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Dots indicator for small screens */}
      <div className="flex justify-center gap-1.5 mt-3 sm:hidden">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-300',
              i < current
                ? 'bg-blue-500'
                : i === current
                ? 'bg-blue-300 scale-110'
                : 'bg-gray-300 dark:bg-slate-600'
            )}
          />
        ))}
      </div>
    </div>
  );
}

// Compact version for tight spaces
export function ProgressDots({ current, total, className }: Omit<ProgressBarProps, 'showLabel'>) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-2.5 h-2.5 rounded-full transition-all duration-300',
            i < current
              ? 'bg-green-500'
              : i === current
              ? 'bg-blue-500 ring-4 ring-blue-500/20'
              : 'bg-gray-300 dark:bg-slate-600'
          )}
        />
      ))}
    </div>
  );
}

// Stepped progress for multi-stage flows
interface StepProgressProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function StepProgress({ steps, currentStep, className }: StepProgressProps) {
  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-center">
          {/* Step circle */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                idx < currentStep
                  ? 'bg-green-500 text-white'
                  : idx === currentStep
                  ? 'bg-blue-600 text-white ring-4 ring-blue-600/20'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
              )}
            >
              {idx < currentStep ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            <span
              className={cn(
                'mt-2 text-xs font-medium transition-colors',
                idx <= currentStep
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-400 dark:text-gray-500'
              )}
            >
              {step}
            </span>
          </div>

          {/* Connector line */}
          {idx < steps.length - 1 && (
            <div
              className={cn(
                'w-12 h-0.5 mx-2 transition-colors',
                idx < currentStep
                  ? 'bg-green-500'
                  : 'bg-gray-200 dark:bg-slate-700'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
