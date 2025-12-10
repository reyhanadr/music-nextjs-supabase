'use client'

import { Song } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Edit, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'

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
        <Card className="group bg-slate-900/50 border-slate-800 hover:border-purple-500/40 transition-all duration-300 overflow-hidden hover:scale-105">
            <div className="relative aspect-square">
                <Image
                    src={thumbnail}
                    alt={song.title}
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <Button
                        size="icon"
                        onClick={() => onPlay(song)}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 h-12 w-12 rounded-full"
                    >
                        <Play className="h-5 w-5 ml-0.5" />
                    </Button>
                </div>
            </div>
            <div className="p-4">
                <h3 className="font-semibold text-white truncate mb-1">{song.title}</h3>
                {song.artist && (
                    <p className="text-sm text-slate-400 truncate">{song.artist}</p>
                )}
                {isOwner && (
                    <div className="flex gap-2 mt-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(song)}
                            className="flex-1 border-slate-700 hover:bg-slate-800 hover:text-white"
                        >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(song)}
                            className="flex-1 border-red-900/50 hover:bg-red-900/20 text-red-400 hover:text-red-300"
                        >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    )
}
