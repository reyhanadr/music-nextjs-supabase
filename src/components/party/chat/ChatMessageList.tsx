'use client'

import { RoomMessage } from '@/types'
import { ChatBubble } from './ChatBubble'
import { Loader2, MessageCircle } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'

interface ChatMessageListProps {
    messages: RoomMessage[]
    loading: boolean
    messagesContainerRef: React.RefObject<HTMLDivElement | null>
}

export function ChatMessageList({ messages, loading, messagesContainerRef }: ChatMessageListProps) {
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
        )
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <MessageCircle className="h-8 w-8 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Be the first to say something!</p>
            </div>
        )
    }

    return (
        <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto space-y-3 px-1 py-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
        >
            <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                    <ChatBubble key={message.id} message={message} />
                ))}
            </AnimatePresence>
        </div>
    )
}
