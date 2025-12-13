'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Song } from '@/types'
import {
    loadPlayerStateFromStorage,
    savePlayerStateToStorage,
    debounce
} from '@/lib/queue-storage'

export function usePlayer(initialPlaylist: Song[] = []) {
    const [currentSong, setCurrentSong] = useState<Song | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(0.8)
    const [playlist, setPlaylist] = useState<Song[]>(initialPlaylist)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isLoaded, setIsLoaded] = useState(false)
    const [isRepeat, setIsRepeat] = useState(false)
    const playerRef = useRef<any>(null)

    // Guard against race conditions - prevents multiple next calls
    const isTransitioningRef = useRef(false)

    // Callback ref for getting next song from queue
    // This will be set by the QueueContext to inject queue logic
    const getNextFromQueueRef = useRef<(() => Song | null) | null>(null)

    // Debounced save function ref
    const debouncedSaveRef = useRef(
        debounce((song: Song | null, time: number, playing: boolean) => {
            savePlayerStateToStorage({
                currentSong: song,
                currentTime: time,
                isPlaying: playing
            })
        }, 500)
    )

    // Load player state from localStorage on mount
    useEffect(() => {
        const savedState = loadPlayerStateFromStorage()
        if (savedState) {
            if (savedState.currentSong) {
                setCurrentSong(savedState.currentSong)
                // Find index in playlist if exists
                const idx = playlist.findIndex(s => s.id === savedState.currentSong?.id)
                if (idx !== -1) {
                    setCurrentIndex(idx)
                }
            }
            if (savedState.currentTime > 0) {
                setCurrentTime(savedState.currentTime)
            }
            // Don't auto-play on load, user needs to click play
            setIsPlaying(false)
        }
        setIsLoaded(true)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Save player state to localStorage when it changes (debounced)
    useEffect(() => {
        if (!isLoaded) return // Don't save on initial load

        debouncedSaveRef.current(currentSong, currentTime, isPlaying)
    }, [currentSong, currentTime, isPlaying, isLoaded])

    // Load initial song from playlist
    useEffect(() => {
        if (playlist.length > 0 && !currentSong && isLoaded) {
            // Only set from playlist if no saved song was loaded
            const savedState = loadPlayerStateFromStorage()
            if (!savedState?.currentSong) {
                setCurrentSong(playlist[0])
            }
        }
    }, [playlist, currentSong, isLoaded])

    const play = useCallback(() => {
        setIsPlaying(true)
    }, [])

    const pause = useCallback(() => {
        setIsPlaying(false)
    }, [])

    const playPause = useCallback(() => {
        setIsPlaying(prev => !prev)
    }, [])

    // Next song - check queue first, then fallback to playlist
    const next = useCallback(() => {
        // Guard: Prevent multiple rapid next calls (race condition)
        if (isTransitioningRef.current) {
            console.log('[usePlayer] next() blocked - already transitioning')
            return
        }

        isTransitioningRef.current = true
        console.log('[usePlayer] next() called - transitioning to next song')

        // Reset transitioning flag after delay
        setTimeout(() => {
            isTransitioningRef.current = false
        }, 1000)

        // Try to get next song from queue
        if (getNextFromQueueRef.current) {
            const nextFromQueue = getNextFromQueueRef.current()
            if (nextFromQueue) {
                console.log('[usePlayer] Playing from queue:', nextFromQueue.title)
                setCurrentSong(nextFromQueue)
                setCurrentTime(0)
                setIsPlaying(true)
                // Try to find in playlist to update index
                const idx = playlist.findIndex(s => s.id === nextFromQueue.id)
                if (idx !== -1) {
                    setCurrentIndex(idx)
                }
                return
            }
        }

        // Fallback to playlist if queue is empty
        if (playlist.length > 0) {
            const nextIndex = (currentIndex + 1) % playlist.length
            console.log('[usePlayer] Playing from playlist index:', nextIndex)
            setCurrentIndex(nextIndex)
            setCurrentSong(playlist[nextIndex])
            setCurrentTime(0)
            setIsPlaying(true)
        } else {
            // Queue is empty and no playlist - graceful stop
            console.log('[usePlayer] Queue and playlist empty - stopping playback')
            setIsPlaying(false)
        }
    }, [currentIndex, playlist])

    const previous = useCallback(() => {
        if (playlist.length === 0) return
        const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1
        setCurrentIndex(prevIndex)
        setCurrentSong(playlist[prevIndex])
        setCurrentTime(0)
        setIsPlaying(true)
    }, [currentIndex, playlist])

    const seek = useCallback((seconds: number) => {
        setCurrentTime(seconds)
        if (playerRef.current) {
            playerRef.current.seekTo(seconds)
        }
    }, [])

    const playSong = useCallback((song: Song) => {
        const index = playlist.findIndex(s => s.id === song.id)
        if (index !== -1) {
            setCurrentIndex(index)
            setCurrentSong(song)
            setCurrentTime(0)
            setIsPlaying(true)
        }
    }, [playlist])

    // Play a song directly without requiring it to be in playlist
    // Used by queue system to play songs from queue
    const playSongDirectly = useCallback((song: Song) => {
        setCurrentSong(song)
        setCurrentTime(0)
        setIsPlaying(true)
        // Try to find in playlist to update index
        const index = playlist.findIndex(s => s.id === song.id)
        if (index !== -1) {
            setCurrentIndex(index)
        }
    }, [playlist])

    // Set the queue callback - called by QueueContext to inject queue logic
    const setQueueCallback = useCallback((callback: (() => Song | null) | null) => {
        getNextFromQueueRef.current = callback
    }, [])

    const addToPlaylist = useCallback((song: Song) => {
        setPlaylist(prev => [...prev, song])
    }, [])

    const removeFromPlaylist = useCallback((songId: string) => {
        setPlaylist(prev => prev.filter(s => s.id !== songId))
    }, [])

    const setPlaylistSongs = useCallback((songs: Song[]) => {
        setPlaylist(songs)
        if (songs.length > 0 && !currentSong) {
            setCurrentSong(songs[0])
            setCurrentIndex(0)
        }
    }, [currentSong])

    const handleProgress = useCallback((playedSeconds: number) => {
        setCurrentTime(playedSeconds)
    }, [])

    const handleDuration = useCallback((duration: number) => {
        setDuration(duration)
    }, [])

    // Toggle repeat mode
    const toggleRepeat = useCallback(() => {
        setIsRepeat(prev => !prev)
    }, [])

    // handleEnded - check repeat first, then queue, then playlist
    // Uses transitioning guard to prevent double triggers
    const handleEnded = useCallback(() => {
        console.log('[usePlayer] handleEnded called, isRepeat:', isRepeat)

        if (isRepeat && currentSong) {
            // Repeat current song - reset to beginning
            console.log('[usePlayer] Repeat mode - restarting current song')
            setCurrentTime(0)
            setIsPlaying(true)
            // Seek player to beginning
            if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
                playerRef.current.seekTo(0, true)
            }
        } else {
            // Normal behavior - go to next song
            // The next() function has its own transitioning guard
            next()
        }
    }, [isRepeat, currentSong, next])

    return {
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        playlist,
        currentIndex,
        isRepeat,
        playerRef,
        play,
        pause,
        playPause,
        next,
        previous,
        seek,
        playSong,
        playSongDirectly,
        setQueueCallback,
        toggleRepeat,
        addToPlaylist,
        removeFromPlaylist,
        setPlaylistSongs,
        setVolume,
        handleProgress,
        handleDuration,
        handleEnded,
    }
}


