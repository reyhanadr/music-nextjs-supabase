-- Migration: Add email and username columns to profiles table
-- Date: 2025-12-11

-- Step 1: Add email column to profiles (nullable first for existing records)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: Add username column with unique constraint
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Step 3: Update handle_new_user function to include email from auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger on_auth_user_created already exists and will use the updated function
