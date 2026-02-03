'use client';

import { useState, useEffect, useCallback } from 'react';
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
      {/* Question Header */}
      <div className="bg-gray-50 dark:bg-slate-900 px-6 py-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium capitalize">
            {question.type.replace(/_/g, ' ')}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ~{question.timeGuidance} min
          </span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Question {questionNumber}
        </h2>
      </div>

      {/* Scenario Context */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-900/10">
        <div className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
          📋 Scenario
        </div>
        <p className="text-gray-800 dark:text-gray-200 font-medium mb-3">
          {question.context.role}
        </p>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {question.context.situation}
        </p>
        
        {question.context.constraints.length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
              ⚠️ Constraints:
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {question.context.constraints.map((constraint, idx) => (
                <li key={idx}>{constraint}</li>
              ))}
            </ul>
          </div>
        )}

        {question.context.stakes && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              🎯 Stakes: {question.context.stakes}
            </div>
          </div>
        )}

        {question.context.additionalInfo && Object.keys(question.context.additionalInfo).length > 0 && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-slate-700 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
              📊 Additional Context:
            </div>
            {Object.entries(question.context.additionalInfo).map(([key, value]) => (
              <div key={key} className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">{key}:</span> {value}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* The Question */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700">
        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-2">
          ✍️ Your Task
        </div>
        <p className="text-gray-900 dark:text-white text-lg leading-relaxed">
          {question.prompt}
        </p>
      </div>

      {/* Response Area */}
      <div className="px-6 py-5">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Your Response
          </label>
          <span className={`text-xs ${
            wordCount < minWords ? 'text-amber-600' : 
            wordCount > maxWords ? 'text-red-500' : 'text-green-600'
          }`}>
            {wordCount} words {question.wordGuidance && `(${minWords}-${maxWords} recommended)`}
          </span>
        </div>
        <textarea
          value={response}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={
            question.expectedFormat === 'email' 
              ? 'Write your email here...' 
              : question.expectedFormat === 'slack'
              ? 'Write your Slack message here...'
              : 'Type your response here...'
          }
          className="w-full h-64 p-4 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        
        {/* Format hint */}
        {question.expectedFormat !== 'long_text' && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            💡 Expected format: {question.expectedFormat.replace(/_/g, ' ')}
          </div>
        )}
      </div>
    </div>
  );
}
