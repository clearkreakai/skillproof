'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type Tier = 'exceptional' | 'strong' | 'qualified' | 'developing' | 'not_ready';

interface TierBadgeProps {
  tier: Tier;
  score: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const tierConfig = {
  exceptional: {
    label: 'Exceptional',
    emoji: '🌟',
    description: 'Top-tier candidate',
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    textGradient: 'from-emerald-400 to-teal-300',
    glow: 'rgba(16, 185, 129, 0.5)',
    border: 'border-emerald-400/50',
    bg: 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600',
  },
  strong: {
    label: 'Strong',
    emoji: '✅',
    description: 'Well-qualified',
    gradient: 'from-blue-500 via-indigo-500 to-violet-500',
    textGradient: 'from-blue-400 to-violet-300',
    glow: 'rgba(59, 130, 246, 0.5)',
    border: 'border-blue-400/50',
    bg: 'bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600',
  },
  qualified: {
    label: 'Qualified',
    emoji: '👍',
    description: 'Meets requirements',
    gradient: 'from-amber-500 via-yellow-500 to-orange-500',
    textGradient: 'from-amber-400 to-orange-300',
    glow: 'rgba(245, 158, 11, 0.5)',
    border: 'border-amber-400/50',
    bg: 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500',
  },
  developing: {
    label: 'Developing',
    emoji: '📈',
    description: 'Room for growth',
    gradient: 'from-orange-500 via-red-500 to-pink-500',
    textGradient: 'from-orange-400 to-pink-300',
    glow: 'rgba(234, 88, 12, 0.4)',
    border: 'border-orange-400/50',
    bg: 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-500',
  },
  not_ready: {
    label: 'Not Ready',
    emoji: '⏳',
    description: 'Needs more experience',
    gradient: 'from-slate-500 via-gray-500 to-zinc-500',
    textGradient: 'from-slate-400 to-zinc-300',
    glow: 'rgba(100, 116, 139, 0.4)',
    border: 'border-slate-400/50',
    bg: 'bg-gradient-to-br from-slate-500 via-gray-500 to-zinc-600',
  },
};

export function TierBadge({
  tier,
  score,
  size = 'lg',
  animated = true,
  className,
}: TierBadgeProps) {
  const [animatedScore, setAnimatedScore] = useState(animated ? 0 : score);
  const [showConfetti, setShowConfetti] = useState(false);
  const config = tierConfig[tier];

  useEffect(() => {
    if (!animated) return;

    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = score * eased;
      
      setAnimatedScore(Math.round(current));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (tier === 'exceptional' || tier === 'strong') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    };

    requestAnimationFrame(animate);
  }, [score, animated, tier]);

  if (size === 'sm') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-white',
        config.bg,
        className
      )}>
        <span>{config.emoji}</span>
        <span>{config.label}</span>
      </span>
    );
  }

  if (size === 'md') {
    return (
      <div className={cn(
        'relative overflow-hidden rounded-xl p-4 text-white',
        config.bg,
        className
      )}>
        <div className="relative z-10 flex items-center gap-3">
          <span className="text-2xl">{config.emoji}</span>
          <div>
            <div className="font-bold text-lg">{config.label}</div>
            <div className="text-white/80 text-sm">{config.description}</div>
          </div>
          <div className="ml-auto text-2xl font-bold tabular-nums">
            {animatedScore}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      </div>
    );
  }

  // Large size (default)
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl text-white',
      config.bg,
      'shadow-xl',
      className
    )}
    style={{ boxShadow: `0 20px 40px ${config.glow}` }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        {/* Subtle pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 text-center">
        {/* Confetti effect for high scores */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce-subtle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1}s`,
                  opacity: 0.8,
                }}
              >
                {['✨', '🎉', '⭐', '🌟'][Math.floor(Math.random() * 4)]}
              </div>
            ))}
          </div>
        )}

        {/* Emoji */}
        <div className="text-5xl mb-3 animate-bounce-subtle">{config.emoji}</div>
        
        {/* Label */}
        <div className="text-3xl font-bold mb-1">{config.label}</div>
        <div className="text-white/80 text-sm mb-6">{config.description}</div>
        
        {/* Score */}
        <div className="relative inline-flex flex-col items-center">
          <div className="text-7xl font-bold tabular-nums leading-none animate-score-reveal">
            {animatedScore}
          </div>
          <div className="text-white/70 text-sm mt-2">out of 100</div>
        </div>

        {/* Decorative border glow */}
        <div className="absolute inset-0 rounded-2xl border border-white/20" />
      </div>
    </div>
  );
}

// Inline tier indicator for lists
interface TierIndicatorProps {
  tier: Tier;
  className?: string;
}

export function TierIndicator({ tier, className }: TierIndicatorProps) {
  const config = tierConfig[tier];
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'w-3 h-3 rounded-full',
        tier === 'exceptional' && 'bg-emerald-500',
        tier === 'strong' && 'bg-blue-500',
        tier === 'qualified' && 'bg-amber-500',
        tier === 'developing' && 'bg-orange-500',
        tier === 'not_ready' && 'bg-slate-500',
      )} />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {config.label}
      </span>
    </div>
  );
}

// Get tier from numeric score
export function getTierFromScore(score: number): Tier {
  if (score >= 85) return 'exceptional';
  if (score >= 70) return 'strong';
  if (score >= 55) return 'qualified';
  if (score >= 40) return 'developing';
  return 'not_ready';
}
