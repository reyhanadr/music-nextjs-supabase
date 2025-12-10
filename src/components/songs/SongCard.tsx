'use client'

import { Song } from '@/types'
import { Button } from '@/components/ui/button'
import { Play, Edit, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'
import { MotionCard, MotionButton } from '@/components/motion/wrappers'
import { scaleUp } from '@/components/motion/variants'

interface SongCardProps {
    song: Song
    onPlay: (song: Song) => void
    onEdit: (song: Song) => void
    onDelete: (song: Song) => void
    isOwner: boolean
}

export function SongCard({ song, onPlay, onEdit, onDelete, isOwner }: SongCardProps) {
    const videoId = extractYouTubeId(song.youtube_url)
    const thumbnail = videoId ? getYouTubeThumbnail(videoId) : '/placeholder-music.jpg'

    return (
        <MotionCard
            variants={scaleUp}
            whileHover={{ y: -5 }}
            className="group bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-all duration-300 overflow-hidden shadow-lg shadow-black/10 hover:shadow-primary/10"
        >
            <div className="relative aspect-square overflow-hidden bg-secondary/50">
                <Image
                    src={thumbnail}
                    alt={song.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                    <MotionButton
                        size="icon"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onPlay(song)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 w-14 rounded-full shadow-lg shadow-primary/40 border-2 border-background"
                    >
                        <Play className="h-6 w-6 ml-1" />
                    </MotionButton>
                </div>
            </div>
            <div className="p-4 bg-gradient-to-b from-transparent to-background/50">
                <h3 className="font-semibold text-foreground truncate mb-1 text-lg group-hover:text-primary transition-colors">{song.title}</h3>
                {song.artist && (
                    <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                )}
                {isOwner && (
                    <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(song)}
                            className="flex-1 border-primary/20 hover:bg-primary/10 hover:text-primary text-muted-foreground h-8"
                        >
                            <Edit className="h-3 w-3 mr-1.5" />
                            Edit
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(song)}
                            className="flex-1 border-destructive/20 hover:bg-destructive/10 text-destructive/80 hover:text-destructive h-8"
                        >
                            <Trash2 className="h-3 w-3 mr-1.5" />
                            Delete
                        </Button>
                    </div>
                )}
            </div>
        </MotionCard>
    )
}
