-- Allow public read access to rooms for invite links
-- This enables unauthenticated users to view room information via invite links

-- Update the rooms SELECT policy to allow both authenticated and anonymous access
DROP POLICY IF EXISTS "Rooms are viewable by everyone" ON rooms;
CREATE POLICY "Rooms are viewable by everyone"
  ON rooms FOR SELECT
  USING (true);  -- Allow all reads for room discovery via invite links

-- Keep other policies unchanged (insert/update/delete still require auth)
