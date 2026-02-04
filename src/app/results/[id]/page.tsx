'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { TierBadge } from '@/components/ui/TierBadge';
import { ProgressBar } from '@/components/ui/ScoreRing';
import { SkeletonResults } from '@/components/ui/Skeleton';
import { cn, formatTime, copyToClipboard } from '@/lib/utils';
import type { QuestionScore } from '@/lib/assessment/types';

interface QuestionData {
  id: string;
  type: string;
  prompt: string;
  whyThisMatters: string;
  context?: {
    role: string;
    situation: string;
    constraints: string[];
    stakes: string;
  };
}

interface ResultData {
  id: string;
  overallScore: number;
  tier: 'exceptional' | 'strong' | 'qualified' | 'developing' | 'not_ready';
  summary: string;
  topStrengths: string[];
  areasForGrowth: string[];
  totalTimeSeconds: number;
  questionScores: QuestionScore[];
  skillAnalysis: {
    skillScores: Array<{ skill: string; score: number; questions: number }>;
    strongestSkills: string[];
    weakestSkills: string[];
  };
}

interface AssessmentInfo {
  id: string;
  title: string;
  company: string;
  role: string;
  questions: QuestionData[];
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [result, setResult] = useState<ResultData | null>(null);
  const [assessment, setAssessment] = useState<AssessmentInfo | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch(`/api/results/${id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load results');
        }

        setResult(data.result);
        setAssessment(data.assessment);
        setShareToken(data.shareToken);
        setStatus('ready');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results');
        setStatus('error');
      }
    }

    fetchResults();
  }, [id]);

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (assessment) {
      setExpandedQuestions(new Set(assessment.questions.map(q => q.id)));
    }
  };

  const collapseAll = () => {
    setExpandedQuestions(new Set());
  };

  const handleShare = async () => {
    if (!shareToken) return;
    
    const shareUrl = `${window.location.origin}/results/${shareToken}?share=true`;
    const success = await copyToClipboard(shareUrl);
    
    if (success) {
      setCopied(true);
      setShowShareToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowShareToast(false);
      }, 3000);
    }
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Adequate';
    if (score >= 1.5) return 'Needs Work';
    return 'Poor';
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <nav className="fixed top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 border-b border-gray-100 dark:border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SP</span>
                </div>
                <span className="font-semibold text-xl text-gray-900 dark:text-white">SkillProof</span>
              </Link>
            </div>
          </div>
        </nav>

        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="skeleton h-8 w-64 mx-auto rounded mb-2" />
              <div className="skeleton h-4 w-48 mx-auto rounded" />
            </div>
            <SkeletonResults />
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Results Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
          <Link href="/assess" className="btn-primary">
            Take a New Assessment
          </Link>
        </div>
      </div>
    );
  }

  if (!result || !assessment) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in-down">
          <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <svg className="w-5 h-5 text-green-400 dark:text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Share link copied to clipboard!</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-50 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold text-sm">SP</span>
              </div>
              <span className="font-semibold text-xl text-gray-900 dark:text-white">SkillProof</span>
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all text-sm font-medium shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Your Assessment Results
            </h1>
            <p className="text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900 dark:text-white">{assessment.role}</span>
              <span>at</span>
              <span className="font-medium text-gray-900 dark:text-white">{assessment.company}</span>
              <span className="text-gray-400">•</span>
              <span>Completed in {formatTime(result.totalTimeSeconds)}</span>
            </p>
          </div>

          {/* Score Overview - Certificate Style */}
          <div className="grid lg:grid-cols-5 gap-6 mb-10">
            {/* Main Score Card */}
            <div className="lg:col-span-2 animate-fade-in-up">
              <TierBadge 
                tier={result.tier} 
                score={result.overallScore}
                animated={true}
              />
            </div>

            {/* Summary & Highlights */}
            <div className="lg:col-span-3 card p-6 sm:p-8 animate-fade-in-up animation-delay-200">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                Summary
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {result.summary}
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Strengths */}
                {result.topStrengths.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-xs">✓</span>
                      Top Strengths
                    </h3>
                    <ul className="space-y-2">
                      {result.topStrengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Growth Areas */}
                {result.areasForGrowth.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-xs">↑</span>
                      Areas for Growth
                    </h3>
                    <ul className="space-y-2">
                      {result.areasForGrowth.map((area, idx) => (
                        <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">•</span>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Skills Breakdown */}
          {result.skillAnalysis.skillScores.length > 0 && (
            <div className="card p-6 sm:p-8 mb-10 animate-fade-in-up animation-delay-400">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                Skills Breakdown
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                {result.skillAnalysis.skillScores.map((skill) => (
                  <ProgressBar
                    key={skill.skill}
                    value={skill.score}
                    max={5}
                    label={skill.skill}
                    animated={true}
                  />
                ))}
              </div>

              {/* Skill highlights */}
              <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
                {result.skillAnalysis.strongestSkills.slice(0, 3).map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium rounded-full border border-green-200 dark:border-green-800">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {skill.replace(/_/g, ' ')}
                  </span>
                ))}
                {result.skillAnalysis.weakestSkills.slice(0, 2).map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-medium rounded-full border border-amber-200 dark:border-amber-800">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {skill.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Why This Matters - Credibility Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-violet-900/20 p-6 sm:p-8 mb-10 border border-blue-100 dark:border-blue-800/50 animate-fade-in-up animation-delay-600">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Why This Assessment Matters
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Unlike traditional interviews or generic skill tests, this assessment was <strong>customized specifically</strong> for 
                the <span className="font-semibold text-blue-600 dark:text-blue-400">{assessment.role}</span> role at <span className="font-semibold text-blue-600 dark:text-blue-400">{assessment.company}</span>.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                It tested real scenarios you&apos;d face in the first months on the job — prioritization 
                decisions, stakeholder communication, and strategic thinking specific to this position. 
                Your score reflects how well you&apos;d perform in <em>actual work situations</em>, not how 
                well you memorized answers.
              </p>
            </div>
          </div>

          {/* Question-by-Question Results */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Question-by-Question Breakdown
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={expandAll}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                >
                  Expand All
                </button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button
                  onClick={collapseAll}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                >
                  Collapse All
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {assessment.questions.map((question, idx) => {
                const questionScore = result.questionScores.find(qs => qs.questionId === question.id);
                if (!questionScore) return null;
                const isExpanded = expandedQuestions.has(question.id);

                return (
                  <div
                    key={question.id}
                    className="card overflow-hidden animate-fade-in-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {/* Header - Always visible */}
                    <button
                      onClick={() => toggleQuestion(question.id)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize font-medium">
                          {question.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'px-3 py-1 rounded-full text-sm font-semibold',
                          questionScore.overallScore >= 4 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          questionScore.overallScore >= 3 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                          questionScore.overallScore >= 2 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        )}>
                          {questionScore.overallScore.toFixed(1)}/5 — {getScoreLabel(questionScore.overallScore)}
                        </span>
                        <svg
                          className={cn('w-5 h-5 text-gray-400 transition-transform', isExpanded && 'rotate-180')}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-gray-100 dark:border-slate-700 animate-fade-in">
                        {/* Dimension Scores */}
                        {questionScore.dimensionScores.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                              Score Breakdown
                            </h4>
                            <div className="grid sm:grid-cols-2 gap-3">
                              {questionScore.dimensionScores.map((dim) => (
                                <div key={dim.dimension} className="flex items-center gap-3">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 w-28 capitalize">
                                    {dim.dimension.replace(/_/g, ' ')}
                                  </span>
                                  <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        'h-full rounded-full transition-all duration-500',
                                        dim.score >= 4 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                                        dim.score >= 3 ? 'bg-gradient-to-r from-blue-500 to-indigo-400' :
                                        dim.score >= 2 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 
                                        'bg-gradient-to-r from-red-500 to-orange-400'
                                      )}
                                      style={{ width: `${(dim.score / 5) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8 tabular-nums">
                                    {dim.score.toFixed(1)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Feedback */}
                        {questionScore.specificFeedback && (
                          <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                              💬 Feedback
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                              {questionScore.specificFeedback}
                            </p>
                          </div>
                        )}

                        {/* Strengths & Improvements */}
                        <div className="grid sm:grid-cols-2 gap-4 mt-4">
                          {questionScore.strengths.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                                ✅ Strengths
                              </h4>
                              <ul className="space-y-1">
                                {questionScore.strengths.map((s, i) => (
                                  <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">•</span>{s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {questionScore.improvements.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
                                📈 Areas to Improve
                              </h4>
                              <ul className="space-y-1">
                                {questionScore.improvements.map((imp, i) => (
                                  <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                    <span className="text-amber-500 mt-0.5">•</span>{imp}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Red Flags / Bonuses */}
                        {questionScore.redFlagsTriggered.length > 0 && (
                          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">⚠️ Issues Identified</h4>
                            <ul className="text-sm text-red-600 dark:text-red-400">
                              {questionScore.redFlagsTriggered.map((flag, i) => (
                                <li key={i}>• {flag}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {questionScore.bonusesEarned.length > 0 && (
                          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">🌟 Standout Elements</h4>
                            <ul className="text-sm text-green-600 dark:text-green-400">
                              {questionScore.bonusesEarned.map((bonus, i) => (
                                <li key={i}>• {bonus}</li>
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up">
            <button
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 hover:scale-[1.02]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {copied ? 'Link Copied!' : 'Share Results'}
            </button>
            <Link
              href="/assess"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-900 dark:text-white font-medium rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Take Another Assessment
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-100 dark:border-slate-800 no-print">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-2xs">SP</span>
            </div>
            Assessment powered by SkillProof
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Verified • Ungameable • Role-Specific
          </p>
        </div>
      </footer>
    </div>
  );
}
