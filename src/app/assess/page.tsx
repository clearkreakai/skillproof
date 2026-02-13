'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

const progressMessages = [
  { text: 'Analyzing job description...', icon: '🔍' },
  { text: 'Identifying key skills...', icon: '🎯' },
  { text: 'Researching company context...', icon: '🏢' },
  { text: 'Crafting scenario questions...', icon: '✍️' },
  { text: 'Calibrating difficulty levels...', icon: '⚖️' },
  { text: 'Finalizing your assessment...', icon: '✨' },
];

const focusAreaOptions = [
  { id: 'technical', label: 'Technical Skills' },
  { id: 'problem-solving', label: 'Problem Solving & Decision Making' },
  { id: 'communication', label: 'Communication & Collaboration' },
  { id: 'strategic', label: 'Strategic Thinking' },
  { id: 'leadership', label: 'Leadership & Management' },
];

const questionCountOptions = [
  { count: 8, label: 'Quick' },
  { count: 12, label: 'Standard' },
  { count: 16, label: 'In-Depth' },
];

export default function AssessStartPage() {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');
  const [progressIndex, setProgressIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

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
          companyWebsite: companyWebsite || undefined,
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
      <Header />

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

            {/* Company Website (Optional) */}
            <div className="card p-6">
              <label 
                htmlFor="companyWebsite" 
                className="block text-sm font-semibold text-gray-900 dark:text-white mb-2"
              >
                Company Website <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="companyWebsite"
                type="url"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                placeholder="e.g., https://stripe.com"
                disabled={status === 'loading'}
                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-all"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Helps us identify the right company, especially for common names
              </p>
            </div>

            {/* Customize Assessment (Collapsible) */}
            <div className="card overflow-hidden">
              <button
                type="button"
                onClick={() => setCustomizeOpen(!customizeOpen)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span className="font-semibold text-gray-900 dark:text-white">Customize Assessment</span>
                  <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full">Premium</span>
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${customizeOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {customizeOpen && (
                <div className="px-6 pb-6 space-y-6 border-t border-gray-100 dark:border-slate-700">
                  {/* Focus Areas */}
                  <div className="pt-6">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Focus Areas <span className="text-gray-400 font-normal">(select up to 2)</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {focusAreaOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setShowPremiumModal(true)}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                        >
                          <div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-slate-500 group-hover:border-blue-500 flex items-center justify-center transition-colors">
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question Count */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Assessment Length
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {questionCountOptions.map((option) => (
                        <button
                          key={option.count}
                          type="button"
                          onClick={() => setShowPremiumModal(true)}
                          className={`p-4 rounded-xl border-2 transition-all text-center ${
                            option.count === 8
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500'
                          }`}
                        >
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{option.count}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{option.label}</div>
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      More questions provide deeper skill analysis
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Premium Modal */}
            {showPremiumModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPremiumModal(false)}>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Premium Feature</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Customize your assessment with focus areas and extended question counts. Upgrade to Premium to unlock these features.
                    </p>
                    <div className="space-y-3">
                      <button
                        type="button"
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all"
                        onClick={() => setShowPremiumModal(false)}
                      >
                        Upgrade to Premium
                      </button>
                      <button
                        type="button"
                        className="w-full py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                        onClick={() => setShowPremiumModal(false)}
                      >
                        Maybe Later
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                      This usually takes 2-3 minutes
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
