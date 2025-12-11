'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { Song } from '@/types'
import { toast } from 'sonner'
import { Music, Plus, ChevronUp, ChevronDown, X, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MotionDiv } from '@/components/motion/wrappers'
import { MarqueeText } from '@/components/ui/marquee-text'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'
import Image from 'next/image'

interface EditRoomDialogProps {
    room: {
        id: string
        name: string
        host_id: string
        current_song_id?: string
        playlist: string[]
    }
    onRoomUpdated?: () => void
}

export function EditRoomDialog({ room, onRoomUpdated }: EditRoomDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [roomName, setRoomName] = useState(room.name)
    const [allSongs, setAllSongs] = useState<Song[]>([])
    const [selectedSongIds, setSelectedSongIds] = useState<string[]>(room.playlist || [])
    const supabase = createClient()


    // Fetch all songs when dialog opens
    useEffect(() => {
        if (open) {
            const fetchSongs = async () => {
                const { data } = await supabase
                    .from('songs')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (data) setAllSongs(data)
            }
            fetchSongs()
            // Reset state to current room values
            setRoomName(room.name)
            setSelectedSongIds(room.playlist || [])
        }
    }, [open, supabase, room.name, room.playlist])

    // Get songs in current playlist order
    const playlistSongs = selectedSongIds
        .map(id => allSongs.find(s => s.id === id))
        .filter(Boolean) as Song[]

    // Get available songs (not in playlist)
    const availableSongs = allSongs.filter(song => !selectedSongIds.includes(song.id))

    const addSong = (songId: string) => {
        setSelectedSongIds(prev => [...prev, songId])
    }

    const removeSong = (songId: string) => {
        setSelectedSongIds(prev => prev.filter(id => id !== songId))
    }

    const moveSongUp = (index: number) => {
        if (index === 0) return
        setSelectedSongIds(prev => {
            const newOrder = [...prev]
                ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
            return newOrder
        })
    }

    const moveSongDown = (index: number) => {
        if (index === selectedSongIds.length - 1) return
        setSelectedSongIds(prev => {
            const newOrder = [...prev]
                ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
            return newOrder
        })
    }

    const handleSave = async () => {
        if (selectedSongIds.length === 0) {
            toast.error('Please select at least one song for the playlist')
            return
        }

        setLoading(true)

        const { error } = await supabase
            .from('rooms')
            .update({
                name: roomName,
                playlist: selectedSongIds,
                // Update current_song_id if it's no longer in playlist
                current_song_id: selectedSongIds.includes(room.current_song_id!)
                    ? room.current_song_id
                    : selectedSongIds[0],
            })
            .eq('id', room.id)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Room updated successfully!')
            setOpen(false)
            onRoomUpdated?.()
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-primary/20 hover:bg-primary/10 hover:text-primary text-muted-foreground h-8"
                >
                    <Pencil className="h-3 w-3" />
                    <span className="hidden md:inline">Edit</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/95 backdrop-blur-xl border-primary/20 text-foreground max-w-2xl max-h-[80vh] overflow-y-auto sm:rounded-xl shadow-2xl shadow-primary/10">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary/80 to-foreground bg-clip-text text-transparent">
                        Edit Party Room
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Update room settings and manage playlist
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Room Name */}
                    <div className="space-y-2">
                        <Label htmlFor="editRoomName" className="text-foreground/80">
                            Room Name <span className="text-primary">*</span>
                        </Label>
                        <Input
                            id="editRoomName"
                            placeholder="Enter room name"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            className="bg-secondary/50 border-secondary-foreground/10 focus:border-primary/50 focus:ring-primary/20"
                        />
                    </div>

                    {/* Current Playlist */}
                    <div className="space-y-2">
                        <Label className="text-foreground/80 text-sm">
                            Current Playlist ({selectedSongIds.length} songs)
                        </Label>
                        <div className="space-y-1.5 sm:space-y-2 max-h-40 sm:max-h-48 overflow-y-auto border border-secondary/20 rounded-xl p-2 sm:p-3 bg-secondary/20">
                            {playlistSongs.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-4">
                                    No songs in playlist. Add songs below!
                                </p>
                            ) : (
                                playlistSongs.map((song, index) => {
                                    const videoId = extractYouTubeId(song.youtube_url)
                                    const thumbnail = videoId ? getYouTubeThumbnail(videoId) : null
                                    return (
                                        <MotionDiv
                                            key={song.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-primary/10 border border-primary/30"
                                        >
                                            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 flex-shrink-0 text-[10px] sm:text-xs h-5 w-5 sm:h-auto sm:w-auto flex items-center justify-center p-0 sm:px-2 sm:py-0.5">
                                                {index + 1}
                                            </Badge>

                                            {/* Song Thumbnail */}
                                            <div className="relative h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 rounded-md overflow-hidden bg-secondary/50">
                                                {thumbnail ? (
                                                    <Image
                                                        src={thumbnail}
                                                        alt={song.title}
                                                        fill
                                                        className="object-cover"
                                                        sizes="40px"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <Music className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 overflow-hidden max-w-[200px] sm:max-w-none">
                                                <MarqueeText text={song.title} className="font-medium text-xs sm:text-sm text-foreground" />
                                                {song.artist && (
                                                    <MarqueeText text={song.artist} className="text-[10px] sm:text-xs text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="flex items-center flex-shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 sm:h-6 sm:w-6 hover:bg-primary/20"
                                                    onClick={() => moveSongUp(index)}
                                                    disabled={index === 0}
                                                >
                                                    <ChevronUp className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 sm:h-6 sm:w-6 hover:bg-primary/20"
                                                    onClick={() => moveSongDown(index)}
                                                    disabled={index === playlistSongs.length - 1}
                                                >
                                                    <ChevronDown className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 sm:h-6 sm:w-6 hover:bg-destructive/20 text-destructive"
                                                    onClick={() => removeSong(song.id)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </MotionDiv>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Available Songs */}
                    <div className="space-y-2">
                        <Label className="text-foreground/80 text-sm">
                            Available Songs ({availableSongs.length})
                        </Label>
                        <div className="space-y-1.5 sm:space-y-2 max-h-32 sm:max-h-40 overflow-y-auto border border-secondary/20 rounded-xl p-2 sm:p-3 bg-secondary/20">
                            {availableSongs.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-4">
                                    All songs are in the playlist
                                </p>
                            ) : (
                                availableSongs.map((song) => {
                                    const videoId = extractYouTubeId(song.youtube_url)
                                    const thumbnail = videoId ? getYouTubeThumbnail(videoId) : null
                                    return (
                                        <MotionDiv
                                            key={song.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-card/50 hover:bg-card border border-transparent hover:border-secondary/30 cursor-pointer transition-all"
                                            onClick={() => addSong(song.id)}
                                        >
                                            {/* Song Thumbnail */}
                                            <div className="relative h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 rounded-md overflow-hidden bg-secondary/50">
                                                {thumbnail ? (
                                                    <Image
                                                        src={thumbnail}
                                                        alt={song.title}
                                                        fill
                                                        className="object-cover"
                                                        sizes="40px"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <Music className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 overflow-hidden max-w-[250px] sm:max-w-none">
                                                <MarqueeText text={song.title} className="font-medium text-xs sm:text-sm text-muted-foreground" />
                                                {song.artist && (
                                                    <MarqueeText text={song.artist} className="text-[10px] sm:text-xs text-muted-foreground/70" />
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 sm:h-6 sm:w-6 hover:bg-primary/20 flex-shrink-0"
                                            >
                                                <Plus className="h-3 w-3 text-primary" />
                                            </Button>
                                        </MotionDiv>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    Saving...
                                </div>
                            ) : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
