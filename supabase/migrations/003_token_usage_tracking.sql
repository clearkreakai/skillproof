-- Migration: Token Usage Tracking
-- Purpose: Track AI model usage and costs for SkillProof assessments
-- Created: 2025-02-10

-- ============================================================================
-- TOKEN USAGE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to assessment (nullable - some calls happen before assessment exists)
  assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
  
  -- What operation was this for?
  step TEXT NOT NULL CHECK (step IN (
    'research_company',       -- Company research
    'extract_role',           -- Role extraction from JD
    'generate_questions',     -- Assessment question generation
    'score_response',         -- Individual response scoring
    'generate_summary',       -- Final summary generation
    'other'                   -- Catch-all for future steps
  )),
  
  -- Which model was used
  model TEXT NOT NULL,
  
  -- Token counts
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  
  -- Cost in USD (calculated based on model pricing)
  cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
  
  -- Flexible metadata for any additional context
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Fast lookup by assessment
CREATE INDEX IF NOT EXISTS idx_token_usage_assessment_id 
  ON token_usage(assessment_id);

-- Analytics queries by step type
CREATE INDEX IF NOT EXISTS idx_token_usage_step 
  ON token_usage(step);

-- Time-based queries for cost analysis
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at 
  ON token_usage(created_at);

-- Model-based queries
CREATE INDEX IF NOT EXISTS idx_token_usage_model 
  ON token_usage(model);

-- Composite index for common analytics query patterns
CREATE INDEX IF NOT EXISTS idx_token_usage_analytics 
  ON token_usage(created_at, step, model);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- Only service role (backend) can insert usage records
CREATE POLICY "Service role can insert token usage" ON token_usage
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Only service role can view usage records (admin/analytics)
CREATE POLICY "Service role can view token usage" ON token_usage
  FOR SELECT
  TO service_role
  USING (true);

-- No updates or deletes - usage records are immutable
-- (If needed, admins can use service role bypass)

-- ============================================================================
-- HELPFUL VIEWS FOR ANALYTICS
-- ============================================================================

-- Daily cost summary
CREATE OR REPLACE VIEW daily_cost_summary AS
SELECT 
  DATE(created_at) as date,
  step,
  model,
  COUNT(*) as call_count,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(cost_usd) as total_cost_usd
FROM token_usage
GROUP BY DATE(created_at), step, model
ORDER BY date DESC, total_cost_usd DESC;

-- Assessment cost breakdown
CREATE OR REPLACE VIEW assessment_costs AS
SELECT 
  assessment_id,
  COUNT(*) as api_calls,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(cost_usd) as total_cost_usd,
  jsonb_object_agg(step, step_cost) as cost_by_step
FROM (
  SELECT 
    assessment_id,
    step,
    SUM(cost_usd) as step_cost,
    SUM(input_tokens) as input_tokens,
    SUM(output_tokens) as output_tokens
  FROM token_usage
  WHERE assessment_id IS NOT NULL
  GROUP BY assessment_id, step
) sub
GROUP BY assessment_id;

-- Model usage summary
CREATE OR REPLACE VIEW model_usage_summary AS
SELECT 
  model,
  COUNT(*) as total_calls,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(cost_usd) as total_cost_usd,
  AVG(cost_usd) as avg_cost_per_call
FROM token_usage
GROUP BY model
ORDER BY total_cost_usd DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE token_usage IS 'Tracks AI model API usage and costs for cost analysis and optimization';
COMMENT ON COLUMN token_usage.step IS 'The assessment pipeline step that triggered this API call';
COMMENT ON COLUMN token_usage.metadata IS 'Additional context like question_id, error info, etc.';
COMMENT ON VIEW daily_cost_summary IS 'Daily aggregated costs by step and model';
COMMENT ON VIEW assessment_costs IS 'Total cost breakdown per assessment';
COMMENT ON VIEW model_usage_summary IS 'Overall model usage and costs';
