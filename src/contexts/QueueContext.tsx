'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { Song } from '@/types'
import {
    loadQueueFromStorage,
    saveQueueToStorage,
    clearQueueStorage,
    debounce
} from '@/lib/queue-storage'
import { arrayMove } from '@dnd-kit/sortable'

// ============================================
// Queue Context
// Manages song queue state with localStorage persistence
// ============================================

interface QueueContextType {
    // State
    queue: Song[]
    isInPartyRoom: boolean

    // Actions
    addToQueue: (song: Song) => void
    removeFromQueue: (songId: string) => void
    clearQueue: () => void
    getNextFromQueue: () => Song | null
    reorderQueue: (oldIndex: number, newIndex: number) => void
    setPartyRoomMode: (inParty: boolean) => void
}

interface QueueProviderProps {
    children: ReactNode
    setQueueCallback: (callback: (() => Song | null) | null) => void
}

const QueueContext = createContext<QueueContextType | null>(null)

// ============================================
// Queue Provider Component
// ============================================

export function QueueProvider({ children, setQueueCallback }: QueueProviderProps) {
    const [queue, setQueue] = useState<Song[]>([])
    const [isInPartyRoom, setIsInPartyRoom] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    // Use ref to store queue for stable callback reference
    const queueRef = useRef<Song[]>([])
    queueRef.current = queue

    // Debounced save function ref to prevent recreating on each render
    const debouncedSaveRef = useRef(
        debounce((q: Song[]) => {
            saveQueueToStorage(q)
        }, 300)
    )

    // Load queue from localStorage on mount
    useEffect(() => {
        const savedQueue = loadQueueFromStorage()
        if (savedQueue.length > 0) {
            setQueue(savedQueue)
        }
        setIsLoaded(true)
    }, [])

    // Create stable getNextFromQueue callback that uses ref
    const getNextFromQueueStable = useCallback((): Song | null => {
        if (queueRef.current.length === 0) return null

        const [nextSong, ...remaining] = queueRef.current
        setQueue(remaining)
        return nextSong
    }, [])

    // Register queue callback with player on mount
    useEffect(() => {
        setQueueCallback(getNextFromQueueStable)

        // Cleanup: unregister callback on unmount
        return () => {
            setQueueCallback(null)
        }
    }, [setQueueCallback, getNextFromQueueStable])

    // Save queue to localStorage when it changes (debounced)
    useEffect(() => {
        if (!isLoaded) return // Don't save on initial load

        debouncedSaveRef.current(queue)
    }, [queue, isLoaded])

    // Add song to queue
    const addToQueue = useCallback((song: Song) => {
        // Guard: don't modify queue in party room
        if (isInPartyRoom) {
            console.warn('Queue actions disabled in party room')
            return
        }

        setQueue(prev => {
            // Prevent duplicate songs in queue
            if (prev.some(s => s.id === song.id)) {
                return prev
            }
            return [...prev, song]
        })
    }, [isInPartyRoom])

    // Remove song from queue by ID
    const removeFromQueue = useCallback((songId: string) => {
        // Guard: don't modify queue in party room
        if (isInPartyRoom) {
            console.warn('Queue actions disabled in party room')
            return
        }

        setQueue(prev => prev.filter(s => s.id !== songId))
    }, [isInPartyRoom])

    // Clear entire queue
    const clearQueue = useCallback(() => {
        // Guard: don't modify queue in party room
        if (isInPartyRoom) {
            console.warn('Queue actions disabled in party room')
            return
        }

        setQueue([])
        clearQueueStorage()
    }, [isInPartyRoom])

    // Get and remove next song from queue (for external use)
    const getNextFromQueue = useCallback((): Song | null => {
        if (queue.length === 0) return null

        const [nextSong, ...remaining] = queue
        setQueue(remaining)
        return nextSong
    }, [queue])

    // Reorder queue via drag-drop
    const reorderQueue = useCallback((oldIndex: number, newIndex: number) => {
        // Guard: don't modify queue in party room
        if (isInPartyRoom) {
            console.warn('Queue actions disabled in party room')
            return
        }

        setQueue(prev => arrayMove(prev, oldIndex, newIndex))
    }, [isInPartyRoom])

    // Set party room mode (disables queue actions)
    const setPartyRoomMode = useCallback((inParty: boolean) => {
        setIsInPartyRoom(inParty)
    }, [])

    const value: QueueContextType = {
        queue,
        isInPartyRoom,
        addToQueue,
        removeFromQueue,
        clearQueue,
        getNextFromQueue,
        reorderQueue,
        setPartyRoomMode,
    }

    return (
        <QueueContext.Provider value={value}>
            {children}
        </QueueContext.Provider>
    )
}

// ============================================
// Hook to use Queue Context
// ============================================

export function useQueue() {
    const context = useContext(QueueContext)
    if (!context) {
        throw new Error('useQueue must be used within a QueueProvider')
    }
    return context
}

