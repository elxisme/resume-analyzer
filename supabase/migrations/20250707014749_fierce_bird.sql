/*
  # Add content hashes for deduplication

  1. Changes
    - Add resume_hash column to store SHA-256 hash of resume content
    - Add job_description_hash column to store SHA-256 hash of job description content
    - Create index on user_id, resume_hash, job_description_hash for fast lookups

  2. Security
    - These hashes enable deduplication without storing sensitive content
    - Indexes improve query performance for duplicate detection
*/

-- Add hash columns to resume_analyses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resume_analyses' AND column_name = 'resume_hash'
  ) THEN
    ALTER TABLE resume_analyses ADD COLUMN resume_hash text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resume_analyses' AND column_name = 'job_description_hash'
  ) THEN
    ALTER TABLE resume_analyses ADD COLUMN job_description_hash text;
  END IF;
END $$;

-- Create index for fast duplicate detection
CREATE INDEX IF NOT EXISTS idx_resume_analyses_deduplication 
ON resume_analyses (user_id, resume_hash, job_description_hash);