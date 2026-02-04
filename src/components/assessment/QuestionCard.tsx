'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { AssessmentQuestion } from '@/lib/assessment/types';

interface QuestionCardProps {
  question: AssessmentQuestion;
  questionNumber: number;
  initialResponse?: string;
  onResponseChange: (response: string) => void;
  onTimeUpdate?: (seconds: number) => void;
}

export function QuestionCard({
  question,
  questionNumber,
  initialResponse = '',
  onResponseChange,
  onTimeUpdate,
}: QuestionCardProps) {
  const [response, setResponse] = useState(initialResponse);
  const [startTime] = useState(Date.now());
  const [isFocused, setIsFocused] = useState(false);

  // Track time spent
  useEffect(() => {
    if (!onTimeUpdate) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      onTimeUpdate(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, onTimeUpdate]);

  // Sync response changes
  const handleChange = useCallback((value: string) => {
    setResponse(value);
    onResponseChange(value);
  }, [onResponseChange]);

  // Update when initial response changes (navigation)
  useEffect(() => {
    setResponse(initialResponse);
  }, [initialResponse]);

  const wordCount = response.trim() ? response.trim().split(/\s+/).length : 0;
  const minWords = question.wordGuidance?.min || 50;
  const maxWords = question.wordGuidance?.max || 300;

  // Determine word count status
  const getWordCountStatus = () => {
    if (wordCount === 0) return 'empty';
    if (wordCount < minWords) return 'short';
    if (wordCount > maxWords) return 'long';
    return 'good';
  };

  const wordStatus = getWordCountStatus();

  // Format type for display
  const formatQuestionType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className={cn(
      'card overflow-hidden transition-all duration-300',
      isFocused && 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900'
    )}>
      {/* Question Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800/80 px-6 py-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            {formatQuestionType(question.type)}
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ~{question.timeGuidance} min
            </span>
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Question {questionNumber}
        </h2>
      </div>

      {/* Scenario Context */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10">
        <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 font-semibold mb-3">
          <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-xs">📋</span>
          Scenario
        </div>
        
        {question.context?.role && (
          <p className="text-gray-800 dark:text-gray-200 font-medium mb-3 text-lg">
            {question.context.role}
          </p>
        )}
        {question.context?.situation && (
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {question.context.situation}
          </p>
        )}
        
        {question.context?.constraints && question.context.constraints.length > 0 && (
          <div className="mt-4 p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-gray-200/50 dark:border-slate-600/50">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-semibold mb-2">
              <span className="text-amber-500">⚠️</span>
              Constraints to Consider
            </div>
            <ul className="space-y-1.5">
              {question.context.constraints.map((constraint, idx) => (
                <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  {constraint}
                </li>
              ))}
            </ul>
          </div>
        )}

        {question.context?.stakes && (
          <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200/50 dark:border-amber-700/50">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Stakes: {question.context.stakes}
              </span>
            </div>
          </div>
        )}

        {question.context?.additionalInfo && Object.keys(question.context.additionalInfo).length > 0 && (
          <div className="mt-4 p-4 bg-gray-100/80 dark:bg-slate-700/80 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-semibold mb-2">
              <span>📊</span>
              Additional Context
            </div>
            <div className="space-y-1">
              {Object.entries(question.context.additionalInfo).map(([key, value]) => (
                <div key={key} className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{key}:</span> {value}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* The Question/Task */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-semibold mb-3">
          <span className="w-6 h-6 bg-violet-100 dark:bg-violet-900/40 rounded-lg flex items-center justify-center text-xs">✍️</span>
          Your Task
        </div>
        <p className="text-gray-900 dark:text-white text-lg leading-relaxed">
          {question.prompt}
        </p>
      </div>

      {/* Response Area */}
      <div className="px-6 py-5 bg-gray-50/50 dark:bg-slate-800/50">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Your Response
          </label>
          <div className="flex items-center gap-3">
            {/* Word count indicator */}
            <span className={cn(
              'text-xs font-medium px-2.5 py-1 rounded-full transition-colors',
              wordStatus === 'empty' && 'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-gray-500',
              wordStatus === 'short' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
              wordStatus === 'good' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
              wordStatus === 'long' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            )}>
              {wordCount} words
              {wordStatus === 'short' && ` (min ${minWords})`}
              {wordStatus === 'long' && ` (max ${maxWords})`}
              {wordStatus === 'good' && ' ✓'}
            </span>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={response}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              question.expectedFormat === 'email' 
                ? 'Write your email here...\n\nStart with a subject line, then compose your message.' 
                : question.expectedFormat === 'slack'
                ? 'Write your Slack message here...\n\nBe clear and concise, as you would in real Slack.'
                : question.expectedFormat === 'bullet_list'
                ? 'Structure your response with bullet points...\n\n• Point 1\n• Point 2\n• Point 3'
                : 'Type your response here...\n\nTake your time to think through the scenario. There\'s no single right answer — we want to see how you approach problems.'
            }
            className={cn(
              'w-full h-72 p-4 border rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white',
              'placeholder-gray-400 dark:placeholder-gray-500 resize-none',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'transition-all duration-200',
              wordStatus === 'long' && 'border-red-300 dark:border-red-700',
              wordStatus === 'good' && 'border-green-300 dark:border-green-700',
              wordStatus === 'short' && response.length > 0 && 'border-amber-300 dark:border-amber-700',
              (wordStatus === 'empty' || (wordStatus === 'short' && response.length === 0)) && 'border-gray-200 dark:border-slate-600',
            )}
          />

          {/* Character/word guidance - subtle footer */}
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-gray-500">
            {minWords}-{maxWords} words recommended
          </div>
        </div>
        
        {/* Format hint */}
        {question.expectedFormat !== 'long_text' && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="w-5 h-5 bg-gray-100 dark:bg-slate-700 rounded flex items-center justify-center">💡</span>
            <span>
              Expected format: <span className="font-medium capitalize">{question.expectedFormat.replace(/_/g, ' ')}</span>
            </span>
          </div>
        )}

        {/* Progress indicator */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {wordStatus === 'good' ? (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Good response length
                </span>
              ) : wordStatus === 'short' && response.length > 0 ? (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Add more detail ({minWords - wordCount} more words)
                </span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">Your response auto-saves</span>
              )}
            </span>
            <span className="text-gray-400">
              Press Tab to skip to navigation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
