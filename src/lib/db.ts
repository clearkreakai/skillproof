/**
 * Database operations for SkillProof assessments
 */

import { supabase } from './supabase';
import type { Assessment, AssessmentResult, QuestionResponse } from './assessment/types';

// ============================================================================
// TABLE TYPES (matches Supabase schema)
// ============================================================================

export interface DbAssessment {
  id: string;
  created_at: string;
  company_name: string;
  role_title: string;
  job_description: string;
  assessment_data: Assessment;
  status: 'draft' | 'active' | 'completed';
}

export interface DbResponse {
  id: string;
  assessment_id: string;
  created_at: string;
  started_at: string;
  completed_at: string | null;
  responses: QuestionResponse[];
  current_question: number;
  status: 'in_progress' | 'completed' | 'abandoned';
}

export interface DbResult {
  id: string;
  assessment_id: string;
  response_id: string;
  created_at: string;
  result_data: AssessmentResult;
  share_token: string;
}

// ============================================================================
// ASSESSMENT OPERATIONS
// ============================================================================

/**
 * Save a generated assessment
 */
export async function saveAssessment(
  assessment: Assessment,
  jobDescription: string,
  userId?: string
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('assessments')
    .insert({
      id: assessment.id,
      company_name: assessment.company.name,
      role_title: assessment.role.title,
      job_description: jobDescription,
      assessment_data: assessment,
      status: 'active',
      user_id: userId || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving assessment:', error);
    return null;
  }

  return data;
}

/**
 * Get an assessment by ID
 */
export async function getAssessment(id: string): Promise<Assessment | null> {
  const { data, error } = await supabase
    .from('assessments')
    .select('assessment_data')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching assessment:', error);
    return null;
  }

  return data?.assessment_data as Assessment;
}

// ============================================================================
// RESPONSE OPERATIONS
// ============================================================================

/**
 * Start taking an assessment (creates response record)
 */
export async function startAssessment(assessmentId: string): Promise<string | null> {
  const id = `resp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  const { error } = await supabase
    .from('responses')
    .insert({
      id,
      assessment_id: assessmentId,
      started_at: new Date().toISOString(),
      responses: [],
      current_question: 0,
      status: 'in_progress',
    });

  if (error) {
    console.error('Error starting assessment:', error);
    return null;
  }

  return id;
}

/**
 * Save a response to a question (auto-save)
 */
export async function saveQuestionResponse(
  responseId: string,
  questionId: string,
  response: string,
  timeSpentSeconds: number,
  currentQuestion: number
): Promise<boolean> {
  // First get current responses
  const { data: current } = await supabase
    .from('responses')
    .select('responses')
    .eq('id', responseId)
    .single();

  if (!current) return false;

  const responses = current.responses as QuestionResponse[] || [];
  
  // Update or add response
  const existingIdx = responses.findIndex(r => r.questionId === questionId);
  const questionResponse: QuestionResponse = {
    questionId,
    response,
    startedAt: existingIdx >= 0 ? responses[existingIdx].startedAt : new Date(),
    submittedAt: new Date(),
    timeSpentSeconds,
  };

  if (existingIdx >= 0) {
    responses[existingIdx] = questionResponse;
  } else {
    responses.push(questionResponse);
  }

  const { error } = await supabase
    .from('responses')
    .update({
      responses,
      current_question: currentQuestion,
    })
    .eq('id', responseId);

  return !error;
}

/**
 * Get response record
 */
export async function getResponse(responseId: string): Promise<DbResponse | null> {
  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .eq('id', responseId)
    .single();

  if (error) {
    console.error('Error fetching response:', error);
    return null;
  }

  return data as DbResponse;
}

/**
 * Complete an assessment (submit all responses)
 */
export async function completeAssessment(responseId: string): Promise<boolean> {
  const { error } = await supabase
    .from('responses')
    .update({
      completed_at: new Date().toISOString(),
      status: 'completed',
    })
    .eq('id', responseId);

  return !error;
}

// ============================================================================
// RESULT OPERATIONS
// ============================================================================

/**
 * Save assessment results
 */
export async function saveResult(
  assessmentId: string,
  responseId: string,
  result: AssessmentResult
): Promise<string | null> {
  const shareToken = Math.random().toString(36).substring(2, 15);
  
  const { data, error } = await supabase
    .from('results')
    .insert({
      id: result.id,
      assessment_id: assessmentId,
      response_id: responseId,
      result_data: result,
      share_token: shareToken,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving result:', error);
    return null;
  }

  return data?.id || null;
}

/**
 * Get result by ID
 */
export async function getResult(resultId: string): Promise<DbResult | null> {
  const { data, error } = await supabase
    .from('results')
    .select('*')
    .eq('id', resultId)
    .single();

  if (error) {
    console.error('Error fetching result:', error);
    return null;
  }

  return data as DbResult;
}

/**
 * Get result by share token (for public sharing)
 */
export async function getResultByShareToken(token: string): Promise<{
  result: AssessmentResult;
  assessment: Assessment;
} | null> {
  const { data, error } = await supabase
    .from('results')
    .select(`
      result_data,
      assessments (assessment_data)
    `)
    .eq('share_token', token)
    .single();

  if (error || !data) {
    console.error('Error fetching shared result:', error);
    return null;
  }

  const assessments = data.assessments as unknown as { assessment_data: Assessment } | null;
  
  return {
    result: data.result_data as AssessmentResult,
    assessment: assessments?.assessment_data as Assessment,
  };
}

// ============================================================================
// SUPABASE SCHEMA (Run this in Supabase SQL editor)
// ============================================================================

/*
-- Run this SQL in your Supabase project to create the tables

-- Assessments table
CREATE TABLE assessments (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  job_description TEXT NOT NULL,
  assessment_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

-- Responses table (user's answers)
CREATE TABLE responses (
  id TEXT PRIMARY KEY,
  assessment_id TEXT REFERENCES assessments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  responses JSONB DEFAULT '[]'::jsonb,
  current_question INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress'
);

-- Results table (scored results)
CREATE TABLE results (
  id TEXT PRIMARY KEY,
  assessment_id TEXT REFERENCES assessments(id),
  response_id TEXT REFERENCES responses(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  result_data JSONB NOT NULL,
  share_token TEXT UNIQUE NOT NULL
);

-- Index for share tokens
CREATE INDEX idx_results_share_token ON results(share_token);

-- RLS policies (adjust as needed)
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for MVP (tighten later)
CREATE POLICY "Allow public access to assessments" ON assessments FOR ALL USING (true);
CREATE POLICY "Allow public access to responses" ON responses FOR ALL USING (true);
CREATE POLICY "Allow public access to results" ON results FOR ALL USING (true);
*/
