'use client'

import { useState } from 'react'
import { useRoomChat } from '@/hooks/useRoomChat'
import { ChatMessageList } from './ChatMessageList'
import { ChatInputBox } from './ChatInputBox'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { MessageCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MobileChatButtonProps {
    roomId: string
    className?: string
}

export function MobileChatButton({ roomId, className }: MobileChatButtonProps) {
    const [open, setOpen] = useState(false)
    const { messages, loading, sending, sendMessage, messagesContainerRef } = useRoomChat({ roomId })

    // Show unread indicator if there are new messages (simple implementation)
    const hasMessages = messages.length > 0

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <motion.div
                    className={cn(
                        'fixed bottom-6 right-6 z-50',
                        className
                    )}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                    <Button
                        size="lg"
                        className="h-14 w-14 rounded-full shadow-lg shadow-primary/30 bg-primary hover:bg-primary/90 relative"
                    >
                        <MessageCircle className="h-6 w-6" />

                        {/* Unread indicator */}
                        <AnimatePresence>
                            {hasMessages && !open && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center"
                                >
                                    <span className="text-[10px] text-white font-bold">
                                        {messages.length > 99 ? '99+' : messages.length}
                                    </span>
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Button>
                </motion.div>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md h-[80vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-md border-primary/20">
                <DialogHeader className="px-4 py-3 border-b border-secondary-foreground ">
                    <DialogTitle className="flex items-center gap-2 text-foreground">
                        <MessageCircle className="h-5 w-5 text-secondary-foreground" />
                        Live Chat
                        {messages.length > 0 && (
                            <span className="text-xs text-muted-foreground font-normal">
                                ({messages.length})
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex flex-col overflow-hidden px-4 py-3">
                    <ChatMessageList
                        messages={messages}
                        loading={loading}
                        messagesContainerRef={messagesContainerRef}
                    />
                    <ChatInputBox
                        onSendMessage={sendMessage}
                        sending={sending}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
