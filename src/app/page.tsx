'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUser, signOut, onAuthStateChange } from '@/lib/auth';
import type { User } from '@supabase/supabase-js';

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Load user
    getUser().then(u => {
      setUser(u);
      setAuthLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = onAuthStateChange((session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage('You\'re on the list! We\'ll be in touch soon.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/15 rounded-full blur-[100px] animate-pulse-glow animation-delay-2000" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 hero-grid opacity-40 dark:opacity-20" />
      </div>

      {/* Floating Nav */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        {authLoading ? (
          <div className="w-20 h-10 bg-white/20 backdrop-blur-xl rounded-xl animate-pulse" />
        ) : user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <svg 
                className={`w-4 h-4 text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-2 animate-fade-in-down">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </Link>
                <Link
                  href="/assess"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  New Assessment
                </Link>
                <div className="border-t border-gray-100 dark:border-slate-700 mt-2 pt-2">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link
              href="/login"
              className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all"
            >
              Log in
            </Link>
            <Link
              href="/assess"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]"
            >
              Try It Now
            </Link>
          </>
        )}
      </div>

      {/* Hero Section - Full Screen Dictionary Intro */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className={`w-full max-w-5xl mx-auto text-center transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          
          {/* Futuristic Dictionary Card - THE HERO */}
          <div 
            className="relative cursor-pointer group"
            onClick={() => document.getElementById('content')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {/* Outer glow effects */}
            <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/40 via-cyan-400/30 to-blue-500/40 rounded-3xl blur-3xl animate-pulse-glow" />
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 rounded-3xl opacity-30 blur-xl" />
            
            {/* Main card */}
            <div className="relative bg-white dark:bg-slate-900 backdrop-blur-2xl rounded-3xl border-2 border-blue-200/60 dark:border-cyan-500/30 p-10 sm:p-16 lg:p-20 shadow-2xl shadow-blue-500/10 transition-all duration-300 group-hover:shadow-blue-500/20 group-hover:scale-[1.01]">
              {/* Animated border glow */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/5 via-cyan-400/10 to-blue-500/5 pointer-events-none" />
              
              {/* Decorative corner accents */}
              <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-blue-500/40 rounded-tl-3xl" />
              <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-cyan-500/40 rounded-tr-3xl" />
              <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-cyan-500/40 rounded-bl-3xl" />
              <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-blue-500/40 rounded-br-3xl" />
              
              {/* Content */}
              <div className="relative text-left">
                {/* Word and pronunciation line */}
                <div className="flex flex-wrap items-baseline gap-3 sm:gap-5 mb-6">
                  <h1 className="font-serif text-6xl sm:text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Met·tle
                  </h1>
                  <span className="text-2xl sm:text-3xl text-gray-400 dark:text-gray-500 font-mono tracking-wide">/ˈmedl/</span>
                  <span className="text-xl text-gray-400 dark:text-gray-500 italic">noun</span>
                </div>
                
                {/* Definition */}
                <p className="text-xl sm:text-2xl text-gray-500 dark:text-gray-400 leading-relaxed font-light italic">
                  the stuff you&apos;re made of
                </p>
              </div>
              
              {/* Subtle scan line effect */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-40 animate-scan" />
              </div>
            </div>
            
            {/* Continue indicator */}
            <div className="mt-8 flex flex-col items-center animate-bounce-subtle">
              <span className="text-sm text-gray-500 dark:text-gray-400 mb-2 group-hover:text-blue-500 transition-colors">Click to continue</span>
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section id="content" className="relative -mt-12 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          {/* Tagline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-snug mb-6">
            Resumes show where you&apos;ve been.
            <span className="block gradient-text">Mettle shows what you can do.</span>
          </h2>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed text-balance">
            In the AI age, credentials matter less. <strong className="text-gray-900 dark:text-white">Proven skills</strong> matter more than ever.
            Generate custom assessments from real job postings and prove you can do the work.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link
              href="/assess"
              className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all duration-300 text-lg shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-[1.02]"
            >
              <svg className="w-5 h-5 group-hover:animate-bounce-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Your Assessment
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
            </Link>
          </div>

        </div>

        {/* Hero Visual: Mockup/Preview */}
        <div className={`max-w-4xl mx-auto mt-16 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="relative">
            {/* Glow effect behind card */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 rounded-3xl blur-2xl transform scale-105" />
            
            {/* Card */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="max-w-xs mx-auto h-6 bg-gray-200 dark:bg-slate-700 rounded-md flex items-center justify-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">getmettle.io/assess</span>
                  </div>
                </div>
              </div>
              
              {/* Content preview */}
              <div className="p-6 sm:p-8">
                <div className="flex items-start gap-6">
                  {/* Score visualization */}
                  <div className="hidden sm:block flex-shrink-0">
                    <div className="relative w-28 h-28">
                      <svg className="w-28 h-28 transform -rotate-90">
                        <circle cx="56" cy="56" r="48" fill="none" strokeWidth="8" className="stroke-gray-200 dark:stroke-slate-700" />
                        <circle cx="56" cy="56" r="48" fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-green-500" strokeDasharray="301.59" strokeDashoffset="60.32" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">82</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">/ 100</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Results preview */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold rounded-full">
                        ✅ Strong
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Sr. Product Manager at Stripe</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Strategic Thinking</span>
                          <span className="font-medium text-gray-900 dark:text-white">88%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full w-[88%] bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Communication</span>
                          <span className="font-medium text-gray-900 dark:text-white">76%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full w-[76%] bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Prioritization</span>
                          <span className="font-medium text-gray-900 dark:text-white">84%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full w-[84%] bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">~20min</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Average Assessment</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">Real</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Scenario-Based Questions</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">AI</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Powered Evaluation</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">∞</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Shareable Results</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Three steps to prove your skills
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Stand out from hundreds of applicants with verified, job-specific assessments
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Step 1 */}
            <div className="group relative">
              <div className="card p-8 h-full transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                    <span className="text-2xl font-bold text-white">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Paste Job Description & Company
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Copy any job posting you&apos;re applying for and add the company details. Our AI extracts the key skills and requirements that actually matter.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative">
              <div className="card p-8 h-full transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/30">
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Take Your Assessment
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Complete scenario-based questions designed to test the actual skills needed for that specific role. Quick and focused.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative">
              <div className="card p-8 h-full transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/30">
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Share Your Results
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Get a detailed score breakdown and shareable certificate. Include it with your application to stand out instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Who it&apos;s for
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Skills should speak louder than credentials
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Job Seekers */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-blue-50 to-cyan-50 dark:from-blue-900/20 dark:via-blue-900/20 dark:to-cyan-900/20 p-8 lg:p-10 border border-blue-100 dark:border-blue-800/50">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/30">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Job Seekers
                </h3>
                <ul className="space-y-4">
                  {[
                    'Stand out in a sea of similar resumes',
                    'Prove skills when changing careers',
                    'Test your readiness before you apply',
                    'Get actionable feedback on skill gaps',
                    'Build a portfolio of verified skills',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Companies */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-teal-900/20 p-8 lg:p-10 border border-emerald-100 dark:border-emerald-800/50">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Companies
                </h3>
                <span className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-full mb-4">
                  Coming Soon
                </span>
                <ul className="space-y-4">
                  {[
                    'Evaluate candidates on actual job skills',
                    'Reduce time wasted on unqualified candidates',
                    'Make objective, data-driven hiring decisions',
                    'Custom assessments for any role',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                      <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section id="waitlist" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
        
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Ready to prove what you can do?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of professionals using Mettle to stand out
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-5 py-4 rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent backdrop-blur-sm text-base"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-8 py-4 bg-white hover:bg-gray-50 disabled:bg-gray-200 text-blue-600 font-semibold rounded-xl transition-all duration-200 whitespace-nowrap shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
            >
              {status === 'loading' ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Joining...
                </span>
              ) : 'Get Updates'}
            </button>
          </form>
          
          {message && (
            <p className={`text-sm ${status === 'success' ? 'text-green-200' : 'text-red-200'}`}>
              {message}
            </p>
          )}

          <p className="text-sm text-blue-200">
            Or <Link href="/assess" className="underline hover:text-white transition-colors">try it now</Link> — no signup required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center">
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                METTLE
              </span>
              <div className="ml-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-8 text-gray-400">
              <a href="mailto:hello@getmettle.io" className="hover:text-white transition-colors text-sm">
                Contact
              </a>
              <a href="#" className="hover:text-white transition-colors text-sm">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors text-sm">
                Terms
              </a>
            </div>
          </div>
          
          {/* Dictionary Footer Signature */}
          <div className="mt-10 pt-8 border-t border-gray-800">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 text-gray-500">
                <span className="font-serif text-lg text-gray-300 tracking-tight">met·tle</span>
                <span className="mx-2 text-gray-600">·</span>
                <span className="text-sm text-gray-500 font-mono">/ˈmedl/</span>
                <span className="mx-2 text-gray-600">·</span>
                <span className="text-sm text-gray-500 italic">noun</span>
              </div>
              <p className="text-gray-400 text-sm max-w-md leading-relaxed">
                the stuff you&apos;re made of
              </p>
              <p className="mt-6 text-gray-600 text-xs">
                © {new Date().getFullYear()} Mettle by ClearKreak. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
