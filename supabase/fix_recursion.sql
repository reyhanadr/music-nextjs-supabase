-- Fix infinite recursion in room_users RLS policy
-- Run this in Supabase SQL Editor

-- Drop all existing room_users policies
DROP POLICY IF EXISTS "Room users are viewable by room members" ON room_users;
DROP POLICY IF EXISTS "Room users are viewable by authenticated users" ON room_users;
DROP POLICY IF EXISTS "Users can join rooms" ON room_users;
DROP POLICY IF EXISTS "Users can leave rooms" ON room_users;

-- Create simple, non-recursive policies
CREATE POLICY "Room users are viewable by authenticated users"
  ON room_users FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can join rooms"
  ON room_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON room_users FOR DELETE
  USING (auth.uid() = user_id);
