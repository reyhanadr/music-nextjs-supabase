-- Create room_messages table for party room chat
CREATE TABLE IF NOT EXISTS room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_created_at ON room_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_room_messages_room_created ON room_messages(room_id, created_at);

-- Enable RLS
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Authenticated users can view messages in any room they are in
DROP POLICY IF EXISTS "Users can view room messages" ON room_messages;
CREATE POLICY "Users can view room messages"
  ON room_messages FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM room_users
      WHERE room_users.room_id = room_messages.room_id
      AND room_users.user_id = auth.uid()
    )
  );

-- Authenticated users can insert their own messages
DROP POLICY IF EXISTS "Users can insert their own messages" ON room_messages;
CREATE POLICY "Users can insert their own messages"
  ON room_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM room_users
      WHERE room_users.room_id = room_messages.room_id
      AND room_users.user_id = auth.uid()
    )
  );

-- Users can delete their own messages
DROP POLICY IF EXISTS "Users can delete their own messages" ON room_messages;
CREATE POLICY "Users can delete their own messages"
  ON room_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Realtime for room_messages
ALTER PUBLICATION supabase_realtime ADD TABLE room_messages;
