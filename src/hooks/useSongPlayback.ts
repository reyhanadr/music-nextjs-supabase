'use client'

import { useGlobalPlayer } from '@/contexts/PlayerContext'
import { Song } from '@/types'
import { useCallback } from 'react'

export function useSongPlayback(song: Song) {
    const player = useGlobalPlayer()

    const isCurrentSong = player.currentSong?.id === song.id
    const isPlaying = isCurrentSong && player.isPlaying

    const togglePlay = useCallback((e?: React.MouseEvent) => {
        // Prevent event bubbling if used inside a clickable card
        e?.stopPropagation()

        if (isCurrentSong) {
            player.playPause()
        } else {
            player.playSong(song)
        }
    }, [isCurrentSong, player, song])

    return {
        isCurrentSong,
        isPlaying,
        togglePlay
    }
}
