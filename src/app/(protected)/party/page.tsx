'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Navigation } from '@/components/layout/Navigation'
import { CreateRoomDialog } from '@/components/party/CreateRoomDialog'
import { RoomCard } from '@/components/party/RoomCard'
import { RoomCardSkeleton } from '@/components/party/RoomCardSkeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Music, RefreshCw, Filter, ArrowUpDown, Users, Play, Clock } from 'lucide-react'
import { MotionDiv, MotionButton } from '@/components/motion/wrappers'
import { staggerContainer, slideUp, fadeIn } from '@/components/motion/variants'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'

interface RoomWithHost {
    id: string
    name: string
    host_id: string
    current_song_id?: string
    current_time: number
    is_playing: boolean
    playlist: string[]
    created_at: string
    updated_at: string
    room_state?: 'active' | 'idle' | 'closed'
    current_song_title?: string
    current_song_artist?: string
    current_song_youtube_url?: string
    listener_count?: number
    host_profile?: {
        id: string
        full_name?: string
        username?: string
        avatar_url?: string
    } | null
}

type SortOption = 'listeners' | 'playing' | 'recent'

export default function PartyPage() {
    const [rooms, setRooms] = useState<RoomWithHost[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [sortBy, setSortBy] = useState<SortOption>('recent')
    const [showOnlyActive, setShowOnlyActive] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const supabase = createClient()
    const { user } = useAuth()
    const channelRef = useRef<any>(null)
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const realtimeConnectedRef = useRef(true)

    const fetchRooms = useCallback(async (showRefreshToast = false) => {
        try {
            setError(null)
            const { data, error: fetchError } = await supabase
                .from('rooms')
                .select(`
                    *,
                    host_profile:profiles!host_id(id, full_name, username, avatar_url)
                `)
                .order('created_at', { ascending: false })

            if (fetchError) {
                throw fetchError
            }

            if (data) {
                setRooms(data as RoomWithHost[])
            }

            if (showRefreshToast) {
                toast.success('Rooms refreshed')
            }
        } catch (err: any) {
            console.error('Error fetching rooms:', err)
            setError(err.message || 'Failed to load rooms')
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }, [supabase])

    const deleteRoom = async (roomId: string) => {
        // First delete all room_users
        await supabase
            .from('room_users')
            .delete()
            .eq('room_id', roomId)

        // Then delete the room
        const { error } = await supabase
            .from('rooms')
            .delete()
            .eq('id', roomId)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Room deleted successfully!')
            // Optimistically remove from state
            setRooms(prev => prev.filter(room => room.id !== roomId))
        }
    }

    // Start polling as fallback when realtime disconnects
    const startPollingFallback = useCallback(() => {
        if (pollingIntervalRef.current) return
        console.log('⚠️ Starting polling fallback')
        pollingIntervalRef.current = setInterval(() => {
            fetchRooms()
        }, 10000) // Poll every 10 seconds
    }, [fetchRooms])

    // Stop polling when realtime reconnects
    const stopPollingFallback = useCallback(() => {
        if (pollingIntervalRef.current) {
            console.log('✅ Stopping polling, realtime reconnected')
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
        }
    }, [])

    useEffect(() => {
        fetchRooms()

        // Subscribe to room changes with enhanced error handling
        const roomsChannel = supabase
            .channel('rooms-realtime-enhanced')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rooms' }, async (payload) => {
                // Fetch the new room with host profile
                const { data } = await supabase
                    .from('rooms')
                    .select(`
                        *,
                        host_profile:profiles!host_id(id, full_name, username, avatar_url)
                    `)
                    .eq('id', payload.new.id)
                    .single()

                if (data) {
                    setRooms(prev => [data as RoomWithHost, ...prev])
                }
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rooms' }, (payload) => {
                setRooms(prev => prev.filter(room => room.id !== payload.old.id))
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms' }, (payload) => {
                const updatedRoom = payload.new as RoomWithHost
                setRooms(prev => prev.map(room =>
                    room.id === updatedRoom.id
                        ? {
                            ...room,
                            is_playing: updatedRoom.is_playing,
                            current_song_id: updatedRoom.current_song_id,
                            current_song_title: updatedRoom.current_song_title,
                            current_song_artist: updatedRoom.current_song_artist,
                            current_song_youtube_url: updatedRoom.current_song_youtube_url,
                            current_time: updatedRoom.current_time,
                            playlist: updatedRoom.playlist,
                            name: updatedRoom.name,
                            updated_at: updatedRoom.updated_at,
                            room_state: updatedRoom.room_state,
                            listener_count: updatedRoom.listener_count,
                        }
                        : room
                ))
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    realtimeConnectedRef.current = true
                    stopPollingFallback()
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    realtimeConnectedRef.current = false
                    startPollingFallback()
                }
            })

        channelRef.current = roomsChannel

        return () => {
            supabase.removeChannel(roomsChannel)
            stopPollingFallback()
        }
    }, [fetchRooms, supabase, startPollingFallback, stopPollingFallback])

    // Handle manual refresh
    const handleRefresh = () => {
        setIsRefreshing(true)
        fetchRooms(true)
    }

    // Sort and filter rooms
    const getFilteredAndSortedRooms = () => {
        let filteredRooms = [...rooms]

        // Filter: Only active rooms
        if (showOnlyActive) {
            filteredRooms = filteredRooms.filter(room =>
                room.room_state !== 'idle' && room.room_state !== 'closed'
            )
        }

        // Sort
        switch (sortBy) {
            case 'listeners':
                filteredRooms.sort((a, b) => (b.listener_count || 0) - (a.listener_count || 0))
                break
            case 'playing':
                filteredRooms.sort((a, b) => {
                    if (a.is_playing && !b.is_playing) return -1
                    if (!a.is_playing && b.is_playing) return 1
                    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                })
                break
            case 'recent':
            default:
                filteredRooms.sort((a, b) =>
                    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                )
                break
        }

        return filteredRooms
    }

    const displayedRooms = getFilteredAndSortedRooms()

    const getSortIcon = () => {
        switch (sortBy) {
            case 'listeners': return <Users className="h-4 w-4" />
            case 'playing': return <Play className="h-4 w-4" />
            case 'recent': return <Clock className="h-4 w-4" />
        }
    }

    return (
        <MotionDiv
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="min-h-screen bg-gradient-to-br from-background via-sidebar to-background pb-24"
        >
            <Navigation />

            {/* Festive background decorative elements */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[30%] h-[30%] bg-primary/30 rounded-full blur-[80px] opacity-25 animate-pulse" />
                <div className="absolute top-[5%] right-[-5%] w-[25%] h-[25%] bg-purple-500/25 rounded-full blur-[70px] opacity-50" />
                <div className="absolute top-[40%] left-[-8%] w-[20%] h-[20%] bg-pink-500/20 rounded-full blur-[60px] opacity-45" />
                <div className="absolute top-[35%] right-[5%] w-[22%] h-[22%] bg-cyan-500/15 rounded-full blur-[70px] opacity-45" />
                <div className="absolute bottom-[-5%] left-[10%] w-[35%] h-[35%] bg-accent/25 rounded-full blur-[90px] opacity-45" />
                <div className="absolute bottom-[10%] right-[-10%] w-[28%] h-[28%] bg-violet-500/20 rounded-full blur-[80px] opacity-45 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] opacity-45" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
                {/* Header */}
                <MotionDiv variants={slideUp} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-400 to-secondary-foreground bg-clip-text text-transparent">
                            Party Rooms
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            Join a room or create your own to listen together
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <CreateRoomDialog onRoomCreated={() => fetchRooms()} />
                    </div>
                </MotionDiv>

                {/* Filter & Sort Controls */}
                <MotionDiv variants={slideUp} className="flex flex-wrap items-center gap-2 mb-6">
                    {/* Sort Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 border-primary/20 bg-card/50 text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary">
                                {getSortIcon()}
                                <span className="hidden sm:inline">
                                    {sortBy === 'listeners' ? 'Most Listeners' :
                                        sortBy === 'playing' ? 'Now Playing' : 'Recently Active'}
                                </span>
                                <ArrowUpDown className="h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-card/95 backdrop-blur-xl border-primary/20 text-foreground">
                            <DropdownMenuLabel className="text-muted-foreground">Sort by</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-primary/10" />
                            <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                                <DropdownMenuRadioItem value="recent" className="text-foreground focus:bg-primary/10 focus:text-primary">
                                    <Clock className="h-4 w-4 mr-2" />
                                    Recently Active
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="listeners" className="text-foreground focus:bg-primary/10 focus:text-primary">
                                    <Users className="h-4 w-4 mr-2" />
                                    Most Listeners
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="playing" className="text-foreground focus:bg-primary/10 focus:text-primary">
                                    <Play className="h-4 w-4 mr-2" />
                                    Now Playing
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Filter Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className={`gap-2 border-primary/20 bg-card/50 text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary ${showOnlyActive ? 'border-primary/50 bg-primary/10 text-primary' : ''}`}>
                                <Filter className="h-4 w-4" />
                                <span className="hidden sm:inline">Filter</span>
                                {showOnlyActive && (
                                    <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-primary/20 text-primary border-primary/30">1</Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-card/95 backdrop-blur-xl border-primary/20 text-foreground">
                            <DropdownMenuLabel className="text-muted-foreground">Filter</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-primary/10" />
                            <DropdownMenuCheckboxItem
                                checked={showOnlyActive}
                                onCheckedChange={setShowOnlyActive}
                                className="text-foreground focus:bg-primary/10 focus:text-primary"
                            >
                                Only active rooms
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Refresh Button */}
                    <MotionButton
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="border-primary/20 bg-card/50 text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </MotionButton>

                    {/* Room count */}
                    <span className="text-sm text-muted-foreground ml-auto">
                        {displayedRooms.length} room{displayedRooms.length !== 1 ? 's' : ''}
                        {showOnlyActive && rooms.length !== displayedRooms.length && (
                            <span className="text-muted-foreground/50"> of {rooms.length}</span>
                        )}
                    </span>
                </MotionDiv>

                {/* Error State */}
                {error && (
                    <div className="text-center py-12 bg-destructive/10 rounded-2xl border border-destructive/20 mb-6">
                        <p className="text-destructive mb-4">{error}</p>
                        <Button variant="outline" onClick={() => fetchRooms()} className="border-destructive/30">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <RoomCardSkeleton key={i} />
                        ))}
                    </div>
                ) : displayedRooms.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-20 bg-card/30 rounded-2xl border border-primary/5">
                        <Music className="h-16 w-16 mx-auto text-primary/50 mb-4" />
                        <p className="text-muted-foreground mb-4 text-xl font-medium">
                            {showOnlyActive ? 'No active rooms found.' : 'No rooms found.'}
                        </p>
                        <p className="text-sm text-muted-foreground/70 mb-6">
                            {showOnlyActive
                                ? 'Try removing the filter or create a new room!'
                                : 'Create one to get the party started!'}
                        </p>
                        <div className="flex justify-center gap-3">
                            {showOnlyActive && (
                                <Button
                                    variant="outline"
                                    onClick={() => setShowOnlyActive(false)}
                                    className="border-secondary/30"
                                >
                                    Show All Rooms
                                </Button>
                            )}
                            <CreateRoomDialog onRoomCreated={() => fetchRooms()} />
                        </div>
                    </div>
                ) : (
                    /* Room Grid */
                    <MotionDiv
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {displayedRooms.map((room) => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                isOwner={user?.id === room.host_id}
                                onDelete={deleteRoom}
                                onRoomUpdated={() => fetchRooms()}
                            />
                        ))}
                    </MotionDiv>
                )}
            </main>
        </MotionDiv>
    )
}
