'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/layout/Navigation'
import { AddSongDialog } from '@/components/songs/AddSongDialog'
import { EditSongDialog } from '@/components/songs/EditSongDialog'
import { SongCard } from '@/components/songs/SongCard'
import { MusicPlayer } from '@/components/player/MusicPlayer'
import { usePlayer } from '@/hooks/usePlayer'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import { Song } from '@/types'
import { toast } from 'sonner'
import { Search } from 'lucide-react'

export default function SongsPage() {
    const [songs, setSongs] = useState<Song[]>([])
    const [filteredSongs, setFilteredSongs] = useState<Song[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [editingSong, setEditingSong] = useState<Song | null>(null)
    const [deletingSong, setDeletingSong] = useState<Song | null>(null)
    const { user } = useAuth()
    const supabase = createClient()

    const player = usePlayer()

    const fetchSongs = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('songs')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            toast.error(error.message)
        } else {
            setSongs(data || [])
            setFilteredSongs(data || [])
            player.setPlaylistSongs(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchSongs()
    }, [])

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = songs.filter(song =>
                song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                song.artist?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            setFilteredSongs(filtered)
        } else {
            setFilteredSongs(songs)
        }
    }, [searchQuery, songs])

    const handleDelete = async () => {
        if (!deletingSong) return

        const { error } = await supabase
            .from('songs')
            .delete()
            .eq('id', deletingSong.id)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Song deleted successfully!')
            fetchSongs()
        }
        setDeletingSong(null)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 pb-32">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            Music Library
                        </h1>
                        <p className="text-slate-400 mt-1">
                            {songs.length} {songs.length === 1 ? 'song' : 'songs'} in your library
                        </p>
                    </div>
                    <AddSongDialog onSongAdded={fetchSongs} />
                </div>

                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search songs or artists..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-slate-400 py-12">Loading songs...</div>
                ) : filteredSongs.length === 0 ? (
                    <div className="text-center text-slate-400 py-12">
                        {searchQuery ? 'No songs found matching your search.' : 'No songs yet. Add your first song!'}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredSongs.map((song) => (
                            <SongCard
                                key={song.id}
                                song={song}
                                onPlay={player.playSong}
                                onEdit={setEditingSong}
                                onDelete={setDeletingSong}
                                isOwner={song.user_id === user?.id}
                            />
                        ))}
                    </div>
                )}
            </main>

            <MusicPlayer
                currentSong={player.currentSong}
                isPlaying={player.isPlaying}
                currentTime={player.currentTime}
                duration={player.duration}
                volume={player.volume}
                onPlayPause={player.playPause}
                onNext={player.next}
                onPrevious={player.previous}
                onSeek={player.seek}
                onVolumeChange={player.setVolume}
                onProgress={player.handleProgress}
                onDuration={player.handleDuration}
                onEnded={player.handleEnded}
            />

            <EditSongDialog
                song={editingSong}
                open={!!editingSong}
                onOpenChange={(open) => !open && setEditingSong(null)}
                onSongUpdated={fetchSongs}
            />

            <AlertDialog open={!!deletingSong} onOpenChange={(open) => !open && setDeletingSong(null)}>
                <AlertDialogContent className="bg-slate-900 border-red-500/20">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Song?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            Are you sure you want to delete "{deletingSong?.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-700 hover:bg-slate-800">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
