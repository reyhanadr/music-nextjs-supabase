'use client'

import { useEffect, useRef, useCallback } from 'react'

// ============================================
// Background Playback Hook
// Manages visibility changes, end detection guards,
// and mobile-specific safeguards for reliable
// background audio playback
// ============================================

interface UseBackgroundPlaybackProps {
    // Player instance (YouTube or audio element)
    player: any
    isPlayerReady: boolean
    isPlaying: boolean
    duration: number
    currentTime: number

    // Callbacks
    onEnded: () => void
    onVisibilityReturn?: () => void

    // Options
    isRepeat?: boolean
    endThreshold?: number // Seconds before end to trigger (default 0.5s)
    checkInterval?: number // Interval for time checking (default 250ms)
}

interface UseBackgroundPlaybackReturn {
    // Refs for external use
    endTriggeredRef: React.MutableRefObject<boolean>
    isTransitioningRef: React.MutableRefObject<boolean>

    // Manual reset function
    resetEndTrigger: () => void
}

export function useBackgroundPlayback({
    player,
    isPlayerReady,
    isPlaying,
    duration,
    currentTime,
    onEnded,
    onVisibilityReturn,
    isRepeat = false,
    endThreshold = 0.5,
    checkInterval = 250,
}: UseBackgroundPlaybackProps): UseBackgroundPlaybackReturn {
    // ============================================
    // Refs for stable callbacks and guards
    // ============================================

    // Guard against double end triggers
    const endTriggeredRef = useRef(false)

    // Guard against multiple transition calls (race condition prevention)
    const isTransitioningRef = useRef(false)

    // Store callbacks in refs to prevent stale closures
    const onEndedRef = useRef(onEnded)
    onEndedRef.current = onEnded

    const onVisibilityReturnRef = useRef(onVisibilityReturn)
    onVisibilityReturnRef.current = onVisibilityReturn

    // Track last known state for recovery
    const lastKnownTimeRef = useRef(0)
    const wasPlayingBeforeHiddenRef = useRef(false)

    // Debounce timer for end detection
    const endDebounceRef = useRef<NodeJS.Timeout | null>(null)

    // ============================================
    // Reset function
    // ============================================

    const resetEndTrigger = useCallback(() => {
        endTriggeredRef.current = false
        isTransitioningRef.current = false
        if (endDebounceRef.current) {
            clearTimeout(endDebounceRef.current)
            endDebounceRef.current = null
        }
    }, [])

    // ============================================
    // Safe end trigger with debounce
    // ============================================

    const triggerEnd = useCallback(() => {
        // Guard: Already triggered or transitioning
        if (endTriggeredRef.current || isTransitioningRef.current) {
            console.log('[BackgroundPlayback] End trigger blocked - already triggered or transitioning')
            return
        }

        // Clear any pending debounce
        if (endDebounceRef.current) {
            clearTimeout(endDebounceRef.current)
        }

        // Debounce the end trigger to prevent double fires
        endDebounceRef.current = setTimeout(() => {
            if (endTriggeredRef.current || isTransitioningRef.current) {
                return
            }

            console.log('[BackgroundPlayback] Triggering onEnded')
            endTriggeredRef.current = true
            isTransitioningRef.current = true

            // Call the onEnded callback
            onEndedRef.current()

            // Reset transitioning flag after a delay
            setTimeout(() => {
                isTransitioningRef.current = false
            }, 1000)
        }, 100) // 100ms debounce
    }, [])

    // ============================================
    // Visibility change handler
    // ============================================

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                // Tab is hidden - store current state
                wasPlayingBeforeHiddenRef.current = isPlaying
                lastKnownTimeRef.current = currentTime
                console.log('[BackgroundPlayback] Tab hidden, isPlaying:', isPlaying)
            } else if (document.visibilityState === 'visible') {
                // Tab is visible again
                console.log('[BackgroundPlayback] Tab visible, checking player state')

                if (!player || !isPlayerReady) return

                try {
                    // Check if player has ended while we were away
                    const playerState = typeof player.getPlayerState === 'function'
                        ? player.getPlayerState()
                        : null

                    const playerTime = typeof player.getCurrentTime === 'function'
                        ? player.getCurrentTime()
                        : currentTime

                    const playerDuration = typeof player.getDuration === 'function'
                        ? player.getDuration()
                        : duration

                    // YouTube.PlayerState: 0 = ended
                    if (playerState === 0 && !endTriggeredRef.current) {
                        console.log('[BackgroundPlayback] Player ended while hidden')
                        if (isRepeat) {
                            // Repeat mode: seek to beginning
                            if (typeof player.seekTo === 'function') {
                                player.seekTo(0, true)
                                player.playVideo?.()
                            }
                        } else {
                            triggerEnd()
                        }
                    }
                    // Check if near end
                    else if (
                        playerDuration > 0 &&
                        playerTime >= playerDuration - endThreshold &&
                        !endTriggeredRef.current
                    ) {
                        console.log('[BackgroundPlayback] Near end detected on visibility return')
                        if (!isRepeat) {
                            triggerEnd()
                        }
                    }

                    // Call visibility return callback if provided
                    onVisibilityReturnRef.current?.()
                } catch (error) {
                    console.warn('[BackgroundPlayback] Error checking player state:', error)
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [player, isPlayerReady, isPlaying, currentTime, duration, isRepeat, endThreshold, triggerEnd])

    // ============================================
    // Timer-based end detection fallback
    // For reliable background end detection
    // ============================================

    useEffect(() => {
        if (!isPlayerReady || !player || !isPlaying) return

        const checkEnd = () => {
            try {
                if (!player || endTriggeredRef.current || isTransitioningRef.current) return

                const playerTime = typeof player.getCurrentTime === 'function'
                    ? player.getCurrentTime()
                    : currentTime

                const playerDuration = typeof player.getDuration === 'function'
                    ? player.getDuration()
                    : duration

                // Check if we're at the end
                if (
                    playerDuration > 0 &&
                    playerTime > 0 &&
                    playerTime >= playerDuration - endThreshold
                ) {
                    console.log('[BackgroundPlayback] Timer detected end:', playerTime, '/', playerDuration)
                    if (!isRepeat) {
                        triggerEnd()
                    }
                }

                // Update last known time
                lastKnownTimeRef.current = playerTime
            } catch (error) {
                // Player might be unavailable, ignore
            }
        }

        const intervalId = setInterval(checkEnd, checkInterval)

        return () => {
            clearInterval(intervalId)
        }
    }, [player, isPlayerReady, isPlaying, currentTime, duration, isRepeat, endThreshold, checkInterval, triggerEnd])

    // ============================================
    // Mobile-specific: Orientation change guard
    // Prevents re-initialization on orientation change
    // ============================================

    useEffect(() => {
        const handleOrientationChange = () => {
            console.log('[BackgroundPlayback] Orientation change detected')
            // Store current playing state to restore after orientation change
            const currentlyPlaying = isPlaying
            const currentPosition = currentTime

            // After a short delay, ensure player state is preserved
            setTimeout(() => {
                if (player && isPlayerReady && currentlyPlaying) {
                    try {
                        const playerState = typeof player.getPlayerState === 'function'
                            ? player.getPlayerState()
                            : null

                        // If player paused due to orientation change, resume
                        if (playerState === 2 && currentlyPlaying) {
                            console.log('[BackgroundPlayback] Resuming after orientation change')
                            player.playVideo?.()
                        }
                    } catch (error) {
                        // Ignore
                    }
                }
            }, 500)
        }

        window.addEventListener('orientationchange', handleOrientationChange)

        return () => {
            window.removeEventListener('orientationchange', handleOrientationChange)
        }
    }, [player, isPlayerReady, isPlaying, currentTime])

    // ============================================
    // Mobile-specific: Page focus handler
    // Some mobile browsers use focus instead of visibility
    // ============================================

    useEffect(() => {
        const handleFocus = () => {
            console.log('[BackgroundPlayback] Page focus gained')

            if (!player || !isPlayerReady) return

            try {
                const playerState = typeof player.getPlayerState === 'function'
                    ? player.getPlayerState()
                    : null

                // If we were playing but now paused, and user didn't pause, resume
                if (wasPlayingBeforeHiddenRef.current && playerState === 2) {
                    console.log('[BackgroundPlayback] Resuming playback on focus')
                    player.playVideo?.()
                }

                // Check for ended state
                if (playerState === 0 && !endTriggeredRef.current && !isRepeat) {
                    triggerEnd()
                }
            } catch (error) {
                // Ignore
            }
        }

        const handleBlur = () => {
            wasPlayingBeforeHiddenRef.current = isPlaying
        }

        window.addEventListener('focus', handleFocus)
        window.addEventListener('blur', handleBlur)

        return () => {
            window.removeEventListener('focus', handleFocus)
            window.removeEventListener('blur', handleBlur)
        }
    }, [player, isPlayerReady, isPlaying, isRepeat, triggerEnd])

    // ============================================
    // Cleanup on unmount
    // ============================================

    useEffect(() => {
        return () => {
            if (endDebounceRef.current) {
                clearTimeout(endDebounceRef.current)
            }
        }
    }, [])

    return {
        endTriggeredRef,
        isTransitioningRef,
        resetEndTrigger,
    }
}
