'use client'

import { useEffect, useRef } from 'react'
import { Song } from '@/types'

interface UseMediaSessionOptions {
    title?: string
    artist?: string
    artwork?: string
    currentSong?: Song | null
    isPlaying?: boolean
    onPlay?: () => void
    onPause?: () => void
    onPrevioustrack?: () => void
    onNexttrack?: () => void
    onSeekTo?: (time: number) => void
}

/**
 * Hook to integrate with the Media Session API for native media controls
 * Supports lock screen controls, media keys, and browser media panels
 */
export function useMediaSession({
    title,
    artist,
    artwork,
    currentSong,
    isPlaying,
    onPlay,
    onPause,
    onPrevioustrack,
    onNexttrack,
    onSeekTo,
}: UseMediaSessionOptions) {
    const isSupported = useRef(typeof navigator !== 'undefined' && 'mediaSession' in navigator)

    // Update metadata when song changes
    useEffect(() => {
        if (!isSupported.current || !currentSong) return

        try {
            const artworkArray = artwork ? [
                { src: artwork, sizes: '96x96', type: 'image/jpeg' },
                { src: artwork, sizes: '128x128', type: 'image/jpeg' },
                { src: artwork, sizes: '192x192', type: 'image/jpeg' },
                { src: artwork, sizes: '256x256', type: 'image/jpeg' },
                { src: artwork, sizes: '384x384', type: 'image/jpeg' },
                { src: artwork, sizes: '512x512', type: 'image/jpeg' },
            ] : []

            navigator.mediaSession.metadata = new MediaMetadata({
                title: title || currentSong.title || 'Unknown Title',
                artist: artist || currentSong.artist || 'Unknown Artist',
                album: 'Music Party',
                artwork: artworkArray,
            })
        } catch (error) {
            console.warn('Failed to set media session metadata:', error)
        }
    }, [title, artist, artwork, currentSong])

    // Update playback state
    useEffect(() => {
        if (!isSupported.current) return

        try {
            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
        } catch (error) {
            // Ignore errors
        }
    }, [isPlaying])

    // Set up action handlers
    useEffect(() => {
        if (!isSupported.current) return

        const handlers: [MediaSessionAction, MediaSessionActionHandler | null][] = [
            ['play', onPlay ? () => onPlay() : null],
            ['pause', onPause ? () => onPause() : null],
            ['previoustrack', onPrevioustrack ? () => onPrevioustrack() : null],
            ['nexttrack', onNexttrack ? () => onNexttrack() : null],
            ['seekto', onSeekTo ? (details) => {
                if (details.seekTime !== undefined) {
                    onSeekTo(details.seekTime)
                }
            } : null],
        ]

        // Set handlers
        handlers.forEach(([action, handler]) => {
            try {
                if (handler) {
                    navigator.mediaSession.setActionHandler(action, handler)
                }
            } catch (error) {
                // Action might not be supported
                console.warn(`Media session action ${action} not supported:`, error)
            }
        })

        // Cleanup handlers on unmount
        return () => {
            handlers.forEach(([action]) => {
                try {
                    navigator.mediaSession.setActionHandler(action, null)
                } catch (error) {
                    // Ignore cleanup errors
                }
            })
        }
    }, [onPlay, onPause, onPrevioustrack, onNexttrack, onSeekTo])

    return {
        isSupported: isSupported.current,
    }
}
