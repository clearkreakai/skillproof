'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const progressMessages = [
  { text: 'Analyzing job description...', icon: '🔍' },
  { text: 'Identifying key skills...', icon: '🎯' },
  { text: 'Researching company context...', icon: '🏢' },
  { text: 'Crafting scenario questions...', icon: '✍️' },
  { text: 'Calibrating difficulty levels...', icon: '⚖️' },
  { text: 'Finalizing your assessment...', icon: '✨' },
];

export default function AssessStartPage() {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');
  const [progressIndex, setProgressIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cycle through progress messages
  useEffect(() => {
    if (status !== 'loading') return;

    const interval = setInterval(() => {
      setProgressIndex((prev) => (prev + 1) % progressMessages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (jobDescription.length < 50) {
      setError('Please provide a more detailed job description (at least 50 characters)');
      return;
    }

    setStatus('loading');
    setError('');
    setProgressIndex(0);

    try {
      const res = await fetch('/api/assess/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          companyName: companyName || undefined,
          questionCount: 8,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate assessment');
      }

      // Navigate to the assessment
      router.push(`/assess/${data.assessmentId}`);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  const charCount = jobDescription.length;
  const isValidLength = charCount >= 50;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-50 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold text-sm">SP</span>
              </div>
              <span className="font-semibold text-xl text-gray-900 dark:text-white">SkillProof</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className={`max-w-2xl mx-auto transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Start Your Assessment
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
              Paste the job description you&apos;re applying for. We&apos;ll generate a custom skills assessment in seconds.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Description */}
            <div className="card p-6">
              <label 
                htmlFor="jobDescription" 
                className="block text-sm font-semibold text-gray-900 dark:text-white mb-2"
              >
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here...

Example:
We're looking for a Senior Product Manager to lead our payments team. You'll be responsible for defining the product roadmap, collaborating with engineering, and driving key metrics..."
                rows={14}
                required
                disabled={status === 'loading'}
                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none transition-all"
              />
              <div className="mt-2 flex justify-between items-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  The more detail you provide, the better your assessment
                </p>
                <span className={`text-sm font-medium tabular-nums ${
                  charCount === 0 ? 'text-gray-400' :
                  isValidLength ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {charCount} characters
                  {charCount > 0 && !isValidLength && ' (min 50)'}
                </span>
              </div>
            </div>

            {/* Company Name (Optional) */}
            <div className="card p-6">
              <label 
                htmlFor="companyName" 
                className="block text-sm font-semibold text-gray-900 dark:text-white mb-2"
              >
                Company Name <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Stripe, Notion, HubSpot..."
                disabled={status === 'loading'}
                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-all"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                If provided, we&apos;ll tailor questions to the company&apos;s context and industry
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 animate-fade-in">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status === 'loading' || !isValidLength}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all text-lg flex items-center justify-center gap-3 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 disabled:shadow-none hover:scale-[1.01] active:scale-[0.99] disabled:scale-100"
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating Your Assessment...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate My Assessment
                </>
              )}
            </button>
          </form>

          {/* Loading Progress */}
          {status === 'loading' && (
            <div className="mt-8 animate-fade-in">
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-2xl animate-bounce-subtle">
                    {progressMessages[progressIndex].icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {progressMessages[progressIndex].text}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This usually takes 10-20 seconds
                    </p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-4 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${((progressIndex + 1) / progressMessages.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Info Cards */}
          <div className={`mt-12 grid sm:grid-cols-2 gap-4 ${status === 'loading' ? 'opacity-50' : ''}`}>
            <div className="card p-5 flex gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">⏱️</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">15-25 minutes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  About as long as a phone screen
                </p>
              </div>
            </div>
            
            <div className="card p-5 flex gap-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">8 Questions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Real scenarios, not trivia
                </p>
              </div>
            </div>
            
            <div className="card p-5 flex gap-4">
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">💬</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Detailed Feedback</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Actionable insights to improve
                </p>
              </div>
            </div>
            
            <div className="card p-5 flex gap-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🔗</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Shareable Results</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Include with your application
                </p>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 flex-wrap">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Your data is secure • No signup required • Free during beta
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
