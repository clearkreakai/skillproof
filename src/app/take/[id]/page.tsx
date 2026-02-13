'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface AssessmentInfo {
  id: string;
  title: string;
  description: string;
  company: string;
  role: string;
  questionCount: number;
  estimatedMinutes: number;
}

export default function TakeAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [assessment, setAssessment] = useState<AssessmentInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting' | 'error'>('loading');
  const [error, setError] = useState('');
  
  // Candidate info
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');

  useEffect(() => {
    async function loadAssessment() {
      try {
        const res = await fetch(`/api/assess/${id}`);
        if (!res.ok) {
          throw new Error('Assessment not found');
        }
        const json = await res.json();
        const data = json.assessment || json; // Handle both wrapped and unwrapped responses
        
        // Handle both nested objects and flat strings for company/role
        const companyName = typeof data.company === 'string' ? data.company : data.company?.name || 'Company';
        const roleName = typeof data.role === 'string' ? data.role : data.role?.title || 'Role';
        
        setAssessment({
          id: data.id,
          title: data.title || `${roleName} Assessment`,
          description: data.description || `Skills assessment for ${roleName} at ${companyName}`,
          company: companyName,
          role: roleName,
          questionCount: data.questionCount || data.questions?.length || 8,
          estimatedMinutes: data.estimatedMinutes || 20,
        });
        setStatus('ready');
      } catch (err) {
        console.error('Failed to load assessment:', err);
        setError('Assessment not found or no longer available.');
        setStatus('error');
      }
    }
    loadAssessment();
  }, [id]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!candidateName.trim() || !candidateEmail.trim()) {
      setError('Please enter your name and email');
      return;
    }

    // Basic email validation
    if (!candidateEmail.includes('@') || !candidateEmail.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    setStatus('submitting');
    setError('');

    try {
      // Store candidate info in localStorage for the assessment to pick up
      localStorage.setItem(`mettle_candidate_${id}`, JSON.stringify({
        name: candidateName.trim(),
        email: candidateEmail.trim(),
        startedAt: new Date().toISOString(),
      }));

      // Navigate to the assessment
      router.push(`/assess/${id}?mode=take`);
    } catch (err) {
      console.error('Failed to start assessment:', err);
      setError('Failed to start assessment. Please try again.');
      setStatus('ready');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-cyan-500 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-400">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (status === 'error' && !assessment) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Assessment Not Found</h1>
          <p className="text-slate-400 mb-8">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <nav className="relative z-10 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              METTLE
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 animate-pulse" />
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-16">
        {/* Assessment info card */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
            <span className="text-sm text-cyan-400 font-medium">Skills Assessment</span>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            {assessment?.role}
          </h1>
          <p className="text-slate-400 mb-6">
            {assessment?.company}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{assessment?.questionCount}</div>
              <div className="text-sm text-slate-400">Questions</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">~{assessment?.estimatedMinutes} min</div>
              <div className="text-sm text-slate-400">Estimated time</div>
            </div>
          </div>

          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
            <p className="text-sm text-slate-300 leading-relaxed">
              {assessment?.description}
            </p>
          </div>
        </div>

        {/* Candidate form */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Enter your information to begin</h2>
          
          <form onSubmit={handleStart} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="John Smith"
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                placeholder="john@example.com"
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:shadow-none"
            >
              {status === 'submitting' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Starting...
                </span>
              ) : (
                'Start Assessment'
              )}
            </button>

            <p className="text-xs text-slate-500 text-center">
              By starting this assessment, you agree to have your responses evaluated and shared with {assessment?.company}.
            </p>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-8 p-6 bg-slate-900/30 border border-slate-800/50 rounded-xl">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Before you begin:</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Find a quiet place with stable internet
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Set aside approximately {assessment?.estimatedMinutes} minutes
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Your progress is saved automatically
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
