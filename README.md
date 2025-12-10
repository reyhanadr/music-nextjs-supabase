# Music Party - Next.js + Supabase

A real-time music web application featuring YouTube Music playback with synchronized party mode where multiple users can listen together.

## Features

- ✅ **Authentication** - Email/password login and registration via Supabase Auth
- 🎵 **Music Library** - Full CRUD operations for managing songs from YouTube Music
- 🎧 **Music Player** - Complete playback controls with seek bar, volume, next/previous
- 🎉 **Party Mode** - Real-time synchronized playback across multiple users
- 🎨 **Premium UI** - Modern design with gradients, glassmorphism, and smooth animations
- 📱 **Responsive** - Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, ShadCN UI
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Player**: react-player (YouTube integration)

## Prerequisites

- Node.js 18+ installed
- Supabase account (already configured in this project)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

Go to your Supabase project SQL Editor and run the schema from `supabase/schema.sql`:

```sql
-- Copy and paste the entire content from supabase/schema.sql
-- This will create:
-- - songs table
-- - rooms table  
-- - room_users table
-- - RLS policies
-- - Realtime configuration
```

### 3. Environment Variables

The `.env.local` file is already configured with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://bvwgdzfkckgfiusdolgj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### 1. Register/Login

- Navigate to `/register` to create an account
- Or login at `/login` if you already have an account

### 2. Add Songs

- Go to "Songs" page
- Click "Add Song" button
- Enter:
  - Song title
  - Artist name (optional)
  - YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
- Click "Add Song"

### 3. Play Music

- Click the play button on any song card
- Use player controls at the bottom:
  - Play/Pause
  - Next/Previous
  - Seek bar for navigation
  - Volume control

### 4. Create Party Room

- Go to "Party Rooms" page
- Click "Create Room"
- Enter room name
- Select songs for the playlist
- Click "Create Room"

### 5. Join Party Room

- Browse available rooms on "Party Rooms" page
- Click "Join Room" on any active room
- All users in the room will have synchronized playback:
  - Play/pause syncs across all users
  - Song changes sync instantly
  - Seek position syncs with ±2 second tolerance
  - New users automatically sync to current state

## Project Structure

```
src/
├── app/
│   ├── dashboard/         # Dashboard page
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   ├── songs/            # Songs library page
│   ├── party/            # Party rooms listing
│   │   └── [roomId]/    # Individual party room
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home (redirects to dashboard)
├── components/
│   ├── layout/
│   │   └── Navigation.tsx
│   ├── player/
│   │   └── MusicPlayer.tsx
│   ├── party/
│   │   ├── CreateRoomDialog.tsx
│   │   └── UsersList.tsx
│   └── songs/
│       ├── AddSongDialog.tsx
│       ├── EditSongDialog.tsx
│       └── SongCard.tsx
├── hooks/
│   ├── useAuth.ts        # Authentication hook
│   ├── usePlayer.ts      # Music player hook
│   └── usePartyRoom.ts   # Party room realtime hook
├── lib/
│   ├── supabase/
│   │   ├── client.ts     # Browser client
│   │   ├── server.ts     # Server client
│   │   └── middleware.ts # Auth middleware
│   ├── youtube.ts        # YouTube utilities
│   └── utils.ts          # General utilities
└── types/
    └── index.ts          # TypeScript definitions
```

## Database Schema

### songs
- `id`: UUID (primary key)
- `title`: Text
- `artist`: Text (optional)
- `youtube_url`: Text
- `cover_url`: Text (auto-generated from YouTube)
- `duration`: Integer (seconds)
- `user_id`: UUID (foreign key to auth.users)

### rooms
- `id`: UUID (primary key)
- `name`: Text
- `host_id`: UUID (foreign key to auth.users)
- `current_song_id`: UUID (foreign key to songs)
- `current_time`: Float (playback position)
- `is_playing`: Boolean
- `playlist`: JSONB (array of song IDs)

### room_users
- `id`: UUID (primary key)
- `room_id`: UUID (foreign key to rooms)
- `user_id`: UUID (foreign key to auth.users)

## How Party Mode Works

1. **Room Creation**: Host creates a room and selects playlist
2. **Real-time Subscription**: All users subscribe to room updates via Supabase Realtime
3. **State Synchronization**: 
   - When any user plays/pauses, the `is_playing` field updates
   - When changing songs, `current_song_id` and `current_time` update
   - When seeking, `current_time` updates
4. **Automatic Sync**: New users joining get current state immediately
5. **Tolerance Window**: ±2 second tolerance prevents constant re-syncing

## Troubleshooting

### YouTube Video Won't Play
- Some YouTube videos have embedding restrictions
- Try a different YouTube URL
- Music videos typically work better than official artist channels

### Realtime Not Working
- Ensure Realtime is enabled in Supabase project settings
- Check that the tables have `ALTER PUBLICATION supabase_realtime ADD TABLE` applied
- Verify RLS policies are correctly set

### Authentication Issues
- Clear browser cookies
- Check Supabase project status
- Verify environment variables are correct

## Future Enhancements

- [ ] User avatars upload
- [ ] Room chat functionality
- [ ] Queue management (add/remove songs during playback)
- [ ] Volume synchronization option
- [ ] Private rooms with invite codes
- [ ] Song recommendations
- [ ] Playlists save/load

## License

MIT

## Support

For issues or questions, check the [GitHub repository](https://github.com/yourusername/music-party) or contact support.
