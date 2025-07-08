/*
  # Fix user profile creation issue

  1. Changes
    - Update create_user_profile function to use SECURITY DEFINER
    - This allows the function to bypass RLS when creating user profiles
    - Ensures new users can be properly created in the users table

  2. Security
    - SECURITY DEFINER runs with elevated privileges
    - Only affects the specific INSERT operation for user profiles
    - RLS policies remain active for all other operations
*/

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();

-- Recreate function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, is_premium)
  VALUES (NEW.id, NEW.email, false)
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();