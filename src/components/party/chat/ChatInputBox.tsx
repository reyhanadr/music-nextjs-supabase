'use client'

import { useState, useCallback, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface ChatInputBoxProps {
    onSendMessage: (message: string) => Promise<void>
    sending: boolean
    disabled?: boolean
}

export function ChatInputBox({ onSendMessage, sending, disabled }: ChatInputBoxProps) {
    const [message, setMessage] = useState('')

    const handleSend = useCallback(async () => {
        if (!message.trim() || sending || disabled) return

        const messageToSend = message
        setMessage('')
        await onSendMessage(messageToSend)
    }, [message, sending, disabled, onSendMessage])

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }, [handleSend])

    const isDisabled = !message.trim() || sending || disabled

    return (
        <div className="flex gap-2 pt-3 border-t border-secondary/20">
            <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={sending || disabled}
                className="flex-1 bg-card text-foreground border-secondary/30 focus:border-primary/50 placeholder:text-muted-foreground"
            />
            <motion.div
                whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                whileTap={{ scale: isDisabled ? 1 : 0.95 }}
            >
                <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={isDisabled}
                    className="shrink-0 bg-primary hover:bg-primary/90 disabled:opacity-50"
                >
                    {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </motion.div>
        </div>
    )
}
