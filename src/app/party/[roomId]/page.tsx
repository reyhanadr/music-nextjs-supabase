/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Navigation } from '@/components/layout/Navigation'
import { UsersList } from '@/components/party/UsersList'
import { ChatPanel, MobileChatButton } from '@/components/party/chat'
import { Button } from '@/components/ui/button'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePartyRoom } from '@/hooks/usePartyRoom'
import { LogOut, Music, Volume2, Loader2 } from 'lucide-react'
import { extractYouTubeId, formatTime, getYouTubeThumbnail } from '@/lib/youtube'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { useMediaSession } from '@/hooks/useMediaSession'
import Image from 'next/image'
import YouTube, { YouTubePlayer } from 'react-youtube'
import { MotionDiv, MotionCard, MotionButton } from '@/components/motion/wrappers'
import { slideUp, staggerContainer, scaleUp, hoverScale, slideIn } from '@/components/motion/variants'
import { toast } from 'sonner'

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
    const [isSyncing, setIsSyncing] = useState(false) // For initial sync loading
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
        playSong,
        leaveRoom,
        updateCurrentTime,
        broadcastProgress,
    } = usePartyRoom(roomId)

    // Get video ID
    const videoId = currentSong ? extractYouTubeId(currentSong.youtube_url) : null
    const thumbnail = videoId ? getYouTubeThumbnail(videoId, 'maxres') : null

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [])

    // Listen for host-left event and show toast notification
    useEffect(() => {
        const handleHostLeft = () => {
            toast.warning('Host has left the party room. Music paused and time reset to 0.', {
                duration: 5000,
                position: 'top-center',
            })
        }

        window.addEventListener('host-left', handleHostLeft)

        return () => {
            window.removeEventListener('host-left', handleHostLeft)
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

            // Initial sync for non-host users joining
            if (room && !hasInitialSyncRef.current && !isHost) {
                hasInitialSyncRef.current = true
                setIsSyncing(true) // Show syncing overlay

                // Use setTimeout to ensure sync happens after player is completely ready
                setTimeout(() => {
                    try {
                        // Double check player is still valid and ready
                        if (!ytPlayer || typeof ytPlayer.getPlayerState !== 'function') {
                            console.warn('Player not ready for sync')
                            setIsSyncing(false)
                            return
                        }

                        // Sync to current playback position
                        if (room.current_time > 0 && typeof ytPlayer.seekTo === 'function') {
                            ytPlayer.seekTo(room.current_time, true)
                            setLocalTime(room.current_time)
                            lastRoomTimeRef.current = room.current_time
                        }

                        // Sync play/pause state
                        if (room.is_playing && typeof ytPlayer.playVideo === 'function') {
                            ytPlayer.playVideo()
                        } else if (!room.is_playing && typeof ytPlayer.pauseVideo === 'function') {
                            ytPlayer.pauseVideo()
                        }

                        // Clear syncing state after a brief moment
                        setTimeout(() => {
                            setIsSyncing(false)
                        }, 1500)
                    } catch (err) {
                        console.error('Error syncing on join:', err)
                        setIsSyncing(false)
                    }
                }, 1000) // 1000ms delay for better stability
            } else if (room && !hasInitialSyncRef.current && isHost) {
                // Host doesn't need syncing
                hasInitialSyncRef.current = true
            }

            startTimeTracking(ytPlayer)
        } catch (error) {
            console.error('Error initializing player:', error)
            setIsSyncing(false)
        }
    }, [volume, room, isHost, startTimeTracking])

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

    // Media Session Integration - Must be at top level
    useMediaSession({
        title: currentSong?.title,
        artist: currentSong?.artist,
        artwork: thumbnail || undefined,
        currentSong: currentSong,
        isPlaying: room?.is_playing ?? false,
        onPlay: async () => {
            if (!room?.is_playing) {
                await handlePlayPause()
            }
        },
        onPause: async () => {
            if (room?.is_playing) {
                await handlePlayPause()
            }
        },
        onPrevioustrack: handlePreviousSong,
        onNexttrack: handleNextSong,
        onSeekTo: (time) => handleSeek([time]),
    })

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-sidebar to-background flex items-center justify-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    Loading room...
                </div>
            </div>
        )
    }

    // Room not found
    if (!room || !currentSong) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-sidebar to-background flex items-center justify-center">
                <div className="text-muted-foreground">Room not found or no songs in playlist</div>
            </div>
        )
    }

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
            origin: typeof window !== 'undefined' ? window.location.origin : '',
            playsinline: 1, // Important for iOS background playback behavior
        },
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-sidebar to-background pb-24">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
                {/* Room Header */}
                <MotionDiv
                    initial="initial"
                    animate="animate"
                    variants={slideUp}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4"
                >
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-400 to-secondary-foreground bg-clip-text text-transparent">{room.name}</h1>
                        <p className="text-muted-foreground mt-1 flex items-center gap-2">
                            Party Mode
                            <span className="w-1 h-1 rounded-full bg-slate-500" />
                            Synchronized Playback
                            {isHost && <span className="text-primary font-medium ml-1 bg-primary/10 px-2 py-0.5 rounded-full text-xs border border-primary/20">Host</span>}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={leaveRoom}
                        className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Leave Room
                    </Button>
                </MotionDiv>

                <MotionDiv
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                    {/* Main Player */}
                    <div className="lg:col-span-2 space-y-6">
                        <MotionCard
                            variants={scaleUp}
                            className="bg-card/50 backdrop-blur-md border-primary/20 overflow-hidden shadow-xl"
                        >
                            {/* Album Art / Thumbnail */}
                            <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-sidebar">
                                {thumbnail && (
                                    <Image
                                        src={thumbnail}
                                        alt={currentSong.title}
                                        fill
                                        className="object-cover opacity-90"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />

                                {/* Loading overlay */}
                                {isLoading && (
                                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                    </div>
                                )}

                                {/* Syncing overlay for new joiners */}
                                {isSyncing && (
                                    <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-3">
                                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                        <span className="text-muted-foreground text-sm font-medium animate-pulse">Syncing to live playback...</span>
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

                            <CardContent className="p-6 space-y-6">
                                {/* Song Info */}
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground text-center md:text-left">{currentSong.title}</h2>
                                    {currentSong.artist && (
                                        <p className="text-muted-foreground mt-1 text-center md:text-left text-lg">{currentSong.artist}</p>
                                    )}
                                </div>

                                {/* Seek Bar */}
                                <div className="space-y-2">
                                    <Slider
                                        value={[displayTime]}
                                        max={displayDuration}
                                        step={1}
                                        onValueChange={handleSeek}
                                        className="cursor-pointer py-2"
                                        disabled={isLoading}
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground font-mono">
                                        <span>{formatTime(displayTime)}</span>
                                        <span>{formatTime(displayDuration)}</span>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-center gap-6">
                                    <MotionButton
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        variant="ghost"
                                        size="icon"
                                        onClick={handlePreviousSong}
                                        disabled={isLoading}
                                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-12 w-12 disabled:opacity-50 transition-colors"
                                    >
                                        <SkipBack className="h-6 w-6" />
                                    </MotionButton>

                                    <MotionButton
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        size="icon"
                                        onClick={handlePlayPause}
                                        disabled={isLoading}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-16 w-16 rounded-full shadow-lg shadow-primary/30 border-2 border-primary/20 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                        ) : room.is_playing ? (
                                            <Pause className="h-8 w-8" />
                                        ) : (
                                            <Play className="h-8 w-8 ml-1" />
                                        )}
                                    </MotionButton>

                                    <MotionButton
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleNextSong}
                                        disabled={isLoading}
                                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-12 w-12 disabled:opacity-50 transition-colors"
                                    >
                                        <SkipForward className="h-6 w-6" />
                                    </MotionButton>
                                </div>

                                {/* Volume Control */}
                                <div className="flex items-center gap-4 max-w-xs mx-auto pt-2">
                                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                                    <Slider
                                        value={[volume]}
                                        max={100}
                                        step={1}
                                        onValueChange={handleVolumeChange}
                                        className="cursor-pointer"
                                    />
                                    <span className="text-xs text-muted-foreground w-8 font-mono">{volume}%</span>
                                </div>
                            </CardContent>
                        </MotionCard>

                        {/* Playlist */}
                        <MotionCard
                            variants={slideUp}
                            className="bg-card/50 backdrop-blur-sm border-secondary/20"
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-foreground">
                                    <Music className="h-5 w-5 text-secondary-foreground" />
                                    Playlist ({playlist.length} songs)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 max-h-80 overflow-y-auto px-2">
                                {playlist.map((song, index) => {
                                    const songVideoId = extractYouTubeId(song.youtube_url)
                                    const songThumbnail = songVideoId ? getYouTubeThumbnail(songVideoId) : null
                                    const isCurrentSong = song.id === currentSong.id
                                    const isCurrentPlaying = isCurrentSong && room.is_playing

                                    const handlePlaylistItemClick = () => {
                                        if (isCurrentSong) {
                                            // Toggle play/pause for current song
                                            handlePlayPause()
                                        } else {
                                            // Play this song
                                            playSong(song.id)
                                        }
                                    }

                                    return (
                                        <MotionDiv
                                            key={song.id}
                                            variants={slideIn}
                                            viewport={{ once: true }}
                                            onClick={handlePlaylistItemClick}
                                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer group ${isCurrentSong
                                                ? 'bg-primary/10 border border-primary/30'
                                                : 'bg-card/30 hover:bg-card/50 border border-transparent'
                                                }`}
                                        >
                                            {/* Play button overlay on thumbnail */}
                                            <div className="relative w-10 h-10 flex-shrink-0">
                                                {songThumbnail ? (
                                                    <>
                                                        <div className="relative w-10 h-10 rounded-md overflow-hidden">
                                                            <Image
                                                                src={songThumbnail}
                                                                alt={song.title}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        {/* Play/Pause overlay */}
                                                        <div className={`absolute inset-0 rounded-md flex items-center justify-center transition-opacity ${isCurrentPlaying ? 'bg-black/40 opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'}`}>
                                                            {isCurrentPlaying ? (
                                                                <Pause className="h-5 w-5 text-white" />
                                                            ) : (
                                                                <Play className="h-5 w-5 text-white ml-0.5" />
                                                            )}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                                                        {isCurrentPlaying ? (
                                                            <Pause className="h-5 w-5 text-primary" />
                                                        ) : (
                                                            <Play className="h-5 w-5 text-muted-foreground ml-0.5" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <span className={`text-sm w-6 font-mono ${isCurrentSong ? 'text-primary' : 'text-muted-foreground'}`}>{index + 1}</span>

                                            <div className="flex-1 min-w-0">
                                                <p className={`font-medium truncate ${isCurrentSong ? 'text-primary' : 'text-foreground'}`}>{song.title}</p>
                                                {song.artist && (
                                                    <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                                                )}
                                            </div>
                                            {isCurrentPlaying && (
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1 h-3 bg-primary animate-pulse" />
                                                    <div className="w-1 h-4 bg-primary animate-pulse" style={{ animationDelay: '0.2s' }} />
                                                    <div className="w-1 h-3 bg-primary animate-pulse" style={{ animationDelay: '0.4s' }} />
                                                </div>
                                            )}
                                        </MotionDiv>
                                    )
                                })}
                            </CardContent>
                        </MotionCard>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <UsersList users={users} hostId={room.host_id} onlineCount={presenceUsers.length} />
                        <ChatPanel roomId={roomId} className="hidden lg:flex" />
                    </div>
                </MotionDiv>

                {/* Mobile Chat Button */}
                <MobileChatButton roomId={roomId} className="lg:hidden" />
            </main>
        </div>
    )
}
