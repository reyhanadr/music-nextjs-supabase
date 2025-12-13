'use client'

import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Users, Music, Play, Pause, Trash2, Link2, Circle } from 'lucide-react'
import { MotionCard, MotionDiv } from '@/components/motion/wrappers'
import { scaleUp } from '@/components/motion/variants'
import { MarqueeText } from '@/components/ui/marquee-text'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'
import { toast } from 'sonner'
import { EditRoomDialog } from './EditRoomDialog'
import { AnimatePresence, motion } from 'framer-motion'

interface RoomCardProps {
    room: {
        id: string
        name: string
        host_id: string
        current_song_id?: string
        current_time: number
        is_playing: boolean
        playlist: string[]
        created_at: string
        updated_at: string
        room_state?: 'active' | 'idle' | 'closed'
        current_song_title?: string
        current_song_artist?: string
        current_song_youtube_url?: string
        listener_count?: number
        // Joined host profile
        host_profile?: {
            id: string
            full_name?: string
            username?: string
            avatar_url?: string
        } | null
    }
    isOwner: boolean
    onDelete: (roomId: string) => void
    onRoomUpdated: () => void
}

export function RoomCard({ room, isOwner, onDelete, onRoomUpdated }: RoomCardProps) {
    // Get thumbnail from current song youtube URL
    const videoId = room.current_song_youtube_url
        ? extractYouTubeId(room.current_song_youtube_url)
        : null
    const thumbnail = videoId ? getYouTubeThumbnail(videoId) : null
    // Determine status badge
    const getStatusBadge = () => {
        if (room.is_playing) {
            return (
                <Badge
                    variant="outline"
                    className="border-green-500/50 text-green-400 bg-green-500/10 animate-pulse gap-1"
                >
                    <Play className="h-3 w-3 fill-current" />
                    Playing
                </Badge>
            )
        }
        if (room.room_state === 'idle' || (!room.is_playing && (room.listener_count === 0 || room.listener_count === undefined))) {
            return (
                <Badge
                    variant="outline"
                    className="border-muted-foreground/30 text-muted-foreground bg-muted/10 gap-1"
                >
                    <Circle className="h-2 w-2 fill-current" />
                    Idle
                </Badge>
            )
        }
        return (
            <Badge
                variant="outline"
                className="border-yellow-500/50 text-yellow-400 bg-yellow-500/10 gap-1"
            >
                <Pause className="h-3 w-3" />
                Paused
            </Badge>
        )
    }

    // Copy invite link (uses /invite/ route for OpenGraph metadata)
    const handleCopyLink = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const link = `${window.location.origin}/invite/${room.id}`
        navigator.clipboard.writeText(link)
        toast.success('Invite link copied!')
    }

    // Format last active time
    const lastActive = formatDistanceToNow(new Date(room.updated_at), { addSuffix: true })

    // Get host display name
    const hostName = room.host_profile?.full_name || room.host_profile?.username || 'Unknown Host'
    const hostInitial = hostName.charAt(0).toUpperCase()

    return (
        <MotionCard
            variants={scaleUp}
            whileHover={{ y: -5 }}
            className={`bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/40 transition-all shadow-lg shadow-black/10 hover:shadow-primary/5 group overflow-hidden ${room.is_playing ? 'ring-1 ring-green-500/20' : ''
                }`}
        >
            {/* Mini Thumbnail Header (if song playing) */}
            {room.current_song_title && (
                <div className="relative h-2 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20">
                    {room.is_playing && (
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-green-500/30 via-emerald-500/30 to-green-500/30"
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    )}
                </div>
            )}

            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-foreground truncate text-xl group-hover:text-primary transition-colors">
                            {room.name}
                        </CardTitle>
                        {/* Host Info */}
                        <div className="flex items-center gap-2 mt-2">
                            <Avatar className="h-5 w-5">
                                <AvatarImage src={room.host_profile?.avatar_url || undefined} />
                                <AvatarFallback className="text-[10px] bg-secondary">
                                    {hostInitial}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground truncate">
                                {hostName}
                            </span>
                        </div>
                    </div>
                    {getStatusBadge()}
                </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
                {/* Current Song */}
                {room.current_song_title ? (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20 border border-secondary/10">
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
                ) : (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm p-2 rounded-lg bg-secondary/10">
                        <Music className="h-4 w-4" />
                        <span>{room.playlist?.length || 0} songs in playlist</span>
                    </div>
                )}

                {/* Stats Row */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {/* Listener Count with Animation */}
                    <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={room.listener_count || 0}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {room.listener_count || 0} listening
                            </motion.span>
                        </AnimatePresence>
                    </div>
                    {/* Last Active */}
                    <span className="text-muted-foreground/70">
                        {lastActive}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Link href={`/party/${room.id}`} className="flex-1">
                        <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            Join Room
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyLink}
                        className="border-secondary/30 hover:bg-secondary/20 hover:border-primary/30"
                        title="Copy invite link"
                    >
                        <Link2 className="h-4 w-4" />
                    </Button>
                </div>

                {/* Owner Actions */}
                {isOwner && (
                    <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-all sm:transform sm:translate-y-2 sm:group-hover:translate-y-0">
                        <EditRoomDialog
                            room={room}
                            onRoomUpdated={onRoomUpdated}
                        />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-destructive/20 hover:bg-destructive/10 text-destructive/80 hover:text-destructive h-8"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    <span className="hidden md:inline ml-1">Delete</span>
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
                                        onClick={() => onDelete(room.id)}
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
    )
}
