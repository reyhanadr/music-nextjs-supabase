'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Song, SongWithOwner, SortOption } from '@/types'
import { useAuth } from '@/hooks/useAuth'

const PAGE_SIZE = 20

interface UseSongsDataOptions {
    searchQuery?: string
    sortBy?: SortOption
}

/**
 * Fetch user's own songs with React Query
 */
export function useMySongs(options: UseSongsDataOptions = {}) {
    const { user } = useAuth()
    const supabase = createClient()
    const { searchQuery = '', sortBy = 'newest' } = options

    return useQuery({
        queryKey: ['songs', 'my', user?.id, searchQuery, sortBy],
        queryFn: async (): Promise<SongWithOwner[]> => {
            if (!user?.id) return []

            let query = supabase
                .from('songs')
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('user_id', user.id)

            // Apply search filter
            if (searchQuery) {
                query = query.or(`title.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%`)
            }

            // Apply sorting
            switch (sortBy) {
                case 'oldest':
                    query = query.order('created_at', { ascending: true })
                    break
                case 'a-z':
                    query = query.order('title', { ascending: true })
                    break
                case 'z-a':
                    query = query.order('title', { ascending: false })
                    break
                case 'newest':
                default:
                    query = query.order('created_at', { ascending: false })
            }

            const { data, error } = await query

            if (error) throw error
            return (data as SongWithOwner[]) || []
        },
        enabled: !!user?.id,
    })
}

/**
 * Fetch global songs (all songs from all users) with infinite scroll
 */
export function useGlobalSongs(options: UseSongsDataOptions = {}) {
    const { user } = useAuth()
    const supabase = createClient()
    const { searchQuery = '', sortBy = 'newest' } = options

    return useInfiniteQuery({
        queryKey: ['songs', 'global', searchQuery, sortBy],
        queryFn: async ({ pageParam = 0 }): Promise<{ songs: SongWithOwner[]; nextCursor: number | null }> => {
            let query = supabase
                .from('songs')
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        full_name,
                        avatar_url
                    )
                `)
                .range(pageParam, pageParam + PAGE_SIZE - 1)

            // Apply search filter - search by title, artist, or owner username
            if (searchQuery) {
                // For owner username search, we need a different approach
                // Basic search for title and artist
                query = query.or(`title.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%`)
            }

            // Apply sorting
            switch (sortBy) {
                case 'oldest':
                    query = query.order('created_at', { ascending: true })
                    break
                case 'a-z':
                    query = query.order('title', { ascending: true })
                    break
                case 'z-a':
                    query = query.order('title', { ascending: false })
                    break
                case 'newest':
                default:
                    query = query.order('created_at', { ascending: false })
            }

            const { data, error } = await query

            if (error) throw error

            const songs = (data as SongWithOwner[]) || []
            const nextCursor = songs.length === PAGE_SIZE ? pageParam + PAGE_SIZE : null

            return { songs, nextCursor }
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: 0,
    })
}

/**
 * Get flattened songs from infinite query
 */
export function flattenGlobalSongs(data: ReturnType<typeof useGlobalSongs>['data']): SongWithOwner[] {
    if (!data?.pages) return []
    return data.pages.flatMap(page => page.songs)
}

/**
 * Fetch recently played songs from Supabase
 */
export function useRecentlyPlayed(limit: number = 50) {
    const { user } = useAuth()
    const supabase = createClient()

    return useQuery({
        queryKey: ['songs', 'recently-played', user?.id],
        queryFn: async (): Promise<SongWithOwner[]> => {
            if (!user?.id) return []

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
                .eq('user_id', user.id)
                .order('played_at', { ascending: false })
                .limit(limit)

            if (error) throw error

            // Extract songs from the joined data
            return (data || [])
                .map(item => item.songs as unknown as SongWithOwner)
                .filter(Boolean)
        },
        enabled: !!user?.id,
    })
}
