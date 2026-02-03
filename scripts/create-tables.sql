-- SkillProof Database Schema
-- Run this in the Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/fdgvahmbnljpirynfhpx/sql

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  job_description TEXT NOT NULL,
  assessment_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

-- Responses table (user's answers)
CREATE TABLE IF NOT EXISTS responses (
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
CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  assessment_id TEXT REFERENCES assessments(id),
  response_id TEXT REFERENCES responses(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  result_data JSONB NOT NULL,
  share_token TEXT UNIQUE NOT NULL
);

-- Index for share tokens
CREATE INDEX IF NOT EXISTS idx_results_share_token ON results(share_token);

-- Enable RLS
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Allow public access to assessments" ON assessments;
DROP POLICY IF EXISTS "Allow public access to responses" ON responses;
DROP POLICY IF EXISTS "Allow public access to results" ON results;

-- Allow public read/write for MVP (tighten later for production)
CREATE POLICY "Allow public access to assessments" ON assessments FOR ALL USING (true);
CREATE POLICY "Allow public access to responses" ON responses FOR ALL USING (true);
CREATE POLICY "Allow public access to results" ON results FOR ALL USING (true);

-- Verify tables exist
SELECT 'assessments' as table_name, count(*) as count FROM assessments
UNION ALL
SELECT 'responses', count(*) FROM responses
UNION ALL
SELECT 'results', count(*) FROM results;
