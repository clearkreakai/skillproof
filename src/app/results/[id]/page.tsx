'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ResultsCard, SkillBreakdown, TierBadge } from '@/components/assessment';
import type { QuestionScore, QuestionType } from '@/lib/assessment/types';

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

  const copyShareLink = async () => {
    if (!shareToken) return;
    
    const shareUrl = `${window.location.origin}/results/${shareToken}?share=true`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">Loading your results...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Results Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link
            href="/assess"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Take a New Assessment
          </Link>
        </div>
      </div>
    );
  }

  if (!result || !assessment) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SP</span>
              </div>
              <span className="font-semibold text-xl text-gray-900 dark:text-white">SkillProof</span>
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={copyShareLink}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
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
                    Share Results
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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Your Assessment Results
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {assessment.role} at {assessment.company} • Completed in {formatTime(result.totalTimeSeconds)}
            </p>
          </div>

          {/* Score Overview */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Tier Badge */}
            <div className="md:col-span-1">
              <TierBadge tier={result.tier} score={result.overallScore} />
            </div>

            {/* Summary */}
            <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Summary
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {result.summary}
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Strengths */}
                {result.topStrengths.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
                      ✅ Top Strengths
                    </h3>
                    <ul className="space-y-1">
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
                    <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">
                      📈 Areas for Growth
                    </h3>
                    <ul className="space-y-1">
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
            <div className="mb-8">
              <SkillBreakdown skills={result.skillAnalysis.skillScores} />
            </div>
          )}

          {/* Why This Assessment Matters */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 mb-8 border border-blue-100 dark:border-blue-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              🎯 Why This Assessment Matters
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Unlike traditional interviews or generic skill tests, this assessment was customized for 
              the <strong>{assessment.role}</strong> role at <strong>{assessment.company}</strong>. 
              It tested real scenarios you&apos;d face in the first months on the job — prioritization 
              decisions, stakeholder communication, and strategic thinking specific to this position.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
              Your score reflects how well you&apos;d perform in actual work situations, not how 
              well you memorized answers. Share these results with confidence.
            </p>
          </div>

          {/* Question-by-Question Results */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Question-by-Question Breakdown
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={expandAll}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Expand All
                </button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button
                  onClick={collapseAll}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Collapse All
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {assessment.questions.map((question, idx) => {
                const questionScore = result.questionScores.find(qs => qs.questionId === question.id);
                if (!questionScore) return null;

                return (
                  <ResultsCard
                    key={question.id}
                    question={{
                      id: question.id,
                      type: question.type as QuestionType,
                      context: question.context || {
                        role: '',
                        situation: '',
                        constraints: [],
                        stakes: '',
                      },
                      prompt: question.prompt,
                      expectedFormat: 'long_text',
                      timeGuidance: 3,
                      rubric: {
                        dimensions: [],
                        levels: {},
                        redFlags: [],
                        bonusIndicators: [],
                      },
                      skillsTested: [],
                      whyThisMatters: question.whyThisMatters,
                      whatGreatLooksLike: '',
                    }}
                    score={questionScore}
                    questionNumber={idx + 1}
                    expanded={expandedQuestions.has(question.id)}
                    onToggle={() => toggleQuestion(question.id)}
                  />
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={copyShareLink}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {copied ? 'Link Copied!' : 'Share Results'}
            </button>
            <Link
              href="/assess"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-900 dark:text-white font-medium rounded-xl transition-colors"
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
      <footer className="py-8 px-4 border-t border-gray-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Assessment powered by SkillProof</p>
          <p className="mt-1">Verified • Ungameable • Specific to this role</p>
        </div>
      </footer>
    </div>
  );
}
