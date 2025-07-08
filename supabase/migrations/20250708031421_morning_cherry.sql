/*
  # Add analysis details column to resume_analyses table

  1. Changes
    - Add `analysis_details` column of type `jsonb` to store detailed analysis results
    - This will store structured data for different analysis types (ATS, Impact Statements, etc.)

  2. Security
    - No RLS changes needed as existing policies cover the new column
*/

-- Add analysis_details column to store structured analysis data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resume_analyses' AND column_name = 'analysis_details'
  ) THEN
    ALTER TABLE resume_analyses ADD COLUMN analysis_details jsonb;
  END IF;
END $$;