'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProgressBar, QuestionCard } from '@/components/assessment';
import type { AssessmentQuestion } from '@/lib/assessment/types';

interface AssessmentData {
  id: string;
  title: string;
  description: string;
  company: string;
  role: string;
  estimatedMinutes: number;
  questionCount: number;
  questions: AssessmentQuestion[];
}

interface SavedResponse {
  questionId: string;
  response: string;
  timeSpentSeconds: number;
}

export default function TakeAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, SavedResponse>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'intro' | 'taking' | 'submitting' | 'error'>('loading');
  const [error, setError] = useState('');
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [timeOnQuestion, setTimeOnQuestion] = useState(0);

  // Fetch assessment data
  useEffect(() => {
    async function fetchAssessment() {
      try {
        const res = await fetch(`/api/assess/${id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load assessment');
        }

        setAssessment(data.assessment);
        setStatus('intro');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assessment');
        setStatus('error');
      }
    }

    fetchAssessment();
  }, [id]);

  // Timer for current question
  useEffect(() => {
    if (status !== 'taking') return;

    const interval = setInterval(() => {
      setTimeOnQuestion(Math.floor((Date.now() - questionStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [status, questionStartTime]);

  // Save response to server
  const saveResponse = useCallback(async (questionId: string, response: string, timeSpent: number) => {
    if (!responseId) return;

    try {
      await fetch(`/api/assess/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          responseId,
          questionId,
          response,
          timeSpentSeconds: timeSpent,
          currentQuestion,
        }),
      });
    } catch (err) {
      console.error('Failed to auto-save:', err);
    }
  }, [id, responseId, currentQuestion]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (status !== 'taking' || !responseId || !assessment) return;

    const interval = setInterval(() => {
      const question = assessment.questions[currentQuestion];
      const savedResponse = responses[question.id];
      
      if (savedResponse) {
        saveResponse(question.id, savedResponse.response, savedResponse.timeSpentSeconds);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [status, responseId, assessment, currentQuestion, responses, saveResponse]);

  // Start the assessment
  const startAssessment = async () => {
    try {
      const res = await fetch(`/api/assess/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start assessment');
      }

      setResponseId(data.responseId);
      setQuestionStartTime(Date.now());
      setStatus('taking');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start assessment');
    }
  };

  // Handle response change
  const handleResponseChange = useCallback((response: string) => {
    if (!assessment) return;
    
    const question = assessment.questions[currentQuestion];
    const existingTime = responses[question.id]?.timeSpentSeconds || 0;
    
    setResponses(prev => ({
      ...prev,
      [question.id]: {
        questionId: question.id,
        response,
        timeSpentSeconds: existingTime + timeOnQuestion,
      },
    }));
  }, [assessment, currentQuestion, responses, timeOnQuestion]);

  // Navigate to next question
  const goToNext = async () => {
    if (!assessment) return;
    
    const question = assessment.questions[currentQuestion];
    const savedResponse = responses[question.id];
    
    // Save current response
    if (savedResponse) {
      const totalTime = savedResponse.timeSpentSeconds + timeOnQuestion;
      setResponses(prev => ({
        ...prev,
        [question.id]: { ...savedResponse, timeSpentSeconds: totalTime },
      }));
      await saveResponse(question.id, savedResponse.response, totalTime);
    }

    if (currentQuestion < assessment.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setQuestionStartTime(Date.now());
      setTimeOnQuestion(0);
    }
  };

  // Navigate to previous question
  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setQuestionStartTime(Date.now());
      setTimeOnQuestion(0);
    }
  };

  // Submit assessment
  const submitAssessment = async () => {
    if (!assessment || !responseId) return;

    setStatus('submitting');

    try {
      // Save final response
      const question = assessment.questions[currentQuestion];
      const savedResponse = responses[question.id];
      if (savedResponse) {
        await saveResponse(
          question.id,
          savedResponse.response,
          savedResponse.timeSpentSeconds + timeOnQuestion
        );
      }

      // Mark as complete
      await fetch(`/api/assess/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', responseId }),
      });

      // Score the assessment
      const scoreRes = await fetch(`/api/assess/${id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId }),
      });

      const scoreData = await scoreRes.json();

      if (!scoreRes.ok) {
        throw new Error(scoreData.error || 'Failed to score assessment');
      }

      // Navigate to results
      router.push(`/results/${scoreData.resultId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
      setStatus('taking');
    }
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
          <p className="text-gray-600 dark:text-gray-400">Loading assessment...</p>
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
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link
            href="/assess"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Over
          </Link>
        </div>
      </div>
    );
  }

  // Intro state (before starting)
  if (status === 'intro' && assessment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <nav className="fixed top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 border-b border-gray-100 dark:border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SP</span>
                </div>
                <span className="font-semibold text-xl text-gray-900 dark:text-white">SkillProof</span>
              </Link>
            </div>
          </div>
        </nav>

        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
                <h1 className="text-2xl font-bold mb-2">{assessment.title}</h1>
                <p className="text-blue-100">{assessment.description}</p>
              </div>

              {/* Assessment Info */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl">
                    <div className="text-2xl mb-1">🏢</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Company</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{assessment.company}</div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl">
                    <div className="text-2xl mb-1">💼</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Role</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{assessment.role}</div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl">
                    <div className="text-2xl mb-1">❓</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Questions</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{assessment.questionCount}</div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl">
                    <div className="text-2xl mb-1">⏱️</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Estimated Time</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{assessment.estimatedMinutes} minutes</div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 mb-6">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Before you begin:</h3>
                  <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
                    <li>• Find a quiet place where you can focus for {assessment.estimatedMinutes} minutes</li>
                    <li>• Your responses are auto-saved, but try to complete in one session</li>
                    <li>• Answer as you would in a real work situation</li>
                    <li>• There are no trick questions — we want to see how you think</li>
                  </ul>
                </div>

                {/* Start Button */}
                <button
                  onClick={startAssessment}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Begin Assessment
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Submitting state
  if (status === 'submitting') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Scoring Your Assessment
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Our AI is evaluating your responses. This usually takes 30-60 seconds...
          </p>
        </div>
      </div>
    );
  }

  // Taking assessment
  if (status === 'taking' && assessment) {
    const question = assessment.questions[currentQuestion];
    const savedResponse = responses[question.id];
    const isLastQuestion = currentQuestion === assessment.questions.length - 1;
    const answeredCount = Object.keys(responses).filter(k => responses[k].response.trim().length > 0).length;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Fixed Header */}
        <header className="fixed top-0 w-full bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 z-50">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SP</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {assessment.role}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {assessment.company}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {answeredCount}/{assessment.questionCount} answered
              </div>
            </div>
            <ProgressBar
              current={currentQuestion + 1}
              total={assessment.questionCount}
            />
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-28 pb-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <QuestionCard
              key={question.id}
              question={question}
              questionNumber={currentQuestion + 1}
              initialResponse={savedResponse?.response || ''}
              onResponseChange={handleResponseChange}
            />
          </div>
        </main>

        {/* Fixed Footer Navigation */}
        <footer className="fixed bottom-0 w-full bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={goToPrevious}
                disabled={currentQuestion === 0}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {isLastQuestion ? (
                <button
                  onClick={submitAssessment}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  Submit Assessment
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={goToNext}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  Next
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return null;
}
