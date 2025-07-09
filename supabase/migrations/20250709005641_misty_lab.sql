/*
  # Add original texts to resume analyses

  1. New Columns
    - `original_resume_text` (text) - Stores the original resume text for re-processing
    - `original_job_description` (text) - Stores the original job description for re-processing

  2. Purpose
    - Enables users to revisit past analyses and generate tailored resumes
    - Allows upgrade functionality for historical analyses
    - Supports better user experience for analysis history
*/

-- Add columns to store original texts
ALTER TABLE public.resume_analyses
ADD COLUMN IF NOT EXISTS original_resume_text text,
ADD COLUMN IF NOT EXISTS original_job_description text;

-- Add comment for documentation
COMMENT ON COLUMN public.resume_analyses.original_resume_text IS 'Original resume text used for analysis - enables re-processing';
COMMENT ON COLUMN public.resume_analyses.original_job_description IS 'Original job description text used for analysis - enables re-processing';