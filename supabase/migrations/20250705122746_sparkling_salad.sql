/*
  # Grant permissions to authenticated role

  1. Schema Permissions
    - Grant USAGE on public schema to authenticated role
    
  2. Table Permissions
    - Grant SELECT, INSERT, UPDATE on users table to authenticated role
    - Grant SELECT, INSERT, UPDATE on resume_analyses table to authenticated role
    
  3. Security
    - These grants work in conjunction with RLS policies
    - RLS policies still control which specific rows users can access
*/

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permissions on users table
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Grant permissions on resume_analyses table  
GRANT SELECT, INSERT, UPDATE ON public.resume_analyses TO authenticated;

-- Grant usage on sequences (for auto-generated IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;