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
                <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Room
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-purple-500/20 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Party Room</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Create a room and add songs to the playlist
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="roomName">Room Name *</Label>
                        <Input
                            id="roomName"
                            placeholder="Enter room name"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            required
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Select Songs for Playlist *</Label>
                        <p className="text-sm text-slate-400">{selectedSongs.length} songs selected</p>
                        <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-800 rounded-lg p-3">
                            {songs.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-4">No songs available. Add some songs first!</p>
                            ) : (
                                songs.map(song => (
                                    <div
                                        key={song.id}
                                        onClick={() => toggleSong(song.id)}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedSongs.includes(song.id)
                                                ? 'bg-purple-500/20 border border-purple-500/50'
                                                : 'bg-slate-800/50 hover:bg-slate-800'
                                            }`}
                                    >
                                        <Music className="h-4 w-4 text-purple-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{song.title}</p>
                                            {song.artist && <p className="text-sm text-slate-400 truncate">{song.artist}</p>}
                                        </div>
                                        {selectedSongs.includes(song.id) && (
                                            <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                                                {selectedSongs.indexOf(song.id) + 1}
                                            </Badge>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Room'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
