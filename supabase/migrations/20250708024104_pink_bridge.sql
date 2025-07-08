/*
  # Add profile fields to users table

  1. New Columns
    - `name` (text, nullable) - User's full name
    - `address` (text, nullable) - User's address
    - `profile_picture_url` (text, nullable) - URL to user's profile picture

  2. Changes
    - Add the new columns to the existing users table
    - Update the create_user_profile function to initialize these fields
    - Ensure RLS policies allow users to update these new fields

  3. Security
    - Existing RLS policies already cover these new columns
    - Users can only update their own profile data
*/

-- Add new profile columns to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'name'
  ) THEN
    ALTER TABLE users ADD COLUMN name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'address'
  ) THEN
    ALTER TABLE users ADD COLUMN address text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_picture_url text;
  END IF;
END $$;

-- Update the create_user_profile function to include new fields
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, is_premium, name, address, profile_picture_url)
  VALUES (NEW.id, NEW.email, false, NULL, NULL, NULL)
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;