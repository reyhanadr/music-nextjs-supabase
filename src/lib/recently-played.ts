import { Song, SongWithOwner } from '@/types'
import { createClient } from '@/lib/supabase/client'

const RECENTLY_PLAYED_KEY = 'music-recently-played'
const MAX_RECENTLY_PLAYED = 50

// ============================================
// Supabase-backed Recently Played Functions
// ============================================

/**
 * Add a song to recently played in Supabase
 */
export async function addToRecentlyPlayedDB(userId: string, songId: string): Promise<void> {
    const supabase = createClient()

    try {
        // Use upsert to insert or update played_at
        const { error } = await supabase
            .from('recently_played')
            .upsert(
                { user_id: userId, song_id: songId, played_at: new Date().toISOString() },
                { onConflict: 'user_id,song_id' }
            )

        if (error) {
            console.error('Failed to add to recently played:', error)
        }
    } catch (error) {
        console.error('Error adding to recently played:', error)
    }
}

/**
 * Fetch recently played songs from Supabase
 */
export async function fetchRecentlyPlayedDB(userId: string, limit: number = MAX_RECENTLY_PLAYED): Promise<SongWithOwner[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('recently_played')
            .select(`
                song_id,
                played_at,
                songs:song_id (
                    *,
                    profiles:user_id (
                        username,
                        full_name,
                        avatar_url
                    )
                )
            `)
            .eq('user_id', userId)
            .order('played_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Failed to fetch recently played:', error)
            return []
        }

        // Extract songs from the joined data
        return (data || [])
            .map(item => item.songs as unknown as SongWithOwner)
            .filter(Boolean)
    } catch (error) {
        console.error('Error fetching recently played:', error)
        return []
    }
}

/**
 * Clear all recently played for a user
 */
export async function clearRecentlyPlayedDB(userId: string): Promise<void> {
    const supabase = createClient()

    try {
        const { error } = await supabase
            .from('recently_played')
            .delete()
            .eq('user_id', userId)

        if (error) {
            console.error('Failed to clear recently played:', error)
        }
    } catch (error) {
        console.error('Error clearing recently played:', error)
    }
}

// ============================================
// LocalStorage Fallback Functions (for backwards compatibility)
// ============================================

/**
 * Load recently played songs from localStorage (fallback)
 */
export function loadRecentlyPlayed(): Song[] {
    if (typeof window === 'undefined') return []

    try {
        const stored = localStorage.getItem(RECENTLY_PLAYED_KEY)
        if (stored) {
            return JSON.parse(stored) as Song[]
        }
    } catch (error) {
        console.error('Failed to load recently played from localStorage:', error)
    }
    return []
}

/**
 * Save a song to recently played list in localStorage (fallback)
 * Also syncs to Supabase if userId is provided
 */
export function addToRecentlyPlayed(song: Song, userId?: string): void {
    if (typeof window === 'undefined') return

    try {
        // LocalStorage update
        const current = loadRecentlyPlayed()
        const filtered = current.filter(s => s.id !== song.id)
        const updated = [song, ...filtered].slice(0, MAX_RECENTLY_PLAYED)
        localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(updated))

        // Sync to Supabase if user is authenticated
        if (userId) {
            addToRecentlyPlayedDB(userId, song.id).catch(console.error)
        }
    } catch (error) {
        console.error('Failed to save recently played:', error)
    }
}

/**
 * Clear recently played history
 */
export function clearRecentlyPlayed(userId?: string): void {
    if (typeof window === 'undefined') return

    localStorage.removeItem(RECENTLY_PLAYED_KEY)

    if (userId) {
        clearRecentlyPlayedDB(userId).catch(console.error)
    }
}
