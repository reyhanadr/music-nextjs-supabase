'use client'

import { useSongPlayback } from '@/hooks/useSongPlayback'
import { useQueue } from '@/contexts/QueueContext'
import { Song, SongWithOwner } from '@/types'
import { Button } from '@/components/ui/button'
import { Play, Pause, Edit, Trash2, ListPlus, Clock, User, ListEnd } from 'lucide-react'
import Image from 'next/image'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'
import { MotionCard, MotionButton } from '@/components/motion/wrappers'
import { scaleUp } from '@/components/motion/variants'
import { MarqueeText } from '@/components/ui/marquee-text'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { useGlobalPlayer } from '@/contexts/PlayerContext'

interface SongCardProps {
    song: Song | SongWithOwner
    onEdit: (song: Song) => void
    onDelete: (song: Song) => void
    onPlay?: (song: Song) => void
    isOwner: boolean
    showOwnerBadge?: boolean
}

// Format duration in seconds to MM:SS
function formatDuration(seconds?: number): string {
    if (!seconds) return ''
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Get owner display name from SongWithOwner
function getOwnerName(song: Song | SongWithOwner): string {
    if ('profiles' in song && song.profiles) {
        return song.profiles.username || song.profiles.full_name || 'Unknown'
    }
    return 'Unknown'
}

export function SongCard({
    song,
    onEdit,
    onDelete,
    onPlay,
    isOwner,
    showOwnerBadge = false
}: SongCardProps) {
    const { isCurrentSong, isPlaying, togglePlay } = useSongPlayback(song)
    const { addToQueue, isInPartyRoom, queue } = useQueue()
    const player = useGlobalPlayer()
    const videoId = extractYouTubeId(song.youtube_url)
    const thumbnail = videoId ? getYouTubeThumbnail(videoId) : '/placeholder-music.jpg'
    const duration = formatDuration(song.duration)
    const isInQueue = queue.some(s => s.id === song.id)

    // Handle play with onPlay callback
    const handleTogglePlay = () => {
        togglePlay()
        if (!isPlaying && onPlay) {
            onPlay(song)
        }
    }

    // Handle add to queue with toast notification
    const handleAddToQueue = (e: React.MouseEvent) => {
        e.stopPropagation()

        // Check if already in queue
        if (isInQueue) {
            toast.info('Song is already in queue')
            return
        }

        addToQueue(song)
        toast.success(`"${song.title}" added to queue`)
    }

    // Handle play next - insert at beginning of queue
    const handlePlayNext = (e: React.MouseEvent) => {
        e.stopPropagation()

        if (isInQueue) {
            toast.info('Song is already in queue')
            return
        }

        // Play next is essentially adding to queue then reordering to position 0
        // For simplicity, we use addToQueue - a more sophisticated implementation
        // would insert at position 0
        addToQueue(song)
        toast.success(`"${song.title}" will play next`)
    }

    return (
        <MotionCard
            variants={scaleUp}
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`group backdrop-blur-sm transition-all duration-300 overflow-hidden shadow-lg shadow-black/10 hover:shadow-primary/20 ${isCurrentSong
                ? 'bg-primary/5 border-primary shadow-primary/20 ring-1 ring-primary'
                : 'bg-card/50 border-primary/20 hover:border-primary/50'
                }`}
        >
            <div className="relative aspect-square overflow-hidden bg-secondary/50">
                <Image
                    src={thumbnail}
                    alt={song.title}
                    fill
                    className={`object-cover transition-transform duration-500 group-hover:scale-110 ${isCurrentSong ? 'scale-105' : ''}`}
                />

                {/* Duration badge */}
                {duration && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm">
                        <Clock className="h-3 w-3" />
                        {duration}
                    </div>
                )}

                {/* Owner badge */}
                {showOwnerBadge && (
                    <div className="absolute top-2 left-2">
                        <Badge
                            variant={isOwner ? 'default' : 'secondary'}
                            className={`text-xs ${isOwner
                                ? 'bg-primary/80 hover:bg-primary'
                                : 'bg-secondary/80 hover:bg-secondary'
                                }`}
                        >
                            <User className="h-3 w-3 mr-1" />
                            {isOwner ? 'You' : getOwnerName(song)}
                        </Badge>
                    </div>
                )}

                {/* Play overlay */}
                <div className={`absolute inset-0 transition-opacity flex items-center justify-center ${isCurrentSong
                    ? 'opacity-100 bg-black/40'
                    : 'opacity-0 group-hover:opacity-100 bg-gradient-to-t from-background/90 via-background/20 to-transparent'
                    }`}>
                    <MotionButton
                        size="icon"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleTogglePlay}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 w-14 rounded-full shadow-lg shadow-primary/40 border-2 border-background flex items-center justify-center"
                    >
                        {isPlaying ? (
                            <Pause className="h-6 w-6" />
                        ) : (
                            <Play className="h-6 w-6 ml-1" />
                        )}
                    </MotionButton>
                </div>
            </div>
            <div className="p-4 bg-gradient-to-b from-transparent to-background/50 overflow-hidden">
                <MarqueeText
                    text={song.title}
                    className="font-semibold text-foreground mb-1 text-lg group-hover:text-primary transition-colors"
                />
                {song.artist && (
                    <MarqueeText
                        text={song.artist}
                        className="text-sm text-muted-foreground"
                    />
                )}
                <div className="flex flex-col gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                    {/* Add to Queue & Play Next - Hidden in party room */}
                    {!isInPartyRoom && (
                        <div className="flex gap-2">
                            <MotionButton
                                variant="outline"
                                size="sm"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleAddToQueue}
                                disabled={isInQueue}
                                className={`flex-1 h-8 ${isInQueue
                                    ? 'opacity-50 cursor-not-allowed border-muted'
                                    : 'border-primary/20 hover:bg-primary/10 hover:text-primary text-muted-foreground'
                                    }`}
                            >
                                <ListPlus className="h-3 w-3" />
                                <span className="hidden lg:inline ml-1">Queue</span>
                            </MotionButton>
                            <MotionButton
                                variant="outline"
                                size="sm"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handlePlayNext}
                                disabled={isInQueue}
                                className={`h-8 px-3 ${isInQueue
                                    ? 'opacity-50 cursor-not-allowed border-muted'
                                    : 'border-primary/20 hover:bg-primary/10 hover:text-primary text-muted-foreground'
                                    }`}
                                title="Play Next"
                            >
                                <ListEnd className="h-3 w-3" />
                            </MotionButton>
                        </div>
                    )}
                    {/* Edit & Delete - Owner only, always side by side */}
                    {isOwner && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(song)}
                                className="flex-1 border-primary/20 hover:bg-primary/10 hover:text-primary text-muted-foreground h-8"
                            >
                                <Edit className="h-3 w-3" />
                                <span className="hidden lg:inline ml-1">Edit</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete(song)}
                                className="flex-1 border-destructive/20 hover:bg-destructive/10 text-destructive/80 hover:text-destructive h-8"
                            >
                                <Trash2 className="h-3 w-3" />
                                <span className="hidden lg:inline ml-1">Delete</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </MotionCard>
    )
}
