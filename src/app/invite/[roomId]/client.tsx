'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Music, Users, Play, Pause, Circle, LogIn, UserPlus } from 'lucide-react'
import { MotionDiv } from '@/components/motion/wrappers'
import { fadeIn, slideUp } from '@/components/motion/variants'
import { MarqueeText } from '@/components/ui/marquee-text'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'
import Image from 'next/image'
import Link from 'next/link'

interface InvitePageClientProps {
    room: {
        id: string
        name: string
        host_id: string
        is_playing: boolean
        current_song_title?: string | null
        current_song_artist?: string | null
        current_song_youtube_url?: string | null
        listener_count?: number | null
        playlist?: string[]
        host_profile?: {
            id: string
            full_name?: string | null
            username?: string | null
            avatar_url?: string | null
        } | null
    }
    roomId: string
}

export default function InvitePageClient({ room, roomId }: InvitePageClientProps) {
    const [showAuthModal, setShowAuthModal] = useState(true)

    // Get thumbnail
    const videoId = room.current_song_youtube_url
        ? extractYouTubeId(room.current_song_youtube_url)
        : null
    const thumbnail = videoId ? getYouTubeThumbnail(videoId, 'maxres') : null

    // Host info
    const hostName = room.host_profile?.full_name || room.host_profile?.username || 'Unknown Host'
    const hostInitial = hostName.charAt(0).toUpperCase()

    // Status badge
    const getStatusBadge = () => {
        if (room.is_playing) {
            return (
                <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10 animate-pulse gap-1">
                    <Play className="h-3 w-3 fill-current" />
                    Playing
                </Badge>
            )
        }
        if (room.listener_count === 0 || room.listener_count === undefined || room.listener_count === null) {
            return (
                <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground bg-muted/10 gap-1">
                    <Circle className="h-2 w-2 fill-current" />
                    Idle
                </Badge>
            )
        }
        return (
            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 bg-yellow-500/10 gap-1">
                <Pause className="h-3 w-3" />
                Paused
            </Badge>
        )
    }

    return (
        <MotionDiv
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="min-h-screen bg-gradient-to-br from-background via-sidebar to-background flex items-center justify-center p-4"
        >
            {/* Background decorations */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[30%] h-[30%] bg-primary/30 rounded-full blur-[80px] opacity-25 animate-pulse" />
                <div className="absolute top-[5%] right-[-5%] w-[25%] h-[25%] bg-purple-500/25 rounded-full blur-[70px] opacity-50" />
                <div className="absolute bottom-[-5%] left-[10%] w-[35%] h-[35%] bg-accent/25 rounded-full blur-[90px] opacity-45" />
            </div>

            {/* Room Preview Card */}
            <MotionDiv
                variants={slideUp}
                className="relative z-10 w-full max-w-md"
            >
                <div className="bg-card/80 backdrop-blur-xl border border-primary/20 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Thumbnail Header */}
                    <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-sidebar">
                        {thumbnail ? (
                            <Image
                                src={thumbnail}
                                alt={room.name}
                                fill
                                className="object-cover opacity-80"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Music className="h-16 w-16 text-primary/50" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

                        {/* Status Badge */}
                        <div className="absolute top-4 right-4">
                            {getStatusBadge()}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        {/* Room Name */}
                        <h1 className="text-2xl font-bold text-foreground text-center">
                            {room.name}
                        </h1>

                        {/* Host Info */}
                        <div className="flex items-center justify-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={room.host_profile?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs bg-secondary">
                                    {hostInitial}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                                Hosted by <span className="text-foreground font-medium">{hostName}</span>
                            </span>
                        </div>

                        {/* Current Song */}
                        {room.current_song_title && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-secondary/10">
                                <div className="w-10 h-10 rounded bg-muted flex-shrink-0 overflow-hidden">
                                    {thumbnail ? (
                                        <Image
                                            src={thumbnail}
                                            alt=""
                                            width={40}
                                            height={40}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Music className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <MarqueeText
                                        text={room.current_song_title}
                                        className="text-sm font-medium text-foreground"
                                    />
                                    {room.current_song_artist && (
                                        <MarqueeText
                                            text={room.current_song_artist}
                                            className="text-xs text-muted-foreground"
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Users className="h-4 w-4" />
                                <span>{room.listener_count || 0} listening</span>
                            </div>
                            <span className="text-muted-foreground/30">•</span>
                            <span>{room.playlist?.length || 0} songs</span>
                        </div>

                        {/* Join Button */}
                        <Button
                            onClick={() => setShowAuthModal(true)}
                            className="w-full h-12 text-lg font-medium bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20"
                        >
                            Join Party Room
                        </Button>
                    </div>
                </div>

                {/* Logo */}
                <p className="text-center text-muted-foreground/50 text-sm mt-6">
                    Powered by <span className="text-primary font-medium">Music Party</span>
                </p>
            </MotionDiv>

            {/* Auth Modal */}
            <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
                <DialogContent className="bg-card/95 backdrop-blur-xl border-primary/20 text-foreground max-w-sm">
                    <DialogHeader className="text-center">
                        <DialogTitle className="text-xl font-bold text-center">
                            Login Required
                        </DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground">
                            You need to login or create an account to join this party room.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 mt-4">
                        <Link href={`/auth/login?redirect=/party/${roomId}`} className="block">
                            <Button className="w-full h-11 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20">
                                <LogIn className="h-4 w-4 mr-2" />
                                Login
                            </Button>
                        </Link>

                        <Link href={`/auth/register?redirect=/party/${roomId}`} className="block">
                            <Button variant="outline" className="w-full h-11 border-primary/30 hover:bg-primary/10 hover:border-primary/50">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create Account
                            </Button>
                        </Link>
                    </div>

                    <p className="text-xs text-center text-muted-foreground/70 mt-4">
                        After logging in, you&apos;ll be redirected to the party room.
                    </p>
                </DialogContent>
            </Dialog>
        </MotionDiv>
    )
}
