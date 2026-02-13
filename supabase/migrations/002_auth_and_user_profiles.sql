-- ============================================================================
-- Migration: Auth and User Profiles
-- Description: Adds user_profiles table and links assessments to auth.users
-- ============================================================================

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see and update their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Update assessments table to link to users
-- ============================================================================

-- Add user_id column to assessments table (nullable for backward compatibility)
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);

-- Update RLS policies for assessments
-- Drop old public policies if they exist
DROP POLICY IF EXISTS "Allow public access to assessments" ON assessments;

-- New policies that allow both public access (for anonymous users) and user-specific access
CREATE POLICY "Allow public read access to assessments"
  ON assessments FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to assessments"
  ON assessments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own assessments"
  ON assessments FOR UPDATE
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can delete own assessments"
  ON assessments FOR DELETE
  USING (user_id IS NULL OR auth.uid() = user_id);

-- ============================================================================
-- Update responses table RLS (if needed)
-- ============================================================================

-- Keep public access for now but can be tightened later
DROP POLICY IF EXISTS "Allow public access to responses" ON responses;

CREATE POLICY "Allow public read access to responses"
  ON responses FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to responses"
  ON responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to responses"
  ON responses FOR UPDATE
  USING (true);

-- ============================================================================
-- Update results table RLS (if needed)
-- ============================================================================

DROP POLICY IF EXISTS "Allow public access to results" ON results;

CREATE POLICY "Allow public read access to results"
  ON results FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to results"
  ON results FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Indexes for common queries
-- ============================================================================

-- Index for finding results by share token (already exists but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_results_share_token ON results(share_token);

-- Index for finding responses by assessment
CREATE INDEX IF NOT EXISTS idx_responses_assessment_id ON responses(assessment_id);

-- Index for finding results by assessment
CREATE INDEX IF NOT EXISTS idx_results_assessment_id ON results(assessment_id);
