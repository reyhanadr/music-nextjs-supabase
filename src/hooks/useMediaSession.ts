import { useEffect } from 'react'
import { getYouTubeThumbnail } from '@/lib/youtube'
import { Song } from '@/types'

interface UseMediaSessionProps {
    title?: string
    artist?: string
    album?: string
    artwork?: string
    onPlay?: () => void
    onPause?: () => void
    onSeekBackward?: () => void // For rewinding
    onSeekForward?: () => void  // For fast-forwarding
    onPrevioustrack?: () => void
    onNexttrack?: () => void
    onSeekTo?: (time: number) => void
    currentSong?: Song | null
    isPlaying?: boolean
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
    isPlaying
}: UseMediaSessionProps) {
    // Update metadata when song info changes
    useEffect(() => {
        if (!('mediaSession' in navigator) || !currentSong) return

        // Prefer passed props, fallback to currentSong details
        const songTitle = title || currentSong.title
        const songArtist = artist || currentSong.artist || 'Unknown Artist'
        const songAlbum = album || 'Music Party'

        let artworkUrl = artwork
        if (!artworkUrl && currentSong.youtube_url) {
            // Try to extract ID and get maxres thumbnail
            const videoId = currentSong.youtube_url.includes('v=')
                ? currentSong.youtube_url.split('v=')[1]?.split('&')[0]
                : currentSong.youtube_url.split('/').pop()

            if (videoId) {
                // We use standard resolution for lock screen as it's often more reliable/cached
                artworkUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`
            }
        }

        navigator.mediaSession.metadata = new MediaMetadata({
            title: songTitle,
            artist: songArtist,
            album: songAlbum,
            artwork: artworkUrl ? [
                { src: artworkUrl, sizes: '96x96', type: 'image/jpeg' },
                { src: artworkUrl, sizes: '128x128', type: 'image/jpeg' },
                { src: artworkUrl, sizes: '192x192', type: 'image/jpeg' },
                { src: artworkUrl, sizes: '256x256', type: 'image/jpeg' },
                { src: artworkUrl, sizes: '384x384', type: 'image/jpeg' },
                { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' },
            ] : []
        })
    }, [title, artist, album, artwork, currentSong])

    // Update playback state
    useEffect(() => {
        if (!('mediaSession' in navigator)) return

        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    }, [isPlaying])

    // Set action handlers
    useEffect(() => {
        if (!('mediaSession' in navigator)) return

        const actionHandlers = [
            ['play', onPlay],
            ['pause', onPause],
            ['previoustrack', onPrevioustrack],
            ['nexttrack', onNexttrack],
            ['seekbackward', onSeekBackward],
            ['seekforward', onSeekForward],
            ['seekto', (details: any) => {
                if (onSeekTo && details.seekTime) {
                    onSeekTo(details.seekTime)
                }
            }],
        ]

        actionHandlers.forEach(([action, handler]) => {
            try {
                if (handler) {
                    navigator.mediaSession.setActionHandler(action as any, handler as any)
                } else {
                    navigator.mediaSession.setActionHandler(action as any, null)
                }
            } catch (e) {
                // Ignore errors for unsupported actions
            }
        })

        return () => {
            // Cleanup - remove handlers? 
            // Usually not strictly necessary as they get overwritten, but good practice if component unmounts
            // However, wiping them might affect other players if we have multiple. 
            // We'll leave them be or set to null on unmount if we want to be strict.
            // For now, let's just rely on the new hook mounting to overwrite them.
        }
    }, [onPlay, onPause, onPrevioustrack, onNexttrack, onSeekBackward, onSeekForward, onSeekTo])
}
