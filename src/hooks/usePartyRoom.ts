'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Room, Song } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface RoomUser {
    id: string
    room_id: string
    user_id: string
    profiles?: {
        full_name?: string
        username?: string
        avatar_url?: string
    }
}

export function usePartyRoom(roomId: string) {
    const [room, setRoom] = useState<Room | null>(null)
    const [currentSong, setCurrentSong] = useState<Song | null>(null)
    const [isHost, setIsHost] = useState(false)
    const [users, setUsers] = useState<RoomUser[]>([])
    const [presenceUsers, setPresenceUsers] = useState<any[]>([])
    const [playlist, setPlaylist] = useState<Song[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const { user } = useAuth()
    const router = useRouter()
    const isUpdatingRef = useRef(false)
    const broadcastChannelRef = useRef<any>(null)

    // Debug: Log presence count changes only
    useEffect(() => {
        console.log('🟢 Presence count:', presenceUsers.length)
    }, [presenceUsers.length])

    // Fetch room data
    const fetchRoom = useCallback(async () => {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', roomId)
            .single()

        if (error || !data) {
            router.push('/party')
            return
        }

        setRoom(data as Room)
        setIsHost((data as Room).host_id === user?.id)

        // Fetch current song
        if ((data as Room).current_song_id) {
            const { data: songData } = await supabase
                .from('songs')
                .select('*')
                .eq('id', (data as Room).current_song_id!)
                .single()

            if (songData) setCurrentSong(songData as Song)
        }

        // Fetch playlist songs
        const roomData = data as Room
        if (roomData.playlist && Array.isArray(roomData.playlist)) {
            const { data: playlistData } = await supabase
                .from('songs')
                .select('*')
                .in('id', roomData.playlist)

            if (playlistData) {
                // Sort according to playlist order
                const sorted = roomData.playlist
                    .map((id: string) => (playlistData as Song[]).find(s => s.id === id))
                    .filter(Boolean) as Song[]
                setPlaylist(sorted)
            }
        }

        setLoading(false)
    }, [roomId, supabase, router, user])

    // Fetch users in room
    const fetchUsers = useCallback(async () => {
        const { data: roomUsersData, error: roomUsersError } = await supabase
            .from('room_users')
            .select('*')
            .eq('room_id', roomId)

        if (roomUsersError) {
            console.error('Error fetching users:', roomUsersError)
            return
        }

        if (roomUsersData && roomUsersData.length > 0) {
            const userIds = roomUsersData.map((ru: any) => ru.user_id)

            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', userIds)

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError)
            }

            const usersWithProfiles = roomUsersData.map((ru: any) => {
                const profile = profilesData?.find((p: any) => p.id === ru.user_id)
                return {
                    ...ru,
                    profiles: profile || null
                }
            })

            setUsers(usersWithProfiles as RoomUser[])
        } else {
            setUsers([])
        }
    }, [roomId, supabase])

    // Join room
    const joinRoom = useCallback(async () => {
        if (!user?.id) return

        const { error } = await supabase
            .from('room_users')
            .insert({ room_id: roomId, user_id: user.id })

        if (!error) {
            fetchUsers()
        }
    }, [roomId, user, supabase, fetchUsers])

    // Leave room
    const leaveRoom = useCallback(async () => {
        if (!user?.id) return

        await supabase
            .from('room_users')
            .delete()
            .eq('room_id', roomId)
            .eq('user_id', user.id)

        router.push('/party')
    }, [roomId, user, supabase, router])

    // Update room state
    const updateRoomState = useCallback(async (updates: Partial<Room>) => {
        if (isUpdatingRef.current) return
        isUpdatingRef.current = true

        await supabase
            .from('rooms')
            .update(updates as Record<string, unknown>)
            .eq('id', roomId)

        isUpdatingRef.current = false
    }, [roomId, supabase])

    // Play/pause (async for loading state)
    const setPlaying = useCallback(async (playing: boolean) => {
        await updateRoomState({ is_playing: playing })
    }, [updateRoomState])

    // Seek to position (updates database, syncs all users)
    const seekTo = useCallback(async (seconds: number) => {
        await updateRoomState({ current_time: seconds })
    }, [updateRoomState])

    // Update current time (used by host to periodically sync via database)
    const updateCurrentTime = useCallback(async (seconds: number) => {
        await updateRoomState({ current_time: seconds })
    }, [updateRoomState])

    // Broadcast progress in real-time (host only, per 200ms)
    const broadcastProgress = useCallback((currentTime: number, isPlaying: boolean) => {
        if (!broadcastChannelRef.current || !isHost) return

        try {
            broadcastChannelRef.current.send({
                type: 'broadcast',
                event: 'progress',
                payload: {
                    current_time: currentTime,
                    is_playing: isPlaying,
                    timestamp: Date.now()
                }
            })
        } catch (error) {
            console.error('Broadcast error:', error)
        }
    }, [isHost])

    // Next song
    const nextSong = useCallback(() => {
        if (!room || !playlist.length) return

        const currentIndex = playlist.findIndex(s => s.id === room.current_song_id)
        const nextIndex = (currentIndex + 1) % playlist.length
        const next = playlist[nextIndex]

        updateRoomState({
            current_song_id: next.id,
            current_time: 0,
            is_playing: true,
        })
    }, [room, playlist, updateRoomState])

    // Previous song
    const previousSong = useCallback(() => {
        if (!room || !playlist.length) return

        const currentIndex = playlist.findIndex(s => s.id === room.current_song_id)
        const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1
        const prev = playlist[prevIndex]

        updateRoomState({
            current_song_id: prev.id,
            current_time: 0,
            is_playing: true,
        })
    }, [room, playlist, updateRoomState])

    // Subscribe to room changes
    useEffect(() => {
        if (!user?.id) {
            console.warn('No user ID, skipping room subscription')
            return
        }

        fetchRoom()
        fetchUsers()
        joinRoom()

        // Realtime subscription for room updates with Presence and Broadcast
        const roomChannel = supabase
            .channel(`room:${roomId}`, {
                config: {
                    presence: {
                        key: user.id,
                    },
                    broadcast: {
                        self: false, // Don't send to self
                    },
                },
            })
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'rooms',
                    filter: `id=eq.${roomId}`,
                },
                async (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        const newRoom = payload.new as Room
                        setRoom(newRoom)

                        // Update current song if changed
                        if (newRoom.current_song_id !== room?.current_song_id) {
                            const { data: songData } = await supabase
                                .from('songs')
                                .select('*')
                                .eq('id', newRoom.current_song_id!)
                                .single()

                            if (songData) setCurrentSong(songData as Song)
                        }
                    }
                }
            )
            .on('broadcast', { event: 'progress' }, ({ payload }) => {
                // Non-host users receive real-time progress updates
                if (!isHost && payload) {
                    // Trigger callback to party room page for sync
                    const event = new CustomEvent('broadcast-progress', {
                        detail: {
                            current_time: payload.current_time,
                            is_playing: payload.is_playing,
                            timestamp: payload.timestamp
                        }
                    })
                    window.dispatchEvent(event)
                }
            })
            .on('presence', { event: 'sync' }, () => {
                const state = roomChannel.presenceState()
                const online = Object.values(state).flat()
                // Force new array reference for React re-render
                setPresenceUsers([...online])
                console.log('🟢 Presence synced:', online.length, 'online')
            })
            .on('presence', { event: 'join' }, () => {
                // Sync will be triggered automatically
            })
            .on('presence', { event: 'leave' }, () => {
                // Sync will be triggered automatically  
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Store channel reference for broadcasting
                    broadcastChannelRef.current = roomChannel

                    setTimeout(async () => {
                        try {
                            await roomChannel.track({
                                user_id: user.id,
                                online_at: new Date().toISOString(),
                            })
                            console.log('✅ Presence tracking active')
                        } catch (error) {
                            console.error('Presence track error:', error)
                        }
                    }, 100)
                }
            })

        // Realtime subscription for room users
        const usersChannel = supabase
            .channel(`room_users:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'room_users',
                    filter: `room_id=eq.${roomId}`,
                },
                () => {
                    fetchUsers()
                }
            )
            .subscribe()

        return () => {
            // Untrack presence before cleanup
            roomChannel.untrack().then(() => {
                console.log('🔴 Presence untracked on cleanup')
            })
            leaveRoom()
            supabase.removeChannel(roomChannel)
            supabase.removeChannel(usersChannel)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, user?.id]) // Added user?.id to re-run when user is loaded

    return {
        room,
        currentSong,
        isHost,
        users: users.filter(u => presenceUsers.some((p: any) => p.user_id === u.user_id)), // Only show online users
        presenceUsers,
        playlist,
        loading,
        setPlaying,
        seekTo,
        updateCurrentTime,
        broadcastProgress,
        nextSong,
        previousSong,
        leaveRoom,
    }
}
