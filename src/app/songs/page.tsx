'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/layout/Navigation'
import { AddSongDialog } from '@/components/songs/AddSongDialog'
import { EditSongDialog } from '@/components/songs/EditSongDialog'
import { SongCard } from '@/components/songs/SongCard'
import { useGlobalPlayer } from '@/contexts/PlayerContext'
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
import { MotionDiv } from '@/components/motion/wrappers'
import { staggerContainer, slideUp, fadeIn } from '@/components/motion/variants'

export default function SongsPage() {
    const [songs, setSongs] = useState<Song[]>([])
    const [filteredSongs, setFilteredSongs] = useState<Song[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [editingSong, setEditingSong] = useState<Song | null>(null)
    const [deletingSong, setDeletingSong] = useState<Song | null>(null)
    const { user } = useAuth()
    const supabase = createClient()

    const player = useGlobalPlayer()

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

    // Skeleton Loader Component
    const SongSkeleton = () => (
        <div className="bg-card/30 rounded-xl overflow-hidden border border-primary/10 animate-pulse">
            <div className="aspect-square bg-secondary/50" />
            <div className="p-4 space-y-2">
                <div className="h-5 bg-secondary/50 rounded w-3/4" />
                <div className="h-4 bg-secondary/30 rounded w-1/2" />
            </div>
        </div>
    )

    return (
        <MotionDiv
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="min-h-screen bg-gradient-to-br from-background via-sidebar to-background pb-32"
        >
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
                <MotionDiv variants={slideUp} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                            Music Library
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            {songs.length} {songs.length === 1 ? 'song' : 'songs'} in your library
                        </p>
                    </div>
                    <AddSongDialog onSongAdded={fetchSongs} />
                </MotionDiv>

                <MotionDiv variants={slideUp} className="mb-8">
                    <div className="relative max-w-md group">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <Input
                            placeholder="Search songs or artists..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-secondary/30 border-secondary-foreground/10 focus:border-primary/50 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground transition-all hover:bg-secondary/50"
                        />
                    </div>
                </MotionDiv>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <SongSkeleton key={i} />
                        ))}
                    </div>
                ) : filteredSongs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-20 bg-card/30 rounded-2xl border border-primary/5">
                        <p className="text-xl font-medium">{searchQuery ? 'No songs found matching your search.' : 'No songs yet.'}</p>
                        {!searchQuery && <p className="mt-2 opacity-70">Add your first song to get started!</p>}
                    </div>
                ) : (
                    <MotionDiv
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                    >
                        {filteredSongs.map((song) => (
                            <SongCard
                                key={song.id}
                                song={song}
                                onEdit={setEditingSong}
                                onDelete={setDeletingSong}
                                isOwner={song.user_id === user?.id}
                            />
                        ))}
                    </MotionDiv>
                )}
            </main>



            <EditSongDialog
                song={editingSong}
                open={!!editingSong}
                onOpenChange={(open) => !open && setEditingSong(null)}
                onSongUpdated={fetchSongs}
            />

            <AlertDialog open={!!deletingSong} onOpenChange={(open) => !open && setDeletingSong(null)}>
                <AlertDialogContent className="bg-card border-destructive/20 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">Delete Song?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to delete "{deletingSong?.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-secondary hover:bg-secondary text-foreground">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </MotionDiv >
    )
}
