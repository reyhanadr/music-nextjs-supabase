-- Migration: Add room list optimizations
-- Run this manually in Supabase Dashboard > SQL Editor

-- Add room_state column for room lifecycle (active/idle/closed)
-- Default to 'active' for existing rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_state TEXT DEFAULT 'active';

-- Denormalized song info for fast list display (avoid N+1 joins)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS current_song_title TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS current_song_artist TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS current_song_youtube_url TEXT;

-- Denormalized listener count for fast reads
-- (Updated by triggers or application logic when room_users changes)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS listener_count INTEGER DEFAULT 0;

-- Indexes for common query patterns on room list page
CREATE INDEX IF NOT EXISTS idx_rooms_room_state ON rooms(room_state);
CREATE INDEX IF NOT EXISTS idx_rooms_updated_at ON rooms(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_rooms_is_playing ON rooms(is_playing);
CREATE INDEX IF NOT EXISTS idx_rooms_listener_count ON rooms(listener_count DESC);

-- Trigger function to update listener_count when room_users changes
CREATE OR REPLACE FUNCTION update_room_listener_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE rooms SET listener_count = (
            SELECT COUNT(*) FROM room_users WHERE room_id = NEW.room_id
        ) WHERE id = NEW.room_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE rooms SET listener_count = (
            SELECT COUNT(*) FROM room_users WHERE room_id = OLD.room_id
        ) WHERE id = OLD.room_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on room_users table
DROP TRIGGER IF EXISTS trigger_update_room_listener_count ON room_users;
CREATE TRIGGER trigger_update_room_listener_count
AFTER INSERT OR DELETE ON room_users
FOR EACH ROW EXECUTE FUNCTION update_room_listener_count();

-- Trigger function to update room_state based on activity
CREATE OR REPLACE FUNCTION update_room_state()
RETURNS TRIGGER AS $$
BEGIN
    -- Set room_state to 'idle' if no listeners and not playing
    IF NEW.listener_count = 0 AND (NEW.is_playing IS NULL OR NEW.is_playing = false) THEN
        NEW.room_state = 'idle';
    ELSE
        NEW.room_state = 'active';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on rooms table for state updates
DROP TRIGGER IF EXISTS trigger_update_room_state ON rooms;
CREATE TRIGGER trigger_update_room_state
BEFORE UPDATE OF listener_count, is_playing ON rooms
FOR EACH ROW EXECUTE FUNCTION update_room_state();

-- Trigger function to sync current_song info when current_song_id changes
CREATE OR REPLACE FUNCTION sync_room_current_song()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_song_id IS NOT NULL AND NEW.current_song_id IS DISTINCT FROM OLD.current_song_id THEN
        SELECT title, artist, youtube_url 
        INTO NEW.current_song_title, NEW.current_song_artist, NEW.current_song_youtube_url
        FROM songs WHERE id = NEW.current_song_id;
    ELSIF NEW.current_song_id IS NULL THEN
        NEW.current_song_title = NULL;
        NEW.current_song_artist = NULL;
        NEW.current_song_youtube_url = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on rooms table for song sync
DROP TRIGGER IF EXISTS trigger_sync_room_current_song ON rooms;
CREATE TRIGGER trigger_sync_room_current_song
BEFORE UPDATE OF current_song_id ON rooms
FOR EACH ROW EXECUTE FUNCTION sync_room_current_song();

-- Backfill existing rooms with current song info and listener counts
UPDATE rooms r SET
    current_song_title = s.title,
    current_song_artist = s.artist,
    current_song_youtube_url = s.youtube_url
FROM songs s
WHERE r.current_song_id = s.id AND r.current_song_title IS NULL;

UPDATE rooms r SET
    listener_count = (SELECT COUNT(*) FROM room_users WHERE room_id = r.id);

-- Set initial room_state based on current data
UPDATE rooms SET room_state = CASE
    WHEN listener_count > 0 OR is_playing = true THEN 'active'
    ELSE 'idle'
END;
