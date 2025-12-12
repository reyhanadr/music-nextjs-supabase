'use client'

import { Song } from '@/types'

// ============================================
// Queue Storage Utility
// Handles localStorage persistence for queue state
// ============================================

const QUEUE_STORAGE_KEY = 'music-player-queue'
const PLAYER_STATE_KEY = 'music-player-state'

export interface QueueStorageData {
    queue: Song[]
}

export interface PlayerStorageData {
    currentSong: Song | null
    currentTime: number
    isPlaying: boolean
}

// ============================================
// Queue Storage Functions
// ============================================

/**
 * Load queue from localStorage
 */
export function loadQueueFromStorage(): Song[] {
    if (typeof window === 'undefined') return []

    try {
        const data = localStorage.getItem(QUEUE_STORAGE_KEY)
        if (!data) return []

        const parsed: QueueStorageData = JSON.parse(data)
        return parsed.queue || []
    } catch (error) {
        console.warn('Failed to load queue from localStorage:', error)
        return []
    }
}

/**
 * Save queue to localStorage
 */
export function saveQueueToStorage(queue: Song[]): void {
    if (typeof window === 'undefined') return

    try {
        const data: QueueStorageData = { queue }
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
        console.warn('Failed to save queue to localStorage:', error)
    }
}

/**
 * Clear queue from localStorage
 */
export function clearQueueStorage(): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.removeItem(QUEUE_STORAGE_KEY)
    } catch (error) {
        console.warn('Failed to clear queue from localStorage:', error)
    }
}

// ============================================
// Player State Storage Functions
// ============================================

/**
 * Load player state from localStorage
 */
export function loadPlayerStateFromStorage(): PlayerStorageData | null {
    if (typeof window === 'undefined') return null

    try {
        const data = localStorage.getItem(PLAYER_STATE_KEY)
        if (!data) return null

        return JSON.parse(data) as PlayerStorageData
    } catch (error) {
        console.warn('Failed to load player state from localStorage:', error)
        return null
    }
}

/**
 * Save player state to localStorage
 */
export function savePlayerStateToStorage(state: PlayerStorageData): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(state))
    } catch (error) {
        console.warn('Failed to save player state to localStorage:', error)
    }
}

/**
 * Clear player state from localStorage
 */
export function clearPlayerStateStorage(): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.removeItem(PLAYER_STATE_KEY)
    } catch (error) {
        console.warn('Failed to clear player state from localStorage:', error)
    }
}

// ============================================
// Debounce Utility
// ============================================

/**
 * Create a debounced version of a function
 * @param fn Function to debounce
 * @param delay Delay in milliseconds (default 300ms)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number = 300
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null

    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }
        timeoutId = setTimeout(() => {
            fn(...args)
        }, delay)
    }
}
