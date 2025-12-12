'use client'

import { useState } from 'react'
import { Song } from '@/types'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog'
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    ChevronDown,
    ListMusic,
    ExternalLink,
    Repeat2,
} from 'lucide-react'
import { extractYouTubeId, formatTime, getYouTubeThumbnail } from '@/lib/youtube'
import Image from 'next/image'
import { MotionDiv, MotionButton } from '@/components/motion/wrappers'
import { AnimatePresence } from 'framer-motion'
import { QueuePanel } from './QueuePanel'

// ============================================
// Expanded Music Player Component
// Fullscreen modal view for playing song details
// ============================================

interface ExpandedMusicPlayerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentSong: Song | null
    isPlaying: boolean
    currentTime: number
    duration: number
    isRepeat: boolean
    onPlayPause: () => void
    onNext: () => void
    onPrevious: () => void
    onSeek: (seconds: number) => void
    onToggleRepeat: () => void
}

export function ExpandedMusicPlayer({
    open,
    onOpenChange,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    isRepeat,
    onPlayPause,
    onNext,
    onPrevious,
    onSeek,
    onToggleRepeat,
}: ExpandedMusicPlayerProps) {
    const [showQueue, setShowQueue] = useState(false)

    if (!currentSong) return null

    const videoId = extractYouTubeId(currentSong.youtube_url)
    const thumbnail = videoId ? getYouTubeThumbnail(videoId, 'maxres') : null
    const displayDuration = currentSong.duration || duration

    // Handle seek from slider
    const handleSeek = (value: number[]) => {
        onSeek(value[0])
    }

    // Open YouTube Music link
    const openYouTubeMusic = () => {
        if (videoId) {
            window.open(`https://music.youtube.com/watch?v=${videoId}`, '_blank')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="max-w-full w-full h-[100dvh] sm:h-[85vh] sm:max-h-[700px] sm:max-w-lg p-0 gap-0 border-0 sm:border bg-gradient-to-b from-background via-sidebar to-background overflow-hidden flex flex-col"
            >
                {/* Main Content */}
                <MotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col h-full min-h-0"
                >
                    {/* Header - Fixed height */}
                    <div className="flex items-center justify-between p-3 sm:p-4 border-b border-primary/10 flex-shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10"
                        >
                            <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6" />
                        </Button>

                        <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                            Now Playing
                        </span>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowQueue(!showQueue)}
                            className={`h-8 w-8 sm:h-10 sm:w-10 transition-all ${showQueue
                                ? 'text-primary bg-primary/20 ring-2 ring-primary/30'
                                : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <ListMusic className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                    </div>

                    {/* Content Area - Scrollable, takes remaining space */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                        <AnimatePresence mode="wait">
                            {showQueue ? (
                                <MotionDiv
                                    key="queue"
                                    initial={{ opacity: 0, x: 100 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 100 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full p-4"
                                >
                                    <QueuePanel className="h-full" />
                                </MotionDiv>
                            ) : (
                                <MotionDiv
                                    key="artwork"
                                    initial={{ opacity: 0, x: -100 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col items-center justify-center p-4 sm:p-6 h-full"
                                >
                                    {/* Artwork - Responsive sizes */}
                                    <MotionDiv
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.1, duration: 0.4 }}
                                        className="relative w-48 h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-2xl overflow-hidden shadow-2xl shadow-black/40 mb-4 sm:mb-6 md:mb-8"
                                    >
                                        {thumbnail ? (
                                            <Image
                                                src={thumbnail}
                                                alt={currentSong.title}
                                                fill
                                                className="object-cover"
                                                priority
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                                <Play className="h-16 w-16 sm:h-20 sm:w-20 text-primary/40" />
                                            </div>
                                        )}
                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                                    </MotionDiv>

                                    {/* Song Info */}
                                    <MotionDiv
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-center mb-4 sm:mb-6 px-4 max-w-full"
                                    >
                                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1 sm:mb-2 line-clamp-2">
                                            {currentSong.title}
                                        </h2>
                                        {currentSong.artist && (
                                            <p className="text-sm sm:text-base text-muted-foreground line-clamp-1">
                                                {currentSong.artist}
                                            </p>
                                        )}
                                    </MotionDiv>

                                    {/* YouTube Music Link */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={openYouTubeMusic}
                                        className="text-muted-foreground hover:text-primary mb-4"
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Open in YouTube Music
                                    </Button>
                                </MotionDiv>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Bottom Controls - Always Visible, never shrinks */}
                    <MotionDiv
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-3 sm:p-4 md:p-6 border-t border-primary/10 bg-background/50 backdrop-blur-sm flex-shrink-0"
                    >
                        {/* Progress Bar */}
                        <div className="mb-3 sm:mb-4 md:mb-6">
                            <Slider
                                value={[currentTime]}
                                max={displayDuration || 100}
                                step={1}
                                onValueChange={handleSeek}
                                className="cursor-pointer"
                            />
                            <div className="flex justify-between mt-1 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground font-mono">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(displayDuration)}</span>
                            </div>
                        </div>

                        {/* Playback Controls - Responsive sizes */}
                        <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6">
                            {/* Queue Toggle */}
                            <MotionButton
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowQueue(!showQueue)}
                                className={`h-10 w-10 sm:h-12 sm:w-12 transition-all ${showQueue
                                    ? 'text-primary bg-primary/20 ring-2 ring-primary/30'
                                    : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <ListMusic className="h-5 w-5 sm:h-6 sm:w-6" />
                            </MotionButton>

                            {/* Skip Back */}
                            <MotionButton
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                variant="ghost"
                                size="icon"
                                onClick={onPrevious}
                                className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground hover:text-foreground"
                            >
                                <SkipBack className="h-5 w-5 sm:h-6 sm:w-6" />
                            </MotionButton>

                            <MotionButton
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                size="icon"
                                onClick={onPlayPause}
                                className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                            >
                                {isPlaying ? (
                                    <Pause className="h-6 w-6 sm:h-8 sm:w-8" />
                                ) : (
                                    <Play className="h-6 w-6 sm:h-8 sm:w-8 ml-0.5 sm:ml-1" />
                                )}
                            </MotionButton>

                            <MotionButton
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                variant="ghost"
                                size="icon"
                                onClick={onNext}
                                className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground hover:text-foreground"
                            >
                                <SkipForward className="h-5 w-5 sm:h-6 sm:w-6" />
                            </MotionButton>

                            <MotionButton
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                variant="ghost"
                                size="icon"
                                onClick={onToggleRepeat}
                                className={`h-10 w-10 sm:h-12 sm:w-12 transition-all ${isRepeat
                                    ? 'text-primary bg-primary/20 ring-2 ring-primary/30'
                                    : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Repeat2 className="h-5 w-5 sm:h-6 sm:w-6" />
                            </MotionButton>
                        </div>
                    </MotionDiv>
                </MotionDiv>
            </DialogContent>
        </Dialog>
    )
}
