'use client'

import { RoomMessage } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatChatTime } from '@/lib/formatChatTime'
import { useAuthContext } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ChatBubbleProps {
    message: RoomMessage
}

export function ChatBubble({ message }: ChatBubbleProps) {
    const { user } = useAuthContext()
    const isOwnMessage = user?.id === message.user_id

    const displayName = message.profiles?.full_name || message.profiles?.username || 'Anonymous'
    const avatarFallback = displayName[0]?.toUpperCase() || 'U'
    const avatarUrl = message.profiles?.avatar_url

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
                'flex gap-2 group',
                isOwnMessage ? 'flex-row-reverse' : 'flex-row'
            )}
        >
            {/* Avatar */}
            <Avatar className="h-8 w-8 flex-shrink-0 border border-primary/20">
                <AvatarFallback className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground text-xs">
                    {avatarFallback}
                </AvatarFallback>
                <AvatarImage src={avatarUrl || undefined} className="object-cover" />
            </Avatar>

            {/* Message Content */}
            <div className={cn(
                'flex flex-col max-w-[75%]',
                isOwnMessage ? 'items-end' : 'items-start'
            )}>
                {/* Username */}
                <span className={cn(
                    'text-xs text-muted-foreground mb-1 px-1',
                    isOwnMessage ? 'text-right' : 'text-left'
                )}>
                    {isOwnMessage ? 'You' : displayName}
                </span>

                {/* Bubble */}
                <div className={cn(
                    'px-3 py-2 rounded-2xl text-sm break-words',
                    isOwnMessage
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-card/80 border border-secondary/20 text-foreground rounded-bl-md'
                )}>
                    {message.message}
                </div>

                {/* Timestamp */}
                <span className={cn(
                    'text-[10px] text-muted-foreground mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity',
                    isOwnMessage ? 'text-right' : 'text-left'
                )}>
                    {formatChatTime(message.created_at)}
                </span>
            </div>
        </motion.div>
    )
}
