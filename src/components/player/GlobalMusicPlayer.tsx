'use client'

import { usePathname } from 'next/navigation'
import { MusicPlayer } from '@/components/player/MusicPlayer'
import { useGlobalPlayer } from '@/contexts/PlayerContext'

export function GlobalMusicPlayer() {
    const pathname = usePathname()
    const player = useGlobalPlayer()

    // Hide player on party listing and party room pages
    const isPartyRoute = pathname?.startsWith('/party')

    // Also hide on login/register pages
    const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/' || pathname === '/auth/login' || pathname === '/auth/register' || pathname === '/auth/complete-profile' || pathname === '/changelog'

    if (isPartyRoute || isAuthRoute) {
        return null
    }

    return (
        <>
            {/* Spacer to prevent content overlap */}
            {player.currentSong && (
                <div className="h-24 md:h-20 w-full" data-testid="player-spacer" />
            )}
            <MusicPlayer
                currentSong={player.currentSong}
                isPlaying={player.isPlaying}
                currentTime={player.currentTime}
                duration={player.duration}
                volume={player.volume}
                isRepeat={player.isRepeat}
                onPlayPause={player.playPause}
                onNext={player.next}
                onPrevious={player.previous}
                onSeek={player.seek}
                onVolumeChange={player.setVolume}
                onToggleRepeat={player.toggleRepeat}
                onProgress={player.handleProgress}
                onDuration={player.handleDuration}
                onEnded={player.handleEnded}
            />
        </>
    )
}
