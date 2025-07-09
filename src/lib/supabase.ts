import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  email: string;
  is_premium: boolean;
  created_at: string;
}

export interface ResumeAnalysis {
  id: string;
  user_id: string;
  compatibility_score: number;
  keyword_matches: string[];
  experience_gaps: string[];
  skill_gaps: string[];
  tailored_resume?: string;
  cover_letter?: string;
  resume_hash?: string;
  job_description_hash?: string;
  analysis_details?: any;
  original_resume_text?: string;
  original_job_description?: string;
  created_at: string;
}