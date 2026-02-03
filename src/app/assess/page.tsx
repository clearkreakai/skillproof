'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AssessStartPage() {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (jobDescription.length < 50) {
      setError('Please provide a more detailed job description (at least 50 characters)');
      return;
    }

    setStatus('loading');
    setError('');
    setProgress('Analyzing job description...');

    try {
      // Simulate progress updates
      setTimeout(() => setProgress('Researching company context...'), 2000);
      setTimeout(() => setProgress('Generating assessment questions...'), 5000);
      setTimeout(() => setProgress('Finalizing your assessment...'), 8000);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Navigation */}
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
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Start Your Assessment
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Paste the job description you&apos;re applying for and we&apos;ll generate a custom skills assessment.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Description */}
            <div>
              <label 
                htmlFor="jobDescription" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={12}
                required
                disabled={status === 'loading'}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {jobDescription.length} characters
                {jobDescription.length < 50 && jobDescription.length > 0 && (
                  <span className="text-amber-600"> (minimum 50)</span>
                )}
              </p>
            </div>

            {/* Company Name (Optional) */}
            <div>
              <label 
                htmlFor="companyName" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Company Name <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Stripe, Notion, HubSpot..."
                disabled={status === 'loading'}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                If provided, we&apos;ll tailor questions to the company&apos;s context
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors text-lg flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating Assessment...
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
            <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{progress}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This usually takes 10-15 seconds</p>
                </div>
              </div>
            </div>
          )}

          {/* Info Cards */}
          <div className="mt-12 grid md:grid-cols-2 gap-4">
            <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
              <div className="text-2xl mb-2">⏱️</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">15-25 minutes</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The assessment takes about as long as a phone screen
              </p>
            </div>
            <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">8 Questions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Scenario-based questions that test real skills
              </p>
            </div>
            <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Detailed Feedback</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get actionable insights on your strengths and growth areas
              </p>
            </div>
            <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
              <div className="text-2xl mb-2">🔗</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Shareable Results</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Share your verified results with potential employers
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
