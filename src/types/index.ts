export interface Song {
    id: string
    title: string
    artist?: string
    youtube_url: string
    cover_url?: string
    duration?: number
    user_id: string
    created_at: string
    updated_at: string
}

export interface Room {
    id: string
    name: string
    host_id: string
    current_song_id?: string
    current_time: number
    is_playing: boolean
    playlist: string[]
    created_at: string
    updated_at: string
}

export interface RoomUser {
    id: string
    room_id: string
    user_id: string
    joined_at: string
}

export interface Profile {
    id: string
    username?: string
    full_name?: string
    avatar_url?: string
    updated_at?: string
}

export interface PlayerState {
    currentSong: Song | null
    isPlaying: boolean
    currentTime: number
    duration: number
    volume: number
    playlist: Song[]
    currentIndex: number
}

export interface Database {
    public: {
        Tables: {
            songs: {
                Row: Song
                Insert: Omit<Song, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Song, 'id' | 'created_at' | 'updated_at'>>
            }
            rooms: {
                Row: Room
                Insert: Omit<Room, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Room, 'id' | 'created_at' | 'updated_at'>>
            }
            room_users: {
                Row: RoomUser
                Insert: Omit<RoomUser, 'id' | 'joined_at'>
                Update: Partial<Omit<RoomUser, 'id' | 'joined_at'>>
            }
            profiles: {
                Row: Profile
                Insert: Omit<Profile, 'id'>
                Update: Partial<Omit<Profile, 'id'>>
            }
        }
    }
}
