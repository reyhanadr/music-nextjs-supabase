'use client'

import { useRoomChat } from '@/hooks/useRoomChat'
import { ChatMessageList } from './ChatMessageList'
import { ChatInputBox } from './ChatInputBox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatPanelProps {
    roomId: string
    className?: string
}

export function ChatPanel({ roomId, className }: ChatPanelProps) {
    const { messages, loading, sending, sendMessage, messagesContainerRef } = useRoomChat({ roomId })

    return (
        <Card className={cn(
            'bg-card/50 backdrop-blur-sm border-secondary/20 flex flex-col',
            className
        )}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <MessageCircle className="h-5 w-5 text-secondary-foreground" />
                    Live Chat
                    {messages.length > 0 && (
                        <span className="text-xs text-muted-foreground font-normal">
                            ({messages.length})
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-80">
                <ChatMessageList
                    messages={messages}
                    loading={loading}
                    messagesContainerRef={messagesContainerRef}
                />
                <ChatInputBox
                    onSendMessage={sendMessage}
                    sending={sending}
                />
            </CardContent>
        </Card>
    )
}
