/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card } from '@/components/ui/card'
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat2 } from 'lucide-react'
import { extractYouTubeId, formatTime, getYouTubeThumbnail } from '@/lib/youtube'
import { Song } from '@/types'
import { useMediaSession } from '@/hooks/useMediaSession'
import Image from 'next/image'
import YouTube, { YouTubePlayer } from 'react-youtube'
import { MotionDiv, MotionButton } from '@/components/motion/wrappers'
import { slideUp } from '@/components/motion/variants'
import { MarqueeText } from '@/components/ui/marquee-text'
import { ExpandedMusicPlayer } from './ExpandedMusicPlayer'

interface MusicPlayerProps {
    currentSong: Song | null
    isPlaying: boolean
    currentTime: number
    duration: number
    volume: number
    isRepeat: boolean
    onPlayPause: () => void
    onNext: () => void
    onPrevious: () => void
    onSeek: (seconds: number) => void
    onVolumeChange: (volume: number) => void
    onToggleRepeat: () => void
    onProgress: (playedSeconds: number) => void
    onDuration: (duration: number) => void
    onEnded: () => void
}

export function MusicPlayer({
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isRepeat,
    onPlayPause,
    onNext,
    onPrevious,
    onSeek,
    onVolumeChange,
    onToggleRepeat,
    onProgress,
    onDuration,
    onEnded,
}: MusicPlayerProps) {
    const [player, setPlayer] = useState<YouTubePlayer | null>(null)
    const [isPlayerReady, setIsPlayerReady] = useState(false)
    const [localTime, setLocalTime] = useState(0)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const playerRef = useRef<YouTube>(null)
    const lastVideoId = useRef<string | null>(null)
    const endTriggeredRef = useRef(false) // Prevent duplicate onEnded calls
    const [isExpanded, setIsExpanded] = useState(false) // Expanded player modal state

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
        if (videoId !== lastVideoId.current) {
            lastVideoId.current = videoId
            setIsPlayerReady(false)
            setPlayer(null)
            setLocalTime(0)
            endTriggeredRef.current = false // Reset end trigger on new video
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [videoId])

    const startTimeTracking = useCallback((ytPlayer: YouTubePlayer) => {
        // Clear existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }

        // Start new interval for time tracking - using 250ms for better background detection
        intervalRef.current = setInterval(() => {
            try {
                if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
                    const time = ytPlayer.getCurrentTime()
                    const ytDuration = typeof ytPlayer.getDuration === 'function' ? ytPlayer.getDuration() : 0

                    if (typeof time === 'number' && !isNaN(time)) {
                        setLocalTime(time)
                        onProgress(time)

                        // Fallback end detection for background tabs
                        // Check if within 0.5 second of end
                        if (ytDuration > 0 && time >= ytDuration - 0.5 && time > 0 && !endTriggeredRef.current) {
                            console.log('Background end detection: triggering onEnded')
                            endTriggeredRef.current = true
                            onEnded()
                        }
                    }
                }
            } catch (error) {
                // Player might be destroyed, ignore errors
            }
        }, 250) // 250ms for more responsive background detection
    }, [onProgress, onEnded])

    // Handle visibility change to check for ended state when returning to tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && player && isPlayerReady) {
                try {
                    const playerState = player.getPlayerState()
                    const currentTime = player.getCurrentTime()
                    const duration = player.getDuration()

                    // Check if video ended while we were away
                    if (playerState === 0 && !endTriggeredRef.current) {
                        console.log('Visibility change: ended state detected')
                        endTriggeredRef.current = true

                        if (isRepeat) {
                            // Repeat mode: seek to beginning and play again
                            player.seekTo(0, true)
                            player.playVideo()
                            endTriggeredRef.current = false
                        } else {
                            onEnded()
                        }
                    }

                    // Also check if we're at the end of the video
                    if (duration > 0 && currentTime >= duration - 0.5 && !endTriggeredRef.current) {
                        console.log('Visibility change: near end detected')
                        endTriggeredRef.current = true

                        if (isRepeat) {
                            // Repeat mode: seek to beginning and play again
                            player.seekTo(0, true)
                            player.playVideo()
                            endTriggeredRef.current = false
                        } else {
                            onEnded()
                        }
                    }
                } catch (error) {
                    // Ignore errors
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [player, isPlayerReady, onEnded, isRepeat])

    const onPlayerReady = useCallback((event: { target: YouTubePlayer }) => {
        try {
            const ytPlayer = event.target
            setPlayer(ytPlayer)
            setIsPlayerReady(true)

            // Set initial volume
            if (typeof ytPlayer.setVolume === 'function') {
                ytPlayer.setVolume(volume * 100)
            }

            // Get duration from YouTube player
            if (typeof ytPlayer.getDuration === 'function') {
                const ytDuration = ytPlayer.getDuration()
                if (ytDuration && ytDuration > 0) {
                    onDuration(ytDuration)
                }
            }

            // Start time tracking
            startTimeTracking(ytPlayer)

            // If should be playing, start playback
            if (isPlaying && typeof ytPlayer.playVideo === 'function') {
                ytPlayer.playVideo()
            }
        } catch (error) {
            console.error('Error initializing player:', error)
        }
    }, [volume, onDuration, startTimeTracking, isPlaying])

    const onPlayerStateChange = useCallback((event: any) => {
        try {
            // YouTube.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
            if (event.data === 0) {
                // Video ended
                if (isRepeat) {
                    // Repeat mode: seek to beginning and play again
                    const ytPlayer = event.target
                    if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
                        ytPlayer.seekTo(0, true)
                        ytPlayer.playVideo()
                    }
                } else {
                    // Normal mode: go to next song
                    onEnded()
                }
            } else if (event.data === 1) {
                // Playing - ensure time tracking is active
                if (player && !intervalRef.current) {
                    startTimeTracking(player)
                }
            }
        } catch (error) {
            console.error('Error in player state change:', error)
        }
    }, [onEnded, player, startTimeTracking, isRepeat])

    // Handle play/pause state changes
    useEffect(() => {
        if (!isPlayerReady || !player) return

        const handlePlayPause = () => {
            try {
                // Check if player methods exist before calling
                if (isPlaying) {
                    if (typeof player.playVideo === 'function') {
                        player.playVideo()
                    }
                } else {
                    if (typeof player.pauseVideo === 'function') {
                        player.pauseVideo()
                    }
                }
            } catch (error) {
                // Silently ignore - player might not be ready
                console.warn('Playback control skipped:', error)
            }
        }

        // Small delay to ensure player is fully ready
        const timeoutId = setTimeout(handlePlayPause, 100)

        return () => {
            clearTimeout(timeoutId)
        }
    }, [isPlaying, player, isPlayerReady])

    // Handle volume changes
    useEffect(() => {
        if (!isPlayerReady || !player) return

        try {
            if (typeof player.setVolume === 'function') {
                player.setVolume(volume * 100)
            }
        } catch (error) {
            // Silently ignore
        }
    }, [volume, player, isPlayerReady])

    const handleSeek = (value: number[]) => {
        const seekTime = value[0]
        setLocalTime(seekTime)
        onSeek(seekTime)

        if (player && isPlayerReady && typeof player.seekTo === 'function') {
            try {
                player.seekTo(seekTime, true)
            } catch (error) {
                console.warn('Seek failed:', error)
            }
        }
    }

    const handleVolumeChange = (value: number[]) => {
        onVolumeChange(value[0] / 100)
    }

    // Use local time for display (more responsive), but sync with parent
    const displayTime = localTime || currentTime

    const thumbnail = videoId ? getYouTubeThumbnail(videoId) : null

    // Use song duration if available, otherwise use fetched duration
    const displayDuration = currentSong?.duration || duration

    // Media Session Integration - MUST be called before conditional returns
    useMediaSession({
        title: currentSong?.title,
        artist: currentSong?.artist,
        artwork: thumbnail || undefined,
        currentSong: currentSong,
        isPlaying: isPlaying,
        onPlay: onPlayPause,
        onPause: onPlayPause,
        onPrevioustrack: onPrevious,
        onNexttrack: onNext,
        onSeekTo: (time) => handleSeek([time]),
    })

    if (!currentSong) {
        return (
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-background/95 via-sidebar/95 to-background/95 backdrop-blur-xl border-t border-primary/20 z-50">
                <div className="flex items-center justify-center gap-2 py-2 md:py-3 px-4">
                    <div className="p-1.5 md:p-2 rounded-full bg-primary/10 border border-primary/20">
                        <Play className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                    </div>
                    <span className="text-xs md:text-sm text-muted-foreground font-medium">
                        No song selected
                    </span>
                </div>
            </div>
        )
    }

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
        <>
            <MotionDiv
                initial="initial"
                animate="animate"
                exit="exit"
                variants={slideUp}
                className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-background/95 via-sidebar/95 to-background/95 backdrop-blur-2xl border-t border-primary/20 z-50 transition-all duration-300 ease-in-out safe-area-pb shadow-2xl"
            >
                {/* Hidden YouTube player */}
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

                <div className="w-full px-4 md:px-8 py-2 md:py-3 flex flex-col gap-2">
                    {/* Mobile Seek Bar (Top) */}
                    <div className="md:hidden w-full px-1">
                        <Slider
                            value={[displayTime]}
                            max={displayDuration || 100}
                            step={1}
                            onValueChange={handleSeek}
                            className="cursor-pointer h-1.5"
                        />
                    </div>

                    <div className="flex items-center justify-between gap-3 md:gap-6">
                        {/* Song info - Clickable on mobile to expand */}
                        <div
                            className="flex items-center gap-3 min-w-0 flex-1 md:flex-initial md:w-1/3 cursor-pointer md:cursor-default"
                            onClick={() => {
                                // Only expand on mobile (md breakpoint is 768px)
                                if (window.innerWidth < 768) {
                                    setIsExpanded(true)
                                }
                            }}
                        >
                            {thumbnail && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setIsExpanded(true)
                                    }}
                                    className="relative w-10 h-10 md:w-14 md:h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-lg border border-primary/20 group cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                                >
                                    <Image
                                        src={thumbnail}
                                        alt={currentSong.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                </button>
                            )}
                            <div className="min-w-0 flex-1 overflow-hidden">
                                <MarqueeText
                                    text={currentSong.title}
                                    className="text-foreground text-sm md:text-base font-semibold leading-tight"
                                />
                                {currentSong.artist && (
                                    <MarqueeText
                                        text={currentSong.artist}
                                        className="text-muted-foreground text-xs md:text-sm mt-0.5 font-medium"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Desktop Controls (Center) */}
                        <div className="hidden md:flex flex-col items-center gap-1 flex-1 max-w-md">
                            <div className="flex items-center gap-6">
                                <MotionButton
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    variant="ghost"
                                    size="icon"
                                    onClick={onPrevious}
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <SkipBack className="h-5 w-5" />
                                </MotionButton>

                                <MotionButton
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    size="icon"
                                    onClick={onPlayPause}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-12 rounded-full shadow-lg shadow-primary/25 border border-primary/20"
                                >
                                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                                </MotionButton>

                                <MotionButton
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    variant="ghost"
                                    size="icon"
                                    onClick={onNext}
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <SkipForward className="h-5 w-5" />
                                </MotionButton>

                                <MotionButton
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    variant="ghost"
                                    size="icon"
                                    onClick={onToggleRepeat}
                                    className={`transition-all ${isRepeat
                                        ? 'text-primary bg-primary/20 ring-2 ring-primary/30'
                                        : 'text-muted-foreground hover:text-primary'}`}
                                >
                                    <Repeat2 className="h-5 w-5" />
                                </MotionButton>
                            </div>
                            <div className="w-full flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                <span className="min-w-[40px] text-right">{formatTime(displayTime)}</span>
                                <Slider
                                    value={[displayTime]}
                                    max={displayDuration || 100}
                                    step={1}
                                    onValueChange={handleSeek}
                                    className="cursor-pointer flex-1"
                                />
                                <span className="min-w-[40px] text-left">{formatTime(displayDuration)}</span>
                            </div>
                        </div>

                        {/* Mobile Controls (Right) */}
                        <div className="flex md:hidden items-center gap-3">
                            <div className="text-xs text-muted-foreground font-mono mr-1">
                                {formatTime(displayTime)}
                            </div>
                            <MotionButton
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                size="icon"
                                onClick={onPlayPause}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10 rounded-full shadow-md"
                            >
                                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                            </MotionButton>
                        </div>

                        {/* Volume (Right Desktop) */}
                        <div className="hidden md:flex items-center justify-end gap-2 flex-1 md:w-1/3">
                            <div className="flex items-center gap-2 w-32 group">
                                <Volume2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                <Slider
                                    value={[volume * 100]}
                                    max={100}
                                    step={1}
                                    onValueChange={handleVolumeChange}
                                    className="cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </MotionDiv>

            {/* Expanded Music Player Modal */}
            <ExpandedMusicPlayer
                open={isExpanded}
                onOpenChange={setIsExpanded}
                currentSong={currentSong}
                isPlaying={isPlaying}
                currentTime={displayTime}
                duration={displayDuration}
                isRepeat={isRepeat}
                onPlayPause={onPlayPause}
                onNext={onNext}
                onPrevious={onPrevious}
                onSeek={(seconds) => handleSeek([seconds])}
                onToggleRepeat={onToggleRepeat}
            />
        </>
    )
}
