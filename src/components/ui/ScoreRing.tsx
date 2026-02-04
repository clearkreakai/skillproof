'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScoreRingProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { width: 80, stroke: 6, fontSize: 'text-lg', labelSize: 'text-xs' },
  md: { width: 120, stroke: 8, fontSize: 'text-3xl', labelSize: 'text-sm' },
  lg: { width: 160, stroke: 10, fontSize: 'text-4xl', labelSize: 'text-base' },
  xl: { width: 200, stroke: 12, fontSize: 'text-5xl', labelSize: 'text-lg' },
};

export function ScoreRing({
  score,
  maxScore = 100,
  size = 'lg',
  showLabel = true,
  label,
  animated = true,
  className,
}: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(animated ? 0 : score);
  const config = sizeConfig[size];
  const radius = (config.width - config.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = (animatedScore / maxScore) * 100;
  const offset = circumference - (percentage / 100) * circumference;

  // Animate score on mount
  useEffect(() => {
    if (!animated) return;

    const duration = 1500; // ms
    const startTime = Date.now();
    const startScore = 0;
    const endScore = score;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentScore = startScore + (endScore - startScore) * eased;
      
      setAnimatedScore(Math.round(currentScore));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score, animated]);

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' };
    if (score >= 60) return { stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' };
    if (score >= 40) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' };
    return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' };
  };

  const colors = getScoreColor(animatedScore);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-50 transition-all duration-500"
        style={{ backgroundColor: colors.glow }}
      />

      <svg
        width={config.width}
        height={config.width}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          strokeWidth={config.stroke}
          className="stroke-gray-200 dark:stroke-slate-700"
        />
        
        {/* Progress circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          strokeWidth={config.stroke}
          stroke={colors.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${colors.glow})`,
          }}
        />
      </svg>

      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn(
          config.fontSize,
          'font-bold tabular-nums',
          animatedScore >= 80 ? 'text-green-600 dark:text-green-400' :
          animatedScore >= 60 ? 'text-blue-600 dark:text-blue-400' :
          animatedScore >= 40 ? 'text-amber-600 dark:text-amber-400' :
          'text-red-600 dark:text-red-400'
        )}>
          {animatedScore}
        </span>
        {showLabel && (
          <span className={cn(config.labelSize, 'text-gray-500 dark:text-gray-400 font-medium')}>
            {label || `out of ${maxScore}`}
          </span>
        )}
      </div>
    </div>
  );
}

// Horizontal progress bar variant
interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  showValue = true,
  label,
  animated = true,
  className,
}: ProgressBarProps) {
  const [animatedValue, setAnimatedValue] = useState(animated ? 0 : value);
  const percentage = (animatedValue / max) * 100;

  useEffect(() => {
    if (!animated) return;

    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = value * eased;
      
      setAnimatedValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, animated]);

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  const getBarColor = (pct: number) => {
    if (pct >= 80) return 'from-green-500 to-emerald-400';
    if (pct >= 60) return 'from-blue-500 to-indigo-400';
    if (pct >= 40) return 'from-amber-500 to-yellow-400';
    return 'from-red-500 to-orange-400';
  };

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
              {label.replace(/_/g, ' ')}
            </span>
          )}
          {showValue && (
            <span className="text-sm font-medium text-gray-900 dark:text-white tabular-nums">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden', heightClass)}>
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out',
            getBarColor(percentage)
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Mini score badge for compact displays
interface ScoreBadgeProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function ScoreBadge({ score, maxScore = 5, size = 'md', className }: ScoreBadgeProps) {
  const percentage = (score / maxScore) * 100;
  
  const getColors = (pct: number) => {
    if (pct >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (pct >= 60) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (pct >= 40) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={cn(
      'inline-flex items-center font-semibold rounded-full tabular-nums',
      getColors(percentage),
      sizeClasses[size],
      className
    )}>
      {score.toFixed(1)}/{maxScore}
    </span>
  );
}
