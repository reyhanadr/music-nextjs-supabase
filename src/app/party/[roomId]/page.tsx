/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Navigation } from '@/components/layout/Navigation'
import { UsersList } from '@/components/party/UsersList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePartyRoom } from '@/hooks/usePartyRoom'
import { LogOut, Music, Volume2, Loader2 } from 'lucide-react'
import { extractYouTubeId, formatTime, getYouTubeThumbnail } from '@/lib/youtube'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import Image from 'next/image'
import YouTube, { YouTubePlayer } from 'react-youtube'

export default function PartyRoomPage() {
    const params = useParams()
    const roomId = params.roomId as string

    // Player state
    const [player, setPlayer] = useState<YouTubePlayer | null>(null)
    const [isPlayerReady, setIsPlayerReady] = useState(false)
    const [localTime, setLocalTime] = useState(0)
    const [volume, setVolume] = useState(80)
    const [isLoading, setIsLoading] = useState(false)
    const [isSeeking, setIsSeeking] = useState(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const playerRef = useRef<YouTube>(null)
    const lastVideoIdRef = useRef<string | null>(null)
    const lastRoomTimeRef = useRef<number>(0) // Track last room time we received
    const hasInitialSyncRef = useRef(false)
    const syncCountRef = useRef(0) // Track number of syncs to limit for new joiners

    const {
        room,
        currentSong,
        isHost,
        users,
        presenceUsers,
        playlist,
        loading,
        setPlaying,
        seekTo,
        nextSong,
        previousSong,
        leaveRoom,
        updateCurrentTime,
        broadcastProgress,
    } = usePartyRoom(roomId)

    // Get video ID
    const videoId = currentSong ? extractYouTubeId(currentSong.youtube_url) : null

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [])

    // Reset player state when video changes
    useEffect(() => {
        if (videoId !== lastVideoIdRef.current) {
            lastVideoIdRef.current = videoId
            setIsPlayerReady(false)
            setPlayer(null)
            setLocalTime(0)
            lastRoomTimeRef.current = 0
            hasInitialSyncRef.current = false
            syncCountRef.current = 0 // Reset sync counter on video change
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [videoId])

    // Start time tracking - Host broadcasts every 200ms, updates DB every 2s
    const startTimeTracking = useCallback((ytPlayer: YouTubePlayer) => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }

        intervalRef.current = setInterval(() => {
            try {
                if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function' && !isSeeking) {
                    const time = ytPlayer.getCurrentTime()
                    if (typeof time === 'number' && !isNaN(time)) {
                        setLocalTime(time)

                        if (isHost) {
                            // Broadcast progress in real-time (every 200ms)
                            const isPlaying = ytPlayer.getPlayerState() === 1
                            broadcastProgress(time, isPlaying)

                            // Still update database every 2 seconds as fallback
                            const timeDiff = Math.abs(time - lastRoomTimeRef.current)
                            if (timeDiff >= 2) {
                                lastRoomTimeRef.current = time
                                updateCurrentTime(time)
                            }
                        }
                    }
                }
            } catch (error) {
                // Ignore
            }
        }, 200) // 200ms for smoother broadcast
    }, [isHost, broadcastProgress, updateCurrentTime, isSeeking])

    // Player ready handler
    const onPlayerReady = useCallback((event: { target: YouTubePlayer }) => {
        try {
            const ytPlayer = event.target
            setPlayer(ytPlayer)
            setIsPlayerReady(true)

            if (typeof ytPlayer.setVolume === 'function') {
                ytPlayer.setVolume(volume)
            }

            // Delay initial sync to ensure room state is fully loaded
            if (room && !hasInitialSyncRef.current) {
                hasInitialSyncRef.current = true

                // Use setTimeout to ensure sync happens after player is completely ready
                setTimeout(() => {
                    try {
                        // Double check player is still valid and ready
                        if (!ytPlayer || typeof ytPlayer.getPlayerState !== 'function') {
                            console.warn('Player not ready for sync')
                            return
                        }

                        // Sync to current playback position
                        if (room.current_time > 0 && typeof ytPlayer.seekTo === 'function') {
                            ytPlayer.seekTo(room.current_time, true)
                            setLocalTime(room.current_time)
                            lastRoomTimeRef.current = room.current_time
                        }

                        // ONLY auto-play if room is actually playing
                        if (room.is_playing && typeof ytPlayer.playVideo === 'function') {
                            ytPlayer.playVideo()
                        }
                    } catch (err) {
                        console.error('Error syncing on join:', err)
                    }
                }, 1000) // 1000ms delay for better stability
            }

            startTimeTracking(ytPlayer)
        } catch (error) {
            console.error('Error initializing player:', error)
        }
    }, [volume, room, startTimeTracking])

    // Player state change handler
    const onPlayerStateChange = useCallback((event: any) => {
        try {
            if (event.data === 0) {
                nextSong()
            } else if (event.data === 1) {
                setIsLoading(false)
                setIsSeeking(false)
                if (player && !intervalRef.current) {
                    startTimeTracking(player)
                }
            } else if (event.data === 2) {
                setIsLoading(false)
            } else if (event.data === 3) {
                setIsLoading(true)
            }
        } catch (error) {
            console.error('Error in player state change:', error)
        }
    }, [nextSong, player, startTimeTracking])

    // Sync play/pause state from room - for ALL users
    useEffect(() => {
        if (!isPlayerReady || !player || !room) return

        try {
            if (room.is_playing) {
                if (typeof player.playVideo === 'function') {
                    player.playVideo()
                }
            } else {
                if (typeof player.pauseVideo === 'function') {
                    player.pauseVideo()
                }
            }
        } catch (error) {
            console.warn('Play/pause sync error:', error)
        }
    }, [room?.is_playing, player, isPlayerReady])

    // Sync seek for non-host users when room time CHANGES
    // Limit sync to max 3 attempts for newly joined users
    useEffect(() => {
        if (!isPlayerReady || !player || !room || isHost || isSeeking) return

        const roomTime = room.current_time || 0

        // Only sync if room time changed from LAST ROOM TIME (not local time)
        const roomTimeDiff = Math.abs(roomTime - lastRoomTimeRef.current)

        // Limit sync attempts to prevent stuttering for new joiners
        if (syncCountRef.current >= 3) {
            // After 3 syncs, only sync if difference is very large (>10 seconds)
            if (roomTimeDiff > 10) {
                try {
                    if (typeof player.seekTo === 'function') {
                        setIsSeeking(true)
                        setIsLoading(true)

                        player.seekTo(roomTime, true)
                        setLocalTime(roomTime)
                        lastRoomTimeRef.current = roomTime

                        setTimeout(() => {
                            setIsSeeking(false)
                            setIsLoading(false)
                        }, 1500)
                    }
                } catch (error) {
                    console.warn('Seek sync error:', error)
                    setIsSeeking(false)
                    setIsLoading(false)
                }
            } else {
                // Just update reference without seeking
                lastRoomTimeRef.current = roomTime
            }
        } else {
            // First 3 syncs: sync if difference > 2 seconds
            if (roomTimeDiff > 2) {
                syncCountRef.current += 1
                try {
                    if (typeof player.seekTo === 'function') {
                        setIsSeeking(true)
                        setIsLoading(true)

                        player.seekTo(roomTime, true)
                        setLocalTime(roomTime)
                        lastRoomTimeRef.current = roomTime

                        setTimeout(() => {
                            setIsSeeking(false)
                            setIsLoading(false)
                        }, 1500)
                    }
                } catch (error) {
                    console.warn('Seek sync error:', error)
                    setIsSeeking(false)
                    setIsLoading(false)
                }
            } else {
                lastRoomTimeRef.current = roomTime
            }
        }
    }, [room?.current_time, player, isPlayerReady, isHost, isSeeking])

    // Listen for broadcast progress updates (non-host only)
    useEffect(() => {
        if (isHost || !player || !isPlayerReady) return

        const handleBroadcastProgress = (event: any) => {
            const { current_time, is_playing } = event.detail

            // Update local time immediately for smoother display
            setLocalTime(current_time)

            // Sync play/pause state if different
            try {
                const playerState = player.getPlayerState()
                const playerIsPlaying = playerState === 1

                if (is_playing && !playerIsPlaying) {
                    player.playVideo()
                } else if (!is_playing && playerIsPlaying) {
                    player.pauseVideo()
                }
            } catch (error) {
                console.warn('Broadcast sync error:', error)
            }
        }

        window.addEventListener('broadcast-progress', handleBroadcastProgress)

        return () => {
            window.removeEventListener('broadcast-progress', handleBroadcastProgress)
        }
    }, [isHost, player, isPlayerReady])

    // Handle volume changes
    useEffect(() => {
        if (!isPlayerReady || !player) return

        try {
            if (typeof player.setVolume === 'function') {
                player.setVolume(volume)
            }
        } catch (error) {
            // Ignore
        }
    }, [volume, player, isPlayerReady])

    // Play/Pause with loading state
    const handlePlayPause = async () => {
        setIsLoading(true)
        const newPlayingState = !room?.is_playing
        await setPlaying(newPlayingState)
        setTimeout(() => setIsLoading(false), 2850)
    }

    // Seek handler with loading state
    const handleSeek = (value: number[]) => {
        const seekTime = value[0]
        setIsSeeking(true)
        setIsLoading(true)
        setLocalTime(seekTime)
        lastRoomTimeRef.current = seekTime
        seekTo(seekTime)

        if (player && isPlayerReady && typeof player.seekTo === 'function') {
            try {
                player.seekTo(seekTime, true)
            } catch (error) {
                console.warn('Seek failed:', error)
            }
        }

        setTimeout(() => {
            setIsSeeking(false)
            setIsLoading(false)
        }, 1500)
    }

    // Previous song handler
    const handlePreviousSong = () => {
        setIsLoading(true)
        if (playlist.length <= 1) {
            handleSeek([0])
        } else {
            previousSong()
        }
        setTimeout(() => setIsLoading(false), 1500)
    }

    // Next song handler
    const handleNextSong = () => {
        setIsLoading(true)
        nextSong()
        setTimeout(() => setIsLoading(false), 1500)
    }

    // Volume handler
    const handleVolumeChange = (value: number[]) => {
        setVolume(value[0])
    }

    // Display time
    const displayTime = localTime

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Loading room...
                </div>
            </div>
        )
    }

    // Room not found
    if (!room || !currentSong) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
                <div className="text-slate-400">Room not found or no songs in playlist</div>
            </div>
        )
    }

    const thumbnail = videoId ? getYouTubeThumbnail(videoId, 'maxres') : null
    const displayDuration = currentSong.duration || 300

    const opts = {
        height: '0',
        width: '0',
        playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            rel: 0,
            showinfo: 0,
            enablejsapi: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : ''
        },
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 pb-24">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
                {/* Room Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white">{room.name}</h1>
                        <p className="text-slate-400 mt-1">
                            Party Mode - Synchronized Playback
                            {isHost && <span className="text-purple-400 ml-2">(You are the host)</span>}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={leaveRoom}
                        className="border-red-900/50 text-red-400 hover:bg-red-900/20"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Leave Room
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Player */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-slate-900/50 border-purple-500/20 overflow-hidden">
                            {/* Album Art / Thumbnail */}
                            <div className="relative aspect-video bg-gradient-to-br from-purple-900/40 to-slate-900">
                                {thumbnail && (
                                    <Image
                                        src={thumbnail}
                                        alt={currentSong.title}
                                        fill
                                        className="object-cover"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                {/* Loading overlay */}
                                {isLoading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="h-12 w-12 text-purple-400 animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Hidden YouTube Player */}
                            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                                {videoId && (
                                    <YouTube
                                        ref={playerRef}
                                        key={videoId}
                                        videoId={videoId}
                                        opts={opts}
                                        onReady={onPlayerReady}
                                        onStateChange={onPlayerStateChange}
                                        onError={(e) => console.error('YouTube Player Error:', e)}
                                    />
                                )}
                            </div>

                            <CardContent className="p-6 space-y-4">
                                {/* Song Info */}
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{currentSong.title}</h2>
                                    {currentSong.artist && (
                                        <p className="text-slate-400 mt-1">{currentSong.artist}</p>
                                    )}
                                </div>

                                {/* Seek Bar */}
                                <div>
                                    <Slider
                                        value={[displayTime]}
                                        max={displayDuration}
                                        step={1}
                                        onValueChange={handleSeek}
                                        className="cursor-pointer"
                                        disabled={isLoading}
                                    />
                                    <div className="flex justify-between mt-2 text-xs text-slate-400">
                                        <span>{formatTime(displayTime)}</span>
                                        <span>{formatTime(displayDuration)}</span>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-center gap-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handlePreviousSong}
                                        disabled={isLoading}
                                        className="text-white hover:text-purple-400 hover:bg-purple-500/10 h-10 w-10 disabled:opacity-50"
                                    >
                                        <SkipBack className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        onClick={handlePlayPause}
                                        disabled={isLoading}
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-14 w-14 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        ) : room.is_playing ? (
                                            <Pause className="h-6 w-6" />
                                        ) : (
                                            <Play className="h-6 w-6 ml-0.5" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleNextSong}
                                        disabled={isLoading}
                                        className="text-white hover:text-purple-400 hover:bg-purple-500/10 h-10 w-10 disabled:opacity-50"
                                    >
                                        <SkipForward className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Volume Control */}
                                <div className="flex items-center gap-3 max-w-xs mx-auto">
                                    <Volume2 className="h-4 w-4 text-slate-400" />
                                    <Slider
                                        value={[volume]}
                                        max={100}
                                        step={1}
                                        onValueChange={handleVolumeChange}
                                        className="cursor-pointer"
                                    />
                                    <span className="text-xs text-slate-400 w-8">{volume}%</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Playlist */}
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Music className="h-5 w-5" />
                                    Playlist ({playlist.length} songs)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                                {playlist.map((song, index) => (
                                    <div
                                        key={song.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg ${song.id === currentSong.id
                                            ? 'bg-purple-500/20 border border-purple-500/50'
                                            : 'bg-slate-800/30'
                                            }`}
                                    >
                                        <span className="text-slate-500 text-sm w-6">{index + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">{song.title}</p>
                                            {song.artist && (
                                                <p className="text-sm text-slate-400 truncate">{song.artist}</p>
                                            )}
                                        </div>
                                        {song.id === currentSong.id && room.is_playing && (
                                            <div className="flex items-center gap-1">
                                                <div className="w-1 h-3 bg-purple-500 animate-pulse" />
                                                <div className="w-1 h-4 bg-purple-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                                                <div className="w-1 h-3 bg-purple-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div>
                        <UsersList users={users} hostId={room.host_id} onlineCount={presenceUsers.length} />
                    </div>
                </div>
            </main>
        </div>
    )
}
