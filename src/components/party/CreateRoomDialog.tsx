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
import { useAuth } from '@/hooks/useAuth'
import { Song } from '@/types'
import { toast } from 'sonner'
import { Plus, Music } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { MotionDiv, MotionButton } from '@/components/motion/wrappers'
import { slideIn, staggerContainer, scaleUp } from '@/components/motion/variants'
import { AnimatePresence } from 'framer-motion'

interface CreateRoomDialogProps {
    onRoomCreated?: () => void
}

export function CreateRoomDialog({ onRoomCreated }: CreateRoomDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [roomName, setRoomName] = useState('')
    const [songs, setSongs] = useState<Song[]>([])
    const [selectedSongs, setSelectedSongs] = useState<string[]>([])
    const { user } = useAuth()
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        if (open) {
            // Fetch available songs
            const fetchSongs = async () => {
                const { data } = await supabase
                    .from('songs')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (data) setSongs(data)
            }
            fetchSongs()
        }
    }, [open, supabase])

    const toggleSong = (songId: string) => {
        setSelectedSongs(prev =>
            prev.includes(songId)
                ? prev.filter(id => id !== songId)
                : [...prev, songId]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (selectedSongs.length === 0) {
            toast.error('Please select at least one song for the playlist')
            return
        }

        setLoading(true)

        const { data, error } = await supabase.from('rooms').insert({
            name: roomName,
            host_id: user?.id!,
            current_song_id: selectedSongs[0],
            playlist: selectedSongs,
            is_playing: false,
            current_time: 0,
        }).select().single()

        if (error) {
            toast.error(error.message)
            setLoading(false)
        } else {
            toast.success('Room created successfully!')
            setRoomName('')
            setSelectedSongs([])
            setOpen(false)
            setLoading(false)
            onRoomCreated?.()
            router.push(`/party/${data.id}`)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <MotionButton
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25 border-t border-white/20"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Room
                </MotionButton>
            </DialogTrigger>
            <DialogContent className="bg-card/95 backdrop-blur-xl border-primary/20 text-foreground max-w-2xl max-h-[80vh] overflow-y-auto sm:rounded-xl shadow-2xl shadow-primary/10">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary/80 to-foreground bg-clip-text text-transparent">Create Party Room</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Create a room and add songs to the playlist
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="roomName" className="text-foreground/80">Room Name <span className="text-primary">*</span></Label>
                        <Input
                            id="roomName"
                            placeholder="Enter room name"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            required
                            className="bg-secondary/50 border-secondary-foreground/10 focus:border-primary/50 focus:ring-primary/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-foreground/80">Select Songs for Playlist <span className="text-primary">*</span></Label>
                        <p className="text-xs text-muted-foreground">{selectedSongs.length} songs selected</p>

                        <div className="space-y-2 max-h-64 overflow-y-auto border border-secondary/20 rounded-xl p-3 bg-secondary/20">
                            {songs.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-8">No songs available. Add some songs first!</p>
                            ) : (
                                songs.map((song, index) => (
                                    <MotionDiv
                                        key={song.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => toggleSong(song.id)}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${selectedSongs.includes(song.id)
                                            ? 'bg-primary/10 border-primary/40 shadow-[0_0_10px_-3px_var(--primary)]'
                                            : 'bg-card/50 hover:bg-card border-transparent hover:border-sidebar-foreground/10'
                                            }`}
                                    >
                                        <Music className={`h-4 w-4 flex-shrink-0 transition-colors ${selectedSongs.includes(song.id) ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium truncate ${selectedSongs.includes(song.id) ? 'text-foreground' : 'text-muted-foreground'}`}>{song.title}</p>
                                            {song.artist && <p className="text-xs text-muted-foreground/70 truncate">{song.artist}</p>}
                                        </div>
                                        {selectedSongs.includes(song.id) && (
                                            <MotionDiv
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="flex-shrink-0"
                                            >
                                                <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                                                    {selectedSongs.indexOf(song.id) + 1}
                                                </Badge>
                                            </MotionDiv>
                                        )}
                                    </MotionDiv>
                                ))
                            )}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 text-lg font-medium bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] rounded-xl"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                <span>Creating...</span>
                            </div>
                        ) : 'Create Room'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
