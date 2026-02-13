'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { AssessmentQuestion } from '@/lib/assessment/types';

/**
 * Parse and format situation text to improve readability
 * Detects data patterns and structures them
 */
function formatSituationText(text: string): React.ReactNode {
  if (!text) return null;

  // Check if text contains data patterns (percentages, months, metrics)
  const hasDataPatterns = /\d+%|\d+\/\d+|Month \d|Q[1-4]|Year \d|\$[\d,]+/i.test(text);
  
  if (!hasDataPatterns) {
    // Simple text - just improve line breaks
    return <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{text}</p>;
  }

  // Split into sentences for better processing
  const sentences = text.split(/(?<=[.!?])\s+/);
  const introSentences: string[] = [];
  const dataSentences: string[] = [];
  const closingSentences: string[] = [];
  
  let foundData = false;
  let dataEnded = false;
  
  sentences.forEach(sentence => {
    const hasData = /\d+%|\d+\/\d+|Month \d|Q[1-4]|\$[\d,]+/.test(sentence);
    
    if (!foundData && !hasData) {
      introSentences.push(sentence);
    } else if (hasData) {
      foundData = true;
      dataSentences.push(sentence);
    } else if (foundData && !hasData) {
      dataEnded = true;
      closingSentences.push(sentence);
    } else if (dataEnded) {
      closingSentences.push(sentence);
    }
  });

  return (
    <div className="space-y-4">
      {/* Intro */}
      {introSentences.length > 0 && (
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {introSentences.join(' ')}
        </p>
      )}
      
      {/* Data Section */}
      {dataSentences.length > 0 && (
        <div className="p-4 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-gray-200 dark:border-slate-600">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Key Data
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-2">
            {dataSentences.map((sentence, idx) => {
              // Highlight percentages, dollar amounts, and numbered references like (1), (2), etc.
              const highlighted = sentence
                // Numbered task/section references - bold and highlighted
                .replace(
                  /\((\d+)\)/g,
                  '<span class="inline-flex items-center justify-center w-6 h-6 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-xs font-bold rounded-full mx-1">$1</span>'
                )
                // Percentages and dollar amounts - blue highlight
                .replace(
                  /(\d+%|\$[\d,]+(?:\.\d+)?)/g,
                  '<mark class="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-1 rounded font-semibold">$1</mark>'
                );
              return (
                <p 
                  key={idx} 
                  dangerouslySetInnerHTML={{ __html: highlighted }}
                  className="pb-2 border-b border-gray-100 dark:border-slate-700 last:border-0 last:pb-0"
                />
              );
            })}
          </div>
        </div>
      )}
      
      {/* Closing */}
      {closingSentences.length > 0 && (
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
          {closingSentences.join(' ')}
        </p>
      )}
    </div>
  );
}

interface QuestionCardProps {
  question: AssessmentQuestion;
  questionNumber: number;
  totalQuestions?: number;
  initialResponse?: string;
  onResponseChange: (response: string) => void;
  onTimeUpdate?: (seconds: number) => void;
  onPasteDetected?: (pasteInfo: { pasted: boolean; pastedLength: number; totalLength: number }) => void;
  onNext?: () => void;
  isLastQuestion?: boolean;
}

export function QuestionCard({
  question,
  questionNumber,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  totalQuestions,
  initialResponse = '',
  onResponseChange,
  onTimeUpdate,
  onPasteDetected,
  onNext,
  isLastQuestion = false,
}: QuestionCardProps) {
  const [response, setResponse] = useState(initialResponse);
  const [startTime] = useState(Date.now());
  const [isFocused, setIsFocused] = useState(false);
  const [pastedContentLength, setPastedContentLength] = useState(0);

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

  // Handle paste detection
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && pastedText.length > 10) { // Only track meaningful pastes
      const newPastedLength = pastedContentLength + pastedText.length;
      setPastedContentLength(newPastedLength);
      
      // Report paste info after a small delay to get updated response length
      setTimeout(() => {
        if (onPasteDetected) {
          onPasteDetected({
            pasted: true,
            pastedLength: newPastedLength,
            totalLength: response.length + pastedText.length,
          });
        }
      }, 100);
    }
  }, [pastedContentLength, response.length, onPasteDetected]);

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
          <div className="situation-content">
            {formatSituationText(question.context.situation)}
          </div>
        )}
        
        {question.context?.constraints && question.context.constraints.length > 0 && (
          <div className="mt-6 p-5 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl border-2 border-slate-200 dark:border-slate-600 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                Constraints
              </span>
            </div>
            <div className="grid gap-2">
              {question.context.constraints.map((constraint, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                  <span className="flex-shrink-0 w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                    {constraint}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {question.context?.stakes && (
          <div className="mt-4 p-5 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl shadow-lg shadow-red-500/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
                  What&apos;s at Stake
                </div>
                <p className="text-white font-semibold leading-relaxed">
                  {question.context.stakes}
                </p>
              </div>
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
            onPaste={handlePaste}
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

        {/* Auto-save indicator */}
        <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Your response auto-saves
        </div>

        {/* Next/Continue Button */}
        {onNext && (
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onNext}
              disabled={response.trim().length === 0}
              className={cn(
                "w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3",
                response.trim().length > 0
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              )}
            >
              {isLastQuestion ? (
                <>
                  Review & Submit
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              ) : (
                <>
                  Continue to Question {questionNumber + 1}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
