'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/layout/Navigation'
import { CreateRoomDialog } from '@/components/party/CreateRoomDialog'
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import { Users, Music, Play, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { MotionDiv, MotionCard, MotionButton } from '@/components/motion/wrappers'
import { staggerContainer, slideUp, scaleUp, fadeIn } from '@/components/motion/variants'
import { useAuth } from '@/hooks/useAuth'
import { EditRoomDialog } from '@/components/party/EditRoomDialog'
import { toast } from 'sonner'

interface RoomWithUsers {
    id: string
    name: string
    host_id: string
    current_song_id?: string
    current_time: number
    is_playing: boolean
    playlist: string[]
    created_at: string
    updated_at: string
    room_users?: { count: number }[]
}

export default function PartyPage() {
    const [rooms, setRooms] = useState<RoomWithUsers[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const { user } = useAuth()

    const fetchRooms = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('rooms')
            .select('*, room_users(count)')
            .order('created_at', { ascending: false })

        if (data) setRooms(data as RoomWithUsers[])
        setLoading(false)
    }

    const deleteRoom = async (roomId: string) => {
        // First delete all room_users
        await supabase
            .from('room_users')
            .delete()
            .eq('room_id', roomId)

        // Then delete the room
        const { error } = await supabase
            .from('rooms')
            .delete()
            .eq('id', roomId)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Room deleted successfully!')
            fetchRooms()
        }
    }

    useEffect(() => {
        fetchRooms()

        // Subscribe to room changes
        const channel = supabase
            .channel('rooms')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
                fetchRooms()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const RoomSkeleton = () => (
        <div className="bg-card/30 rounded-xl border border-primary/10 p-6 space-y-4 animate-pulse h-[200px]">
            <div className="flex justify-between items-start">
                <div className="space-y-2 w-2/3">
                    <div className="h-6 bg-secondary/50 rounded w-3/4" />
                    <div className="h-4 bg-secondary/30 rounded w-1/2" />
                </div>
                <div className="h-6 w-16 bg-secondary/30 rounded-full" />
            </div>
            <div className="pt-4 space-y-4">
                <div className="h-4 bg-secondary/30 rounded w-1/3" />
                <div className="h-10 bg-primary/20 rounded w-full" />
            </div>
        </div>
    )

    return (
        <MotionDiv
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="min-h-screen bg-gradient-to-br from-background via-sidebar to-background pb-24"
        >
            <Navigation />

            {/* Festive background decorative elements */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                {/* Top left - primary glow with pulse */}
                <div className="absolute top-[-10%] left-[-5%] w-[30%] h-[30%] bg-primary/30 rounded-full blur-[80px] opacity-25 animate-pulse" />
                {/* Top right - purple accent */}
                <div className="absolute top-[5%] right-[-5%] w-[25%] h-[25%] bg-purple-500/25 rounded-full blur-[70px] opacity-50" />
                {/* Center left - pink glow */}
                <div className="absolute top-[40%] left-[-8%] w-[20%] h-[20%] bg-pink-500/20 rounded-full blur-[60px] opacity-45" />
                {/* Center right - cyan/teal accent */}
                <div className="absolute top-[35%] right-[5%] w-[22%] h-[22%] bg-cyan-500/15 rounded-full blur-[70px] opacity-45" />
                {/* Bottom left - accent glow */}
                <div className="absolute bottom-[-5%] left-[10%] w-[35%] h-[35%] bg-accent/25 rounded-full blur-[90px] opacity-45" />
                {/* Bottom right - violet glow with pulse */}
                <div className="absolute bottom-[10%] right-[-10%] w-[28%] h-[28%] bg-violet-500/20 rounded-full blur-[80px] opacity-45 animate-pulse" style={{ animationDelay: '1s' }} />
                {/* Center floating glow */}
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] opacity-45" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
                <MotionDiv variants={slideUp} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-400 to-secondary-foreground bg-clip-text text-transparent">
                            Party Rooms
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            Join a room or create your own to listen together
                        </p>
                    </div>
                    <CreateRoomDialog onRoomCreated={fetchRooms} />
                </MotionDiv>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <RoomSkeleton key={i} />
                        ))}
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="text-center py-20 bg-card/30 rounded-2xl border border-primary/5">
                        <Music className="h-16 w-16 mx-auto text-primary/50 mb-4" />
                        <p className="text-muted-foreground mb-4 text-xl font-medium">No active rooms found.</p>
                        <p className="text-sm text-muted-foreground/70">Create one to get the party started!</p>
                    </div>
                ) : (
                    <MotionDiv
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {rooms.map((room) => (
                            <MotionCard
                                key={room.id}
                                variants={scaleUp}
                                whileHover={{ y: -5 }}
                                className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/40 transition-all shadow-lg shadow-black/10 hover:shadow-primary/5 group"
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <CardTitle className="text-foreground truncate text-xl group-hover:text-primary transition-colors">{room.name}</CardTitle>
                                            <CardDescription className="text-muted-foreground mt-1">
                                                {room.playlist?.length || 0} songs in playlist
                                            </CardDescription>
                                        </div>
                                        {room.is_playing && (
                                            <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10 animate-pulse">
                                                <Play className="h-3 w-3 mr-1 fill-current" />
                                                Playing
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                        <Users className="h-4 w-4" />
                                        <span>{room.room_users?.[0]?.count || 0} listening</span>
                                    </div>
                                    <Link href={`/party/${room.id}`} className="block">
                                        <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                            Join Room
                                        </Button>
                                    </Link>
                                    {user && room.host_id === user.id && (
                                        <div className="flex gap-2 mt-3 sm:opacity-0 sm:group-hover:opacity-100 transition-all sm:transform sm:translate-y-2 sm:group-hover:translate-y-0">
                                            <EditRoomDialog
                                                room={room}
                                                onRoomUpdated={fetchRooms}
                                            />
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 border-destructive/20 hover:bg-destructive/10 text-destructive/80 hover:text-destructive h-8"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        <span className="hidden md:inline">Delete</span>
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-primary/20 text-foreground">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-foreground">
                                                            Delete Room?
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription className="text-muted-foreground">
                                                            This action cannot be undone. All users will be removed and the room &quot;{room.name}&quot; will be permanently deleted.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="border-secondary/30 hover:bg-secondary/20">
                                                            Cancel
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive hover:bg-destructive/90 text-white"
                                                            onClick={() => deleteRoom(room.id)}
                                                        >
                                                            Delete Room
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    )}
                                </CardContent>
                            </MotionCard>
                        ))}
                    </MotionDiv>
                )}
            </main>
        </MotionDiv>
    )
}
