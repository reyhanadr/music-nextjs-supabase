-- Migration: Create recently_played table for tracking user's play history
-- Date: 2025-12-14

-- Create recently_played table
CREATE TABLE IF NOT EXISTS recently_played (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicates (we'll update played_at instead)
    UNIQUE(user_id, song_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_recently_played_user_id ON recently_played(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_played_played_at ON recently_played(played_at DESC);

-- Enable RLS
ALTER TABLE recently_played ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own recently played
CREATE POLICY "Users can view own recently played"
    ON recently_played
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own recently played
CREATE POLICY "Users can insert own recently played"
    ON recently_played
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own recently played (for updating played_at)
CREATE POLICY "Users can update own recently played"
    ON recently_played
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own recently played
CREATE POLICY "Users can delete own recently played"
    ON recently_played
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function to upsert recently played (insert or update played_at)
CREATE OR REPLACE FUNCTION upsert_recently_played(p_user_id UUID, p_song_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO recently_played (user_id, song_id, played_at)
    VALUES (p_user_id, p_song_id, NOW())
    ON CONFLICT (user_id, song_id)
    DO UPDATE SET played_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
