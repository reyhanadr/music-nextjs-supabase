'use client'

import { useSongPlayback } from '@/hooks/useSongPlayback'
import { Song } from '@/types'
import { Button } from '@/components/ui/button'
import { Play, Pause, Edit, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'
import { MotionCard, MotionButton } from '@/components/motion/wrappers'
import { scaleUp } from '@/components/motion/variants'
import { MarqueeText } from '@/components/ui/marquee-text'

interface SongCardProps {
    song: Song
    onPlay: (song: Song) => void
    onEdit: (song: Song) => void
    onDelete: (song: Song) => void
    isOwner: boolean
}

export function SongCard({ song, onEdit, onDelete, isOwner }: Omit<SongCardProps, 'onPlay'> & { onPlay?: never }) {
    const { isCurrentSong, isPlaying, togglePlay } = useSongPlayback(song)
    const videoId = extractYouTubeId(song.youtube_url)
    const thumbnail = videoId ? getYouTubeThumbnail(videoId) : '/placeholder-music.jpg'

    return (
        <MotionCard
            variants={scaleUp}
            whileHover={{ y: -5 }}
            className={`group backdrop-blur-sm transition-all duration-300 overflow-hidden shadow-lg shadow-black/10 hover:shadow-primary/10 ${isCurrentSong
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
                <div className={`absolute inset-0 transition-opacity flex items-center justify-center ${isCurrentSong
                    ? 'opacity-100 bg-black/40'
                    : 'opacity-0 group-hover:opacity-100 bg-gradient-to-t from-background/90 via-background/20 to-transparent'
                    }`}>
                    <MotionButton
                        size="icon"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={togglePlay}
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
                {isOwner && (
                    <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(song)}
                            className="flex-1 border-primary/20 hover:bg-primary/10 hover:text-primary text-muted-foreground h-8"
                        >
                            <Edit className="h-3 w-3" />
                            <span className="hidden md:inline">Edit</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(song)}
                            className="flex-1 border-destructive/20 hover:bg-destructive/10 text-destructive/80 hover:text-destructive h-8"
                        >
                            <Trash2 className="h-3 w-3" />
                            <span className="hidden md:inline">Delete</span>
                        </Button>
                    </div>
                )}
            </div>
        </MotionCard>
    )
}
