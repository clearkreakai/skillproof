'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QuestionCard } from '@/components/assessment';
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
  pasteDetected?: boolean;
  pastedPercentage?: number;
}

export default function TakeAssessmentPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Handle both Promise and direct object (Next.js version compatibility)
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const { id } = resolvedParams;
  const router = useRouter();
  
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, SavedResponse>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'intro' | 'taking' | 'submitting' | 'error'>('loading');
  const [error, setError] = useState('');
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [timeOnQuestion, setTimeOnQuestion] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [savedProgressData, setSavedProgressData] = useState<{ responseId: string; currentQuestion: number; timestamp: number } | null>(null);

  // Save responseId to localStorage for resume capability
  useEffect(() => {
    if (responseId) {
      localStorage.setItem(`mettle_progress_${id}`, JSON.stringify({
        responseId,
        currentQuestion,
        timestamp: Date.now(),
      }));
    }
  }, [responseId, currentQuestion, id]);

  // Handle save and exit
  const handleSaveAndExit = async () => {
    if (!assessment || !responseId) return;
    
    // Save current response
    const question = assessment.questions[currentQuestion];
    const savedResponse = responses[question.id];
    if (savedResponse) {
      await saveResponse(question.id, savedResponse.response, savedResponse.timeSpentSeconds + timeOnQuestion);
    }
    
    // Redirect to home or a "progress saved" page
    router.push(`/assess?saved=${id}`);
  };

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
        
        // Check for saved progress
        const savedProgress = localStorage.getItem(`mettle_progress_${id}`);
        if (savedProgress) {
          try {
            const progress = JSON.parse(savedProgress);
            // Only offer resume if progress is less than 24 hours old
            if (Date.now() - progress.timestamp < 24 * 60 * 60 * 1000) {
              setSavedProgressData(progress);
            } else {
              localStorage.removeItem(`mettle_progress_${id}`);
            }
          } catch {
            localStorage.removeItem(`mettle_progress_${id}`);
          }
        }
        
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

  // Resume a saved assessment
  const resumeAssessment = async () => {
    if (!savedProgressData) return;
    
    try {
      const res = await fetch(`/api/assess/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'resume',
          responseId: savedProgressData.responseId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If resume fails, start fresh
        localStorage.removeItem(`mettle_progress_${id}`);
        setSavedProgressData(null);
        throw new Error(data.error || 'Failed to resume - starting fresh');
      }

      setResponseId(savedProgressData.responseId);
      setCurrentQuestion(data.response.currentQuestion || savedProgressData.currentQuestion);
      
      // Restore saved responses
      if (data.response.responses) {
        const restoredResponses: Record<string, SavedResponse> = {};
        data.response.responses.forEach((r: { questionId: string; response: string; timeSpentSeconds: number }) => {
          restoredResponses[r.questionId] = {
            questionId: r.questionId,
            response: r.response || '',
            timeSpentSeconds: r.timeSpentSeconds || 0,
          };
        });
        setResponses(restoredResponses);
      }
      
      setQuestionStartTime(Date.now());
      setStatus('taking');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume assessment');
    }
  };

  // Clear saved progress and start fresh
  const startFresh = () => {
    localStorage.removeItem(`mettle_progress_${id}`);
    setSavedProgressData(null);
    startAssessment();
  };

  // Handle response change
  const handleResponseChange = useCallback((response: string) => {
    if (!assessment) return;
    
    const question = assessment.questions[currentQuestion];
    const existingTime = responses[question.id]?.timeSpentSeconds || 0;
    const existingPaste = responses[question.id]?.pasteDetected || false;
    const existingPastePercentage = responses[question.id]?.pastedPercentage || 0;
    
    setResponses(prev => ({
      ...prev,
      [question.id]: {
        questionId: question.id,
        response,
        timeSpentSeconds: existingTime + timeOnQuestion,
        pasteDetected: existingPaste,
        pastedPercentage: existingPastePercentage,
      },
    }));
  }, [assessment, currentQuestion, responses, timeOnQuestion]);

  // Handle paste detection
  const handlePasteDetected = useCallback((pasteInfo: { pasted: boolean; pastedLength: number; totalLength: number }) => {
    if (!assessment) return;
    
    const question = assessment.questions[currentQuestion];
    const percentage = pasteInfo.totalLength > 0 
      ? Math.round((pasteInfo.pastedLength / pasteInfo.totalLength) * 100) 
      : 0;
    
    setResponses(prev => ({
      ...prev,
      [question.id]: {
        ...prev[question.id],
        questionId: question.id,
        pasteDetected: true,
        pastedPercentage: Math.max(prev[question.id]?.pastedPercentage || 0, percentage),
      },
    }));
  }, [assessment, currentQuestion]);

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
      // Scroll to top so user sees the new question first
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Navigate to previous question
  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setQuestionStartTime(Date.now());
      setTimeOnQuestion(0);
      // Scroll to top so user sees the question first
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className="min-h-screen bg-slate-900">
        {/* Subtle background pattern */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>

        {/* Nav */}
        <nav className="relative z-10 border-b border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  METTLE
                </span>
                <div className="ml-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 animate-pulse"></div>
              </Link>
            </div>
          </div>
        </nav>

        <main className="relative z-10 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            
            {/* Assessment Header Card */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full border border-slate-700 mb-6">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                <span className="text-sm text-slate-100 font-medium">Assessment Ready</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                {assessment.title}
              </h1>
              <p className="text-slate-300 text-lg max-w-lg mx-auto">
                {assessment.description}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Company</div>
                    <div className="font-semibold text-white">{assessment.company}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Role</div>
                    <div className="font-semibold text-white text-sm">{assessment.role}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Questions</div>
                    <div className="font-semibold text-white text-2xl">{assessment.questionCount}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Duration</div>
                    <div className="font-semibold text-white text-2xl">{assessment.estimatedMinutes}<span className="text-sm text-slate-300 ml-1">min</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 mb-8">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Before You Begin
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-slate-200">1</span>
                  </div>
                  <span>Find a quiet place where you can focus for <span className="text-white font-medium">{assessment.estimatedMinutes} minutes</span></span>
                </li>
                <li className="flex items-start gap-3 text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-slate-200">2</span>
                  </div>
                  <span>Your responses are auto-saved, but try to complete in one session</span>
                </li>
                <li className="flex items-start gap-3 text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-slate-200">3</span>
                  </div>
                  <span>Answer as you would in a real work situation</span>
                </li>
                <li className="flex items-start gap-3 text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-slate-200">4</span>
                  </div>
                  <span>There are no trick questions — we want to see how you think</span>
                </li>
              </ul>
            </div>

            {/* Resume or Start Button */}
            {savedProgressData ? (
              <div className="space-y-4">
                {/* Resume Banner */}
                <div className="p-4 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-green-400 font-medium">Progress Found</p>
                      <p className="text-sm text-slate-400">
                        You were on question {savedProgressData.currentQuestion + 1} of {assessment.questionCount}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={resumeAssessment}
                  className="w-full py-5 bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-white font-semibold rounded-2xl transition-all text-lg flex items-center justify-center gap-3 shadow-lg shadow-green-600/20 hover:shadow-xl hover:shadow-green-600/30 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Resume Assessment
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                <button
                  onClick={startFresh}
                  className="w-full py-3 text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Or start fresh from the beginning
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={startAssessment}
                  className="w-full py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-2xl transition-all text-lg flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Begin Assessment
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>

                <p className="text-center text-slate-400 text-sm mt-6">
                  Your progress is saved automatically
                </p>
              </>
            )}
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
            Our AI is evaluating your responses. This usually takes 2-3 minutes...
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

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Fixed Header */}
        <header className="fixed top-0 w-full bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {/* Top row: Logo + Role info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {/* Mettle Wordmark */}
                <div className="flex items-center">
                  <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                    METTLE
                  </span>
                  <div className="ml-1 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse"></div>
                </div>
                
                {/* Divider */}
                <div className="h-8 w-px bg-gray-200 dark:bg-slate-600"></div>
                
                {/* Role & Company */}
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {assessment.role}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {assessment.company}
                  </div>
                </div>
              </div>
              
              {/* Question counter + Save & Exit */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    Question {currentQuestion + 1} of {assessment.questionCount}
                  </div>
                </div>
                <button
                  onClick={() => setShowExitModal(true)}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Save & Exit
                </button>
              </div>
            </div>
            
            {/* Progress: Step indicators */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: assessment.questionCount }).map((_, idx) => {
                const isCompleted = responses[assessment.questions[idx]?.id]?.response?.trim().length > 0;
                const isCurrent = idx === currentQuestion;
                
                return (
                  <div
                    key={idx}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      isCurrent 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-sm shadow-blue-500/30' 
                        : isCompleted 
                          ? 'bg-blue-500' 
                          : 'bg-gray-200 dark:bg-slate-600'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-28 pb-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <QuestionCard
              key={question.id}
              question={question}
              questionNumber={currentQuestion + 1}
              totalQuestions={assessment.questions.length}
              initialResponse={savedResponse?.response || ''}
              onResponseChange={handleResponseChange}
              onPasteDetected={handlePasteDetected}
              onNext={isLastQuestion ? submitAssessment : goToNext}
              isLastQuestion={isLastQuestion}
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

        {/* Save & Exit Modal */}
        {showExitModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Save & Exit?</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your progress will be saved and you can resume this assessment later. 
                Just return to the same assessment link to continue where you left off.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Keep Going
                </button>
                <button
                  onClick={handleSaveAndExit}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save & Exit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
