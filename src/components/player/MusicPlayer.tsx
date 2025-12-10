/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card } from '@/components/ui/card'
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { extractYouTubeId, formatTime, getYouTubeThumbnail } from '@/lib/youtube'
import { Song } from '@/types'
import Image from 'next/image'
import YouTube, { YouTubePlayer } from 'react-youtube'

interface MusicPlayerProps {
    currentSong: Song | null
    isPlaying: boolean
    currentTime: number
    duration: number
    volume: number
    onPlayPause: () => void
    onNext: () => void
    onPrevious: () => void
    onSeek: (seconds: number) => void
    onVolumeChange: (volume: number) => void
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
    onPlayPause,
    onNext,
    onPrevious,
    onSeek,
    onVolumeChange,
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

        // Start new interval for time tracking
        intervalRef.current = setInterval(() => {
            try {
                if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
                    const time = ytPlayer.getCurrentTime()
                    if (typeof time === 'number' && !isNaN(time)) {
                        setLocalTime(time)
                        onProgress(time)
                    }
                }
            } catch (error) {
                // Player might be destroyed, ignore errors
            }
        }, 500)
    }, [onProgress])

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
                onEnded()
            } else if (event.data === 1) {
                // Playing - ensure time tracking is active
                if (player && !intervalRef.current) {
                    startTimeTracking(player)
                }
            }
        } catch (error) {
            console.error('Error in player state change:', error)
        }
    }, [onEnded, player, startTimeTracking])

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

    if (!currentSong) {
        return (
            <Card className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-purple-500/20 p-4">
                <div className="text-center text-slate-400">No song selected</div>
            </Card>
        )
    }

    const thumbnail = videoId ? getYouTubeThumbnail(videoId) : null

    // Use song duration if available, otherwise use fetched duration
    const displayDuration = currentSong.duration || duration

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
        <Card className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900/95 via-purple-900/20 to-slate-900/95 backdrop-blur-xl border-t border-purple-500/20 p-4 z-50">
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

            <div className="max-w-7xl mx-auto">
                {/* Seek bar */}
                <div className="mb-3">
                    <Slider
                        value={[displayTime]}
                        max={displayDuration || 100}
                        step={1}
                        onValueChange={handleSeek}
                        className="cursor-pointer"
                    />
                    <div className="flex justify-between mt-1 text-xs text-slate-400">
                        <span>{formatTime(displayTime)}</span>
                        <span>{formatTime(displayDuration)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    {/* Song info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {thumbnail && (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                    src={thumbnail}
                                    alt={currentSong.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <h3 className="text-white font-semibold truncate">{currentSong.title}</h3>
                            {currentSong.artist && (
                                <p className="text-slate-400 text-sm truncate">{currentSong.artist}</p>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onPrevious}
                            className="text-white hover:text-purple-400 hover:bg-purple-500/10"
                        >
                            <SkipBack className="h-5 w-5" />
                        </Button>
                        <Button
                            size="icon"
                            onClick={onPlayPause}
                            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white h-10 w-10"
                        >
                            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onNext}
                            className="text-white hover:text-purple-400 hover:bg-purple-500/10"
                        >
                            <SkipForward className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Volume */}
                    <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs">
                        <Volume2 className="h-4 w-4 text-slate-400" />
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
        </Card>
    )
}
