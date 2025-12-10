'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/layout/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Music, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
    const { user } = useAuth()
    const [stats, setStats] = useState({ totalSongs: 0, activeRooms: 0 })
    const supabase = createClient()

    useEffect(() => {
        async function fetchStats() {
            const [songsResult, roomsResult] = await Promise.all([
                supabase.from('songs').select('id', { count: 'exact', head: true }),
                supabase.from('rooms').select('id', { count: 'exact', head: true })
            ])

            setStats({
                totalSongs: songsResult.count || 0,
                activeRooms: roomsResult.count || 0
            })
        }

        fetchStats()
    }, [supabase])

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 pb-24">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
                {/* Hero Section */}
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                        Welcome Back, {user?.email?.split('@')[0]}!
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Your music, your party. Listen together in real-time.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-500/20 backdrop-blur-sm hover:scale-105 transition-transform">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-white">Total Songs</CardTitle>
                                <Music className="h-5 w-5 text-purple-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-white">{stats.totalSongs}</p>
                            <p className="text-sm text-slate-400 mt-1">In your library</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-500/20 backdrop-blur-sm hover:scale-105 transition-transform">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-white">Active Rooms</CardTitle>
                                <Users className="h-5 w-5 text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-white">{stats.activeRooms}</p>
                            <p className="text-sm text-slate-400 mt-1">Join or create</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-pink-900/40 to-pink-800/20 border-pink-500/20 backdrop-blur-sm hover:scale-105 transition-transform">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-white">Listening</CardTitle>
                                <TrendingUp className="h-5 w-5 text-pink-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-white">Together</p>
                            <p className="text-sm text-slate-400 mt-1">Real-time sync</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm p-6 hover:border-purple-500/40 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-2xl text-white">Manage Your Music</CardTitle>
                            <CardDescription className="text-slate-400">
                                Add, edit, or remove songs from your library
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/songs">
                                <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                                    Go to Songs
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm p-6 hover:border-purple-500/40 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-2xl text-white">Join Party Mode</CardTitle>
                            <CardDescription className="text-slate-400">
                                Listen together with friends in synchronized rooms
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/party">
                                <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                                    Explore Rooms
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
