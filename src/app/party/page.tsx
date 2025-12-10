'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/layout/Navigation'
import { CreateRoomDialog } from '@/components/party/CreateRoomDialog'
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Users, Music, Play } from 'lucide-react'
import Link from 'next/link'
import { MotionDiv, MotionCard } from '@/components/motion/wrappers'
import { staggerContainer, slideUp, scaleUp, fadeIn } from '@/components/motion/variants'

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

    const fetchRooms = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('rooms')
            .select('*, room_users(count)')
            .order('created_at', { ascending: false })

        if (data) setRooms(data as RoomWithUsers[])
        setLoading(false)
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
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
                                </CardContent>
                            </MotionCard>
                        ))}
                    </MotionDiv>
                )}
            </main>
        </MotionDiv>
    )
}
