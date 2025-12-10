import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Users as UsersIcon } from 'lucide-react'
import { MotionCard, MotionDiv } from '@/components/motion/wrappers'
import { slideIn, staggerContainer } from '@/components/motion/variants'

interface UsersListProps {
    users: any[]
    hostId: string
    onlineCount?: number
}

export function UsersList({ users, hostId, onlineCount }: UsersListProps) {
    const displayCount = onlineCount !== undefined ? onlineCount : users.length

    return (
        <MotionCard
            variants={slideIn}
            initial="initial"
            animate="animate"
            className="bg-card/50 backdrop-blur-sm border-secondary/20"
        >
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <UsersIcon className="h-5 w-5 text-secondary-foreground" />
                    Listening ({displayCount})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <MotionDiv
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="space-y-3"
                >
                    {users.map((roomUser) => {
                        const profile = roomUser.profiles
                        const isHost = roomUser.user_id === hostId

                        return (
                            <MotionDiv
                                key={roomUser.id}
                                variants={slideIn}
                                className="flex items-center gap-3"
                            >
                                <Avatar className="h-10 w-10 border-2 border-primary/20">
                                    <AvatarFallback className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground">
                                        {profile?.full_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                    <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-black font-medium truncate">
                                        {profile?.full_name || profile?.username || 'Anonymous'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {isHost && <Badge variant="outline" className="text-xs border-primary/50 text-primary">Host</Badge>}
                                    </p>
                                </div>
                            </MotionDiv>
                        )
                    })}
                </MotionDiv>
            </CardContent>
        </MotionCard>
    )
}
