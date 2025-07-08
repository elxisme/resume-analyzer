/*
  # Add cover letter column to resume analyses

  1. Changes
    - Add `cover_letter` column to `resume_analyses` table
    - Column is nullable as not all analyses will have cover letters

  2. Security
    - No changes to RLS policies needed
    - Existing policies will cover the new column
*/

-- Add cover letter column to resume_analyses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resume_analyses' AND column_name = 'cover_letter'
  ) THEN
    ALTER TABLE resume_analyses ADD COLUMN cover_letter text;
  END IF;
END $$;