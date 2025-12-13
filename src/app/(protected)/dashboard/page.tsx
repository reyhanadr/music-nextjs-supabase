'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/layout/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Music, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthContext } from '@/contexts/AuthContext'
import { MotionDiv, MotionCard } from '@/components/motion/wrappers'
import { scaleUp, hoverScale, slideUp, staggerContainer } from '@/components/motion/variants'

export default function DashboardPage() {
    // Profile is immediately available from SSR - no loading state needed
    const { user, profile } = useAuthContext()
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
        <div className="min-h-screen bg-gradient-to-br from-background via-sidebar to-background pb-24">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
                {/* Hero Section */}
                <MotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-400 to-secondary-foreground bg-clip-text text-transparent">
                        Welcome Back, {profile?.username || profile?.full_name || user?.email?.split('@')[0]}!
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Your music, your party. Listen together in real-time.
                    </p>
                </MotionDiv>

                {/* Stats Cards */}
                <MotionDiv
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                >
                    <MotionCard
                        variants={scaleUp}
                        whileHover={hoverScale}
                        className="bg-card/50 backdrop-blur-sm border-primary/10"
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-foreground">Total Songs</CardTitle>
                                <Music className="h-5 w-5 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-foreground">{stats.totalSongs}</p>
                            <p className="text-sm text-muted-foreground mt-1">In your library</p>
                        </CardContent>
                    </MotionCard>

                    <MotionCard
                        variants={scaleUp}
                        whileHover={hoverScale}
                        className="bg-card/50 backdrop-blur-sm border-secondary-foreground/10"
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-foreground">Active Rooms</CardTitle>
                                <Users className="h-5 w-5 text-secondary-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-foreground">{stats.activeRooms}</p>
                            <p className="text-sm text-muted-foreground mt-1">Join or create</p>
                        </CardContent>
                    </MotionCard>

                    <MotionCard
                        variants={scaleUp}
                        whileHover={hoverScale}
                        className="bg-card/50 backdrop-blur-sm border-chart-2/10"
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-foreground">Listening</CardTitle>
                                <TrendingUp className="h-5 w-5 text-chart-2" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-foreground">Together</p>
                            <p className="text-sm text-muted-foreground mt-1">Real-time sync</p>
                        </CardContent>
                    </MotionCard>
                </MotionDiv>

                {/* Quick Actions */}
                <MotionDiv
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    <MotionCard
                        variants={slideUp}
                        whileHover={hoverScale}
                        className="bg-card border-primary/10 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                        <CardHeader className="relative">
                            <CardTitle className="text-2xl text-foreground">Manage Your Music</CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Add, edit, or remove songs from your library
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="relative">
                            <Link href="/songs">
                                <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-primary-foreground shadow-lg shadow-primary/20">
                                    Go to Songs
                                </Button>
                            </Link>
                        </CardContent>
                    </MotionCard>

                    <MotionCard
                        variants={slideUp}
                        whileHover={hoverScale}
                        className="bg-card border-secondary/10 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-secondary-foreground/5 to-transparent pointer-events-none" />
                        <CardHeader className="relative">
                            <CardTitle className="text-2xl text-foreground">Join Party Mode</CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Listen together with friends in synchronized rooms
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="relative">
                            <Link href="/party">
                                <Button className="w-full bg-gradient-to-r from-secondary-foreground to-purple-600 hover:from-secondary-foreground/90 hover:to-purple-700 text-primary-foreground shadow-lg shadow-secondary-foreground/20">
                                    Explore Rooms
                                </Button>
                            </Link>
                        </CardContent>
                    </MotionCard>
                </MotionDiv>
            </main>
        </div>
    )
}
