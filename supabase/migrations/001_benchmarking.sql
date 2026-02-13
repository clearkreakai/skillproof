-- Benchmarking table for tracking assessment scores by role category
-- This allows us to show percentile rankings over time

CREATE TABLE IF NOT EXISTS assessment_benchmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Role categorization
  role_category TEXT NOT NULL, -- e.g., 'product_manager', 'sales', 'engineering', etc.
  role_title TEXT, -- Original role title for reference
  company_industry TEXT, -- Optional industry context
  
  -- Scores
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  tier TEXT NOT NULL, -- 'exceptional', 'strong', 'qualified', 'developing', 'not_ready'
  
  -- Integrity metrics
  total_time_seconds INTEGER,
  estimated_time_seconds INTEGER,
  paste_detected BOOLEAN DEFAULT FALSE,
  avg_paste_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Question-level aggregates
  question_count INTEGER,
  avg_time_per_question_seconds DECIMAL(10,2),
  
  -- Metadata (anonymized)
  assessment_id TEXT, -- Reference without PII
  
  -- Indexes for efficient querying
  CONSTRAINT valid_tier CHECK (tier IN ('exceptional', 'strong', 'qualified', 'developing', 'not_ready'))
);

-- Index for fast percentile lookups by role category
CREATE INDEX IF NOT EXISTS idx_benchmarks_role_category ON assessment_benchmarks(role_category);
CREATE INDEX IF NOT EXISTS idx_benchmarks_score ON assessment_benchmarks(role_category, overall_score);
CREATE INDEX IF NOT EXISTS idx_benchmarks_created ON assessment_benchmarks(created_at);

-- Synthetic baseline data (initial benchmarks until real data accumulates)
-- These represent expected score distributions by tier
INSERT INTO assessment_benchmarks (role_category, overall_score, tier, question_count)
VALUES 
  -- Product Manager baselines
  ('product_manager', 90, 'exceptional', 8),
  ('product_manager', 82, 'strong', 8),
  ('product_manager', 72, 'qualified', 8),
  ('product_manager', 58, 'developing', 8),
  ('product_manager', 45, 'not_ready', 8),
  
  -- Sales baselines
  ('sales', 88, 'exceptional', 8),
  ('sales', 80, 'strong', 8),
  ('sales', 70, 'qualified', 8),
  ('sales', 55, 'developing', 8),
  ('sales', 42, 'not_ready', 8),
  
  -- Engineering baselines
  ('engineering', 92, 'exceptional', 8),
  ('engineering', 84, 'strong', 8),
  ('engineering', 74, 'qualified', 8),
  ('engineering', 60, 'developing', 8),
  ('engineering', 48, 'not_ready', 8),
  
  -- Customer Success baselines
  ('customer_success', 87, 'exceptional', 8),
  ('customer_success', 79, 'strong', 8),
  ('customer_success', 69, 'qualified', 8),
  ('customer_success', 54, 'developing', 8),
  ('customer_success', 40, 'not_ready', 8),
  
  -- Marketing baselines
  ('marketing', 89, 'exceptional', 8),
  ('marketing', 81, 'strong', 8),
  ('marketing', 71, 'qualified', 8),
  ('marketing', 56, 'developing', 8),
  ('marketing', 43, 'not_ready', 8),
  
  -- General/Other baselines
  ('general', 85, 'exceptional', 8),
  ('general', 77, 'strong', 8),
  ('general', 67, 'qualified', 8),
  ('general', 52, 'developing', 8),
  ('general', 38, 'not_ready', 8);

-- Function to get percentile rank for a score
CREATE OR REPLACE FUNCTION get_score_percentile(
  p_role_category TEXT,
  p_score INTEGER
) RETURNS INTEGER AS $$
DECLARE
  total_count INTEGER;
  below_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM assessment_benchmarks
  WHERE role_category = p_role_category;
  
  SELECT COUNT(*) INTO below_count
  FROM assessment_benchmarks
  WHERE role_category = p_role_category AND overall_score < p_score;
  
  IF total_count = 0 THEN
    RETURN 50; -- Default to median if no data
  END IF;
  
  RETURN ROUND((below_count::DECIMAL / total_count) * 100);
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE assessment_benchmarks IS 'Stores anonymized assessment scores for benchmarking and percentile calculations';
COMMENT ON FUNCTION get_score_percentile IS 'Returns the percentile rank (0-100) for a given score within a role category';
