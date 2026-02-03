'use client';

import type { QuestionScore, AssessmentQuestion } from '@/lib/assessment/types';

interface ResultsCardProps {
  question: AssessmentQuestion;
  score: QuestionScore;
  questionNumber: number;
  userResponse?: string;
  expanded?: boolean;
  onToggle?: () => void;
}

export function ResultsCard({
  question,
  score,
  questionNumber,
  userResponse,
  expanded = false,
  onToggle,
}: ResultsCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 3) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    if (score >= 2) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Adequate';
    if (score >= 1.5) return 'Needs Work';
    return 'Poor';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Q{questionNumber}
          </span>
          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
            {question.type.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(score.overallScore)}`}>
            {score.overallScore.toFixed(1)}/5 - {getScoreLabel(score.overallScore)}
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-100 dark:border-slate-700">
          {/* Dimension Scores */}
          {score.dimensionScores.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Score Breakdown
              </h4>
              <div className="space-y-2">
                {score.dimensionScores.map((dim) => (
                  <div key={dim.dimension} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-28 capitalize">
                      {dim.dimension.replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          dim.score >= 4 ? 'bg-green-500' :
                          dim.score >= 3 ? 'bg-blue-500' :
                          dim.score >= 2 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(dim.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8">
                      {dim.score.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {score.specificFeedback && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                💬 Feedback
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {score.specificFeedback}
              </p>
            </div>
          )}

          {/* Strengths */}
          {score.strengths.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                ✅ Strengths
              </h4>
              <ul className="space-y-1">
                {score.strengths.map((strength, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {score.improvements.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
                📈 Areas to Improve
              </h4>
              <ul className="space-y-1">
                {score.improvements.map((improvement, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Red Flags / Bonuses */}
          {score.redFlagsTriggered.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                ⚠️ Issues Identified
              </h4>
              <ul className="text-sm text-red-600 dark:text-red-400">
                {score.redFlagsTriggered.map((flag, idx) => (
                  <li key={idx}>• {flag}</li>
                ))}
              </ul>
            </div>
          )}

          {score.bonusesEarned.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                🌟 Standout Elements
              </h4>
              <ul className="text-sm text-green-600 dark:text-green-400">
                {score.bonusesEarned.map((bonus, idx) => (
                  <li key={idx}>• {bonus}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Why This Matters */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🎯 Why This Question Matters
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {question.whyThisMatters}
            </p>
          </div>

          {/* User's Response (collapsed by default) */}
          {userResponse && (
            <details className="mt-4">
              <summary className="text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                View Your Response
              </summary>
              <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {userResponse}
                </p>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// Skill breakdown component for results page
interface SkillBreakdownProps {
  skills: Array<{ skill: string; score: number; questions: number }>;
}

export function SkillBreakdown({ skills }: SkillBreakdownProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Skills Breakdown
      </h3>
      <div className="space-y-4">
        {skills.map((skill) => {
          const percentage = (skill.score / 5) * 100;
          return (
            <div key={skill.skill}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {skill.skill.replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {Math.round(percentage)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentage >= 80 ? 'bg-green-500' :
                    percentage >= 60 ? 'bg-blue-500' :
                    percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Tier badge component
interface TierBadgeProps {
  tier: 'exceptional' | 'strong' | 'qualified' | 'developing' | 'not_ready';
  score: number;
  size?: 'sm' | 'lg';
}

export function TierBadge({ tier, score, size = 'lg' }: TierBadgeProps) {
  const tierConfig = {
    exceptional: { 
      label: 'Exceptional', 
      emoji: '🌟', 
      color: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      description: 'Top-tier candidate'
    },
    strong: { 
      label: 'Strong', 
      emoji: '✅', 
      color: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
      description: 'Well-qualified'
    },
    qualified: { 
      label: 'Qualified', 
      emoji: '👍', 
      color: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white',
      description: 'Meets requirements'
    },
    developing: { 
      label: 'Developing', 
      emoji: '📈', 
      color: 'bg-gradient-to-r from-orange-500 to-red-400 text-white',
      description: 'Room for growth'
    },
    not_ready: { 
      label: 'Not Ready', 
      emoji: '⏳', 
      color: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white',
      description: 'Needs more experience'
    },
  };

  const config = tierConfig[tier];

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.emoji} {config.label}
      </span>
    );
  }

  return (
    <div className={`${config.color} rounded-2xl p-6 text-center`}>
      <div className="text-4xl mb-2">{config.emoji}</div>
      <div className="text-2xl font-bold mb-1">{config.label}</div>
      <div className="text-white/80 text-sm">{config.description}</div>
      <div className="mt-4 text-5xl font-bold">{score}</div>
      <div className="text-white/80 text-sm">out of 100</div>
    </div>
  );
}
