'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users as UsersIcon } from 'lucide-react'

interface UsersListProps {
    users: any[]
    hostId: string
}

export function UsersList({ users, hostId }: UsersListProps) {
    return (
        <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                    <UsersIcon className="h-5 w-5" />
                    Listening ({users.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {users.map((roomUser) => {
                    const profile = roomUser.profiles
                    const isHost = roomUser.user_id === hostId

                    return (
                        <div key={roomUser.id} className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-purple-500/30">
                                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                                    {profile?.full_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">
                                    {profile?.full_name || profile?.username || 'Anonymous'}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {isHost && <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">Host</Badge>}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
