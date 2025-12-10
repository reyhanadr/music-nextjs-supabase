'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/layout/Navigation'
import { CreateRoomDialog } from '@/components/party/CreateRoomDialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Users, Music, Play } from 'lucide-react'
import Link from 'next/link'

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 pb-24">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                            Party Rooms
                        </h1>
                        <p className="text-slate-400 mt-1">
                            Join a room or create your own to listen together
                        </p>
                    </div>
                    <CreateRoomDialog onRoomCreated={fetchRooms} />
                </div>

                {loading ? (
                    <div className="text-center text-slate-400 py-12">Loading rooms...</div>
                ) : rooms.length === 0 ? (
                    <div className="text-center py-12">
                        <Music className="h-16 w-16 mx-auto text-slate-700 mb-4" />
                        <p className="text-slate-400 mb-4">No active rooms. Create one to get started!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rooms.map((room) => (
                            <Card
                                key={room.id}
                                className="bg-slate-900/50 border-slate-800 hover:border-purple-500/40 transition-all hover:scale-105 group"
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-white truncate">{room.name}</CardTitle>
                                            <CardDescription className="text-slate-400 mt-1">
                                                {room.playlist?.length || 0} songs in playlist
                                            </CardDescription>
                                        </div>
                                        {room.is_playing && (
                                            <Badge variant="outline" className="border-green-500/50 text-green-400">
                                                <Play className="h-3 w-3 mr-1" />
                                                Playing
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <Users className="h-4 w-4" />
                                        <span>{room.room_users?.[0]?.count || 0} listening</span>
                                    </div>
                                    <Link href={`/party/${room.id}`}>
                                        <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                                            Join Room
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
