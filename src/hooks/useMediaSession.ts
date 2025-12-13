'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Song } from '@/types'

// ============================================
// Enhanced Media Session Hook
// Manages OS/browser media controls integration
// with position state, hi-res artwork, and stable refs
// ============================================

interface UseMediaSessionProps {
    title?: string
    artist?: string
    album?: string
    artwork?: string
    onPlay?: () => void
    onPause?: () => void
    onSeekBackward?: () => void
    onSeekForward?: () => void
    onPrevioustrack?: () => void
    onNexttrack?: () => void
    onSeekTo?: (time: number) => void
    currentSong?: Song | null
    isPlaying?: boolean
    // New props for position state
    currentTime?: number
    duration?: number
}

// YouTube thumbnail quality fallback chain
function getHighResThumbnail(youtubeUrl: string): string | undefined {
    if (!youtubeUrl) return undefined

    // Extract video ID
    const videoId = youtubeUrl.includes('v=')
        ? youtubeUrl.split('v=')[1]?.split('&')[0]
        : youtubeUrl.split('/').pop()?.split('?')[0]

    if (!videoId) return undefined

    // Return maxresdefault for highest quality (1280x720)
    // Browser will fallback if not available
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

export function useMediaSession({
    title,
    artist,
    album,
    artwork,
    onPlay,
    onPause,
    onSeekBackward,
    onSeekForward,
    onPrevioustrack,
    onNexttrack,
    onSeekTo,
    currentSong,
    isPlaying,
    currentTime,
    duration,
}: UseMediaSessionProps) {
    // ============================================
    // Stable refs for callbacks
    // Prevents stale closure issues with action handlers
    // ============================================

    const onPlayRef = useRef(onPlay)
    onPlayRef.current = onPlay

    const onPauseRef = useRef(onPause)
    onPauseRef.current = onPause

    const onSeekBackwardRef = useRef(onSeekBackward)
    onSeekBackwardRef.current = onSeekBackward

    const onSeekForwardRef = useRef(onSeekForward)
    onSeekForwardRef.current = onSeekForward

    const onPrevioustrackRef = useRef(onPrevioustrack)
    onPrevioustrackRef.current = onPrevioustrack

    const onNexttrackRef = useRef(onNexttrack)
    onNexttrackRef.current = onNexttrack

    const onSeekToRef = useRef(onSeekTo)
    onSeekToRef.current = onSeekTo

    // ============================================
    // Update metadata when song info changes
    // ============================================

    useEffect(() => {
        if (!('mediaSession' in navigator) || !currentSong) return

        const songTitle = title || currentSong.title
        const songArtist = artist || currentSong.artist || 'Unknown Artist'
        const songAlbum = album || 'Music Party'

        // Get high-resolution artwork
        let artworkUrl = artwork
        if (!artworkUrl && currentSong.youtube_url) {
            artworkUrl = getHighResThumbnail(currentSong.youtube_url)
        }

        // Fallback to standard resolution if maxres fails
        const videoId = currentSong.youtube_url?.includes('v=')
            ? currentSong.youtube_url.split('v=')[1]?.split('&')[0]
            : currentSong.youtube_url?.split('/').pop()?.split('?')[0]

        const fallbackUrl: string | undefined = videoId
            ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            : undefined

        // Build artwork array with multiple sizes for better OS compatibility
        const artworkArray = artworkUrl ? [
            { src: artworkUrl, sizes: '96x96', type: 'image/jpeg' },
            { src: artworkUrl, sizes: '128x128', type: 'image/jpeg' },
            { src: artworkUrl, sizes: '192x192', type: 'image/jpeg' },
            { src: artworkUrl, sizes: '256x256', type: 'image/jpeg' },
            { src: artworkUrl, sizes: '384x384', type: 'image/jpeg' },
            { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' },
            // Add fallback for each size
            ...(fallbackUrl && fallbackUrl !== artworkUrl ? [
                { src: fallbackUrl, sizes: '480x360', type: 'image/jpeg' },
            ] : [])
        ] : []

        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: songTitle,
                artist: songArtist,
                album: songAlbum,
                artwork: artworkArray
            })
        } catch (error) {
            console.warn('[MediaSession] Error setting metadata:', error)
        }
    }, [title, artist, album, artwork, currentSong])

    // ============================================
    // Update playback state
    // ============================================

    useEffect(() => {
        if (!('mediaSession' in navigator)) return

        try {
            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
        } catch (error) {
            // Ignore
        }
    }, [isPlaying])

    // ============================================
    // Update position state (NEW)
    // Enables seek bar in OS media controls
    // ============================================

    useEffect(() => {
        if (!('mediaSession' in navigator)) return
        if (typeof duration !== 'number' || duration <= 0) return
        if (typeof currentTime !== 'number' || currentTime < 0) return

        try {
            // setPositionState allows OS to show progress bar
            if ('setPositionState' in navigator.mediaSession) {
                navigator.mediaSession.setPositionState({
                    duration: duration,
                    playbackRate: 1.0,
                    position: Math.min(currentTime, duration),
                })
            }
        } catch (error) {
            // Some browsers may not support setPositionState
            // or may throw if values are out of range
        }
    }, [currentTime, duration])

    // ============================================
    // Set action handlers with stable refs
    // ============================================

    useEffect(() => {
        if (!('mediaSession' in navigator)) return

        // Use stable wrapper functions that call current refs
        const handlers: [MediaSessionAction, (() => void) | ((details: any) => void) | undefined][] = [
            ['play', () => onPlayRef.current?.()],
            ['pause', () => onPauseRef.current?.()],
            ['previoustrack', () => onPrevioustrackRef.current?.()],
            ['nexttrack', () => onNexttrackRef.current?.()],
            ['seekbackward', () => onSeekBackwardRef.current?.()],
            ['seekforward', () => onSeekForwardRef.current?.()],
            ['seekto', (details: MediaSessionActionDetails) => {
                if (onSeekToRef.current && details.seekTime !== undefined) {
                    onSeekToRef.current(details.seekTime)
                }
            }],
        ]

        handlers.forEach(([action, handler]) => {
            try {
                if (handler) {
                    navigator.mediaSession.setActionHandler(action, handler as MediaSessionActionHandler)
                } else {
                    navigator.mediaSession.setActionHandler(action, null)
                }
            } catch (e) {
                // Ignore errors for unsupported actions
            }
        })

        // Cleanup on unmount - remove handlers
        return () => {
            const actions: MediaSessionAction[] = [
                'play', 'pause', 'previoustrack', 'nexttrack',
                'seekbackward', 'seekforward', 'seekto'
            ]

            actions.forEach((action) => {
                try {
                    navigator.mediaSession.setActionHandler(action, null)
                } catch (e) {
                    // Ignore
                }
            })
        }
    }, []) // Empty deps - we use refs for stable handlers
}
