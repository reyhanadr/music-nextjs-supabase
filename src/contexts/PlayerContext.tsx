'use client'

import { createContext, useContext, ReactNode } from 'react'
import { usePlayer } from '@/hooks/usePlayer'
import { QueueProvider } from '@/contexts/QueueContext'

type PlayerContextType = ReturnType<typeof usePlayer>

const PlayerContext = createContext<PlayerContextType | null>(null)

// Inner component that provides Queue after Player is available
function PlayerWithQueue({ children, player }: { children: ReactNode; player: PlayerContextType }) {
    return (
        <PlayerContext.Provider value={player}>
            <QueueProvider setQueueCallback={player.setQueueCallback}>
                {children}
            </QueueProvider>
        </PlayerContext.Provider>
    )
}

export function PlayerProvider({ children }: { children: ReactNode }) {
    const player = usePlayer()

    return (
        <PlayerWithQueue player={player}>
            {children}
        </PlayerWithQueue>
    )
}

export function useGlobalPlayer() {
    const context = useContext(PlayerContext)
    if (!context) {
        throw new Error('useGlobalPlayer must be used within a PlayerProvider')
    }
    return context
}

