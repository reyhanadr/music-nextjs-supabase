'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Song } from '@/types'

export function usePlayer(initialPlaylist: Song[] = []) {
    const [currentSong, setCurrentSong] = useState<Song | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(0.8)
    const [playlist, setPlaylist] = useState<Song[]>(initialPlaylist)
    const [currentIndex, setCurrentIndex] = useState(0)
    const playerRef = useRef<any>(null)

    // Load initial song
    useEffect(() => {
        if (playlist.length > 0 && !currentSong) {
            setCurrentSong(playlist[0])
        }
    }, [playlist, currentSong])

    const play = useCallback(() => {
        setIsPlaying(true)
    }, [])

    const pause = useCallback(() => {
        setIsPlaying(false)
    }, [])

    const playPause = useCallback(() => {
        setIsPlaying(prev => !prev)
    }, [])

    const next = useCallback(() => {
        const nextIndex = (currentIndex + 1) % playlist.length
        setCurrentIndex(nextIndex)
        setCurrentSong(playlist[nextIndex])
        setIsPlaying(true)
    }, [currentIndex, playlist])

    const previous = useCallback(() => {
        const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1
        setCurrentIndex(prevIndex)
        setCurrentSong(playlist[prevIndex])
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
            setIsPlaying(true)
        }
    }, [playlist])

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

    const handleEnded = useCallback(() => {
        next()
    }, [next])

    return {
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        playlist,
        currentIndex,
        playerRef,
        play,
        pause,
        playPause,
        next,
        previous,
        seek,
        playSong,
        addToPlaylist,
        removeFromPlaylist,
        setPlaylistSongs,
        setVolume,
        handleProgress,
        handleDuration,
        handleEnded,
    }
}
