'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Navigation } from '@/components/layout/Navigation'
import { AddSongDialog } from '@/components/songs/AddSongDialog'
import { EditSongDialog } from '@/components/songs/EditSongDialog'
import { SongCard } from '@/components/songs/SongCard'
import { SongFilters } from '@/components/songs/SongFilters'
import { EmptyState } from '@/components/songs/EmptyState'
import { ErrorState } from '@/components/songs/ErrorState'
import { useGlobalPlayer } from '@/contexts/PlayerContext'
import { useAuth } from '@/hooks/useAuth'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useMySongs, useGlobalSongs, useRecentlyPlayed, flattenGlobalSongs } from '@/hooks/useSongsData'
import { addToRecentlyPlayed } from '@/lib/recently-played'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Song, SongWithOwner, SortOption } from '@/types'
import { toast } from 'sonner'
import { Search, Music, Globe, Clock, Loader2 } from 'lucide-react'
import { MotionDiv } from '@/components/motion/wrappers'
import { staggerContainer, slideUp, fadeIn } from '@/components/motion/variants'
import { useQueryClient } from '@tanstack/react-query'

type TabValue = 'my' | 'global' | 'recent'

export default function SongsPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const queryClient = useQueryClient()
    const { user, loading: authLoading } = useAuth()
    const supabase = createClient()
    const player = useGlobalPlayer()

    // URL-synced tab state
    const initialTab = (searchParams.get('tab') as TabValue) || 'my'
    const [activeTab, setActiveTab] = useState<TabValue>(initialTab)

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedSearch = useDebouncedValue(searchQuery, 400)
    const [sortBy, setSortBy] = useState<SortOption>('newest')

    // Edit/Delete state
    const [editingSong, setEditingSong] = useState<Song | null>(null)
    const [deletingSong, setDeletingSong] = useState<Song | null>(null)

    // Search input ref for keyboard shortcut
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Infinite scroll observer ref
    const loadMoreRef = useRef<HTMLDivElement>(null)

    // Data queries
    const mySongsQuery = useMySongs({ searchQuery: debouncedSearch, sortBy })
    const globalSongsQuery = useGlobalSongs({ searchQuery: debouncedSearch, sortBy })
    const recentlyPlayedQuery = useRecentlyPlayed()

    const mySongs = mySongsQuery.data || []
    const globalSongs = flattenGlobalSongs(globalSongsQuery.data)
    const recentlyPlayed = recentlyPlayedQuery.data || []

    // Filter recently played by search
    const filteredRecentlyPlayed = recentlyPlayed.filter(song => {
        if (!debouncedSearch) return true
        const query = debouncedSearch.toLowerCase()
        return (
            song.title.toLowerCase().includes(query) ||
            song.artist?.toLowerCase().includes(query)
        )
    })

    // Sync tab to URL
    const handleTabChange = useCallback((value: string) => {
        const tab = value as TabValue
        setActiveTab(tab)
        router.push(`/songs?tab=${tab}`, { scroll: false })
    }, [router])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl + K to focus search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                searchInputRef.current?.focus()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Infinite scroll for global songs
    useEffect(() => {
        if (activeTab !== 'global' || !loadMoreRef.current) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && globalSongsQuery.hasNextPage && !globalSongsQuery.isFetchingNextPage) {
                    globalSongsQuery.fetchNextPage()
                }
            },
            { threshold: 0.1 }
        )

        observer.observe(loadMoreRef.current)
        return () => observer.disconnect()
    }, [activeTab, globalSongsQuery])

    // Update playlist in player when songs load (with stable reference check)
    const prevSongIdsRef = useRef<string>('')
    useEffect(() => {
        const allSongs = [...mySongs, ...globalSongs]
        const songIdsKey = allSongs.map(s => s.id).join(',')

        // Only update if song IDs actually changed
        if (allSongs.length > 0 && songIdsKey !== prevSongIdsRef.current) {
            prevSongIdsRef.current = songIdsKey
            player.setPlaylistSongs(allSongs)
        }
    }, [mySongs, globalSongs]) // eslint-disable-line react-hooks/exhaustive-deps

    // Handle song play (track recently played)
    const handleSongPlay = useCallback((song: Song) => {
        // Sync to Supabase and localStorage
        addToRecentlyPlayed(song, user?.id)
        // Invalidate query to refetch
        queryClient.invalidateQueries({ queryKey: ['songs', 'recently-played'] })
    }, [user?.id, queryClient])

    // Delete song handler
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
            // Invalidate queries to refetch
            queryClient.invalidateQueries({ queryKey: ['songs'] })
        }
        setDeletingSong(null)
    }

    // Refresh songs after add/edit
    const handleSongChange = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['songs'] })
    }, [queryClient])

    // Get current songs based on tab
    const getCurrentSongs = (): SongWithOwner[] | Song[] => {
        switch (activeTab) {
            case 'my':
                return mySongs
            case 'global':
                return globalSongs
            case 'recent':
                return filteredRecentlyPlayed
            default:
                return mySongs
        }
    }

    const currentSongs = getCurrentSongs()
    // Include auth loading and query pending states for proper skeleton display
    const isLoading = authLoading || (activeTab === 'my' ? (mySongsQuery.isLoading || mySongsQuery.isPending) : activeTab === 'global' ? globalSongsQuery.isLoading : false)
    const isError = activeTab === 'my' ? mySongsQuery.isError : activeTab === 'global' ? globalSongsQuery.isError : false

    // Get empty state type
    const getEmptyStateType = () => {
        if (debouncedSearch) return 'no-results'
        switch (activeTab) {
            case 'my': return 'no-songs'
            case 'global': return 'no-global'
            case 'recent': return 'no-recent'
            default: return 'no-songs'
        }
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

    // Tab counts
    const mySongsCount = mySongs.length
    const globalSongsCount = globalSongs.length
    const recentCount = filteredRecentlyPlayed.length

    return (
        <MotionDiv
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="min-h-screen bg-gradient-to-br from-background via-sidebar to-background pb-32"
        >
            <Navigation />

            {/* Background decorative elements */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] opacity-70" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/30 rounded-full blur-[100px] opacity-70" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
                {/* Header */}
                <MotionDiv variants={slideUp} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                            Music Library
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            {mySongsCount + globalSongsCount} songs available
                        </p>
                    </div>
                    <AddSongDialog onSongAdded={handleSongChange} />
                </MotionDiv>

                {/* Search & Filters */}
                <MotionDiv variants={slideUp} className="flex flex-row gap-2 sm:gap-4 mb-6">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Search songs, artists... (⌘K)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-secondary/30 border-secondary-foreground/10 focus:border-primary/50 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground transition-all hover:bg-secondary/50"
                        />
                    </div>
                    <SongFilters sortBy={sortBy} onSortChange={setSortBy} />
                </MotionDiv>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="mb-6 bg-card/50 border border-primary/10">
                        <TabsTrigger
                            value="my"
                            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
                        >
                            <Music className="h-4 w-4" />
                            <span className="hidden sm:inline">My Songs</span>
                            <span className="sm:hidden">Mine</span>
                            {mySongsCount > 0 && (
                                <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                                    {mySongsCount}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="global"
                            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
                        >
                            <Globe className="h-4 w-4" />
                            <span className="hidden sm:inline">Global Songs</span>
                            <span className="sm:hidden">Global</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="recent"
                            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
                        >
                            <Clock className="h-4 w-4" />
                            <span className="hidden sm:inline">Recently Played</span>
                            <span className="sm:hidden">Recent</span>
                            {recentCount > 0 && (
                                <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                                    {recentCount}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* My Songs Tab */}
                    <TabsContent value="my">
                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <SongSkeleton key={i} />
                                ))}
                            </div>
                        ) : isError ? (
                            <ErrorState onRetry={() => mySongsQuery.refetch()} />
                        ) : currentSongs.length === 0 ? (
                            <EmptyState
                                type={getEmptyStateType()}
                                searchQuery={debouncedSearch}
                                action={!debouncedSearch && <AddSongDialog onSongAdded={handleSongChange} />}
                            />
                        ) : (
                            <MotionDiv
                                variants={staggerContainer}
                                initial="initial"
                                animate="animate"
                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                            >
                                {(currentSongs as SongWithOwner[]).map((song) => (
                                    <SongCard
                                        key={song.id}
                                        song={song}
                                        onEdit={setEditingSong}
                                        onDelete={setDeletingSong}
                                        onPlay={handleSongPlay}
                                        isOwner={song.user_id === user?.id}
                                        showOwnerBadge={false}
                                    />
                                ))}
                            </MotionDiv>
                        )}
                    </TabsContent>

                    {/* Global Songs Tab */}
                    <TabsContent value="global">
                        {globalSongsQuery.isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <SongSkeleton key={i} />
                                ))}
                            </div>
                        ) : globalSongsQuery.isError ? (
                            <ErrorState onRetry={() => globalSongsQuery.refetch()} />
                        ) : globalSongs.length === 0 ? (
                            <EmptyState
                                type={getEmptyStateType()}
                                searchQuery={debouncedSearch}
                            />
                        ) : (
                            <>
                                <MotionDiv
                                    variants={staggerContainer}
                                    initial="initial"
                                    animate="animate"
                                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                                >
                                    {globalSongs.map((song) => (
                                        <SongCard
                                            key={song.id}
                                            song={song}
                                            onEdit={setEditingSong}
                                            onDelete={setDeletingSong}
                                            onPlay={handleSongPlay}
                                            isOwner={song.user_id === user?.id}
                                            showOwnerBadge={true}
                                        />
                                    ))}
                                </MotionDiv>

                                {/* Infinite scroll trigger */}
                                <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-8">
                                    {globalSongsQuery.isFetchingNextPage && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Loading more songs...</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* Recently Played Tab */}
                    <TabsContent value="recent">
                        {filteredRecentlyPlayed.length === 0 ? (
                            <EmptyState
                                type={getEmptyStateType()}
                                searchQuery={debouncedSearch}
                            />
                        ) : (
                            <MotionDiv
                                variants={staggerContainer}
                                initial="initial"
                                animate="animate"
                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                            >
                                {filteredRecentlyPlayed.map((song) => (
                                    <SongCard
                                        key={song.id}
                                        song={song}
                                        onEdit={setEditingSong}
                                        onDelete={setDeletingSong}
                                        onPlay={handleSongPlay}
                                        isOwner={song.user_id === user?.id}
                                        showOwnerBadge={false}
                                    />
                                ))}
                            </MotionDiv>
                        )}
                    </TabsContent>
                </Tabs>
            </main>

            {/* Dialogs */}
            <EditSongDialog
                song={editingSong}
                open={!!editingSong}
                onOpenChange={(open) => !open && setEditingSong(null)}
                onSongUpdated={handleSongChange}
            />

            <AlertDialog open={!!deletingSong} onOpenChange={(open) => !open && setDeletingSong(null)}>
                <AlertDialogContent className="bg-card border-destructive/20 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">Delete Song?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to delete &quot;{deletingSong?.title}&quot;? This action cannot be undone.
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
