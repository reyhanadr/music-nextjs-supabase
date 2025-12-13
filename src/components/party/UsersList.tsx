import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Card } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Users as UsersIcon, CalendarDays } from 'lucide-react'

interface UsersListProps {
    users: any[]
    hostId: string
    onlineCount?: number
}

export function UsersList({ users, hostId, onlineCount }: UsersListProps) {
    const displayCount = onlineCount !== undefined ? onlineCount : users.length

    const formatJoinedDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <Card className="bg-card/50 backdrop-blur-sm border-secondary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <UsersIcon className="h-5 w-5 text-secondary-foreground" />
                    Listening ({displayCount})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {users.map((roomUser) => {
                        const profile = roomUser.profiles
                        const isHost = roomUser.user_id === hostId

                        return (
                            <HoverCard key={roomUser.id} openDelay={200} closeDelay={100}>
                                <HoverCardTrigger asChild>
                                    <div
                                        className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300 cursor-pointer rounded-lg p-2 -m-2 transition-colors hover:bg-accent/50"
                                    >
                                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                                            <AvatarFallback className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground">
                                                {profile?.full_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || 'U'}
                                            </AvatarFallback>
                                            <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-foreground font-medium truncate">
                                                {profile?.full_name || profile?.username || 'Anonymous'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {isHost && <Badge variant="outline" className="text-xs border-primary/50 text-primary">Host</Badge>}
                                            </p>
                                        </div>
                                    </div>
                                </HoverCardTrigger>
                                <HoverCardContent
                                    className="w-80 bg-card/95 backdrop-blur-md border-secondary/30"
                                    side="right"
                                    align="start"
                                >
                                    <div className="flex gap-4">
                                        <Avatar className="h-16 w-16 border-2 border-primary/30 shadow-lg">
                                            <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-primary-foreground text-xl font-semibold">
                                                {profile?.full_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || 'U'}
                                            </AvatarFallback>
                                            <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                                        </Avatar>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-base font-semibold text-foreground">
                                                    {profile?.full_name || profile?.username || 'Anonymous'}
                                                </h4>
                                                {isHost && (
                                                    <Badge className="bg-primary/20 text-primary border-primary/50 hover:bg-primary/30">
                                                        Host
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <CalendarDays className="h-4 w-4 text-secondary-foreground" />
                                                <span>Bergabung: {formatJoinedDate(roomUser.joined_at)}</span>
                                            </div>
                                            <div className="pt-2">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <span className="relative flex h-2.5 w-2.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">Sedang mendengarkan</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </HoverCardContent>
                            </HoverCard>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

