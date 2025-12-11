'use client'

import { createContext, useContext, ReactNode } from 'react'
import { usePlayer } from '@/hooks/usePlayer'
import { Song } from '@/types'

type PlayerContextType = ReturnType<typeof usePlayer>

const PlayerContext = createContext<PlayerContextType | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
    const player = usePlayer()

    return (
        <PlayerContext.Provider value={player}>
            {children}
        </PlayerContext.Provider>
    )
}

export function useGlobalPlayer() {
    const context = useContext(PlayerContext)
    if (!context) {
        throw new Error('useGlobalPlayer must be used within a PlayerProvider')
    }
    return context
}
