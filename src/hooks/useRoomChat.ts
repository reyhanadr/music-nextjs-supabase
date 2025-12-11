'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RoomMessage } from '@/types'
import { useAuth } from '@/hooks/useAuth'

interface UseRoomChatOptions {
    roomId: string
    limit?: number
}

interface UseRoomChatReturn {
    messages: RoomMessage[]
    loading: boolean
    sending: boolean
    sendMessage: (message: string) => Promise<void>
    messagesContainerRef: React.RefObject<HTMLDivElement | null>
}

export function useRoomChat({ roomId, limit = 50 }: UseRoomChatOptions): UseRoomChatReturn {
    const [messages, setMessages] = useState<RoomMessage[]>([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const messagesContainerRef = useRef<HTMLDivElement | null>(null)
    const supabase = createClient()
    const { user } = useAuth()

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
    }, [])

    // Fetch initial messages
    const fetchMessages = useCallback(async () => {
        setLoading(true)

        const { data, error } = await supabase
            .from('room_messages')
            .select(`
                id,
                room_id,
                user_id,
                message,
                created_at,
                profiles:user_id (
                    full_name,
                    username,
                    avatar_url
                )
            `)
            .eq('room_id', roomId)
            .order('created_at', { ascending: true })
            .limit(limit)

        if (error) {
            console.error('Error fetching messages:', error)
        } else if (data) {
            // Transform the nested profiles object
            const transformedMessages: RoomMessage[] = data.map((msg: any) => ({
                id: msg.id,
                room_id: msg.room_id,
                user_id: msg.user_id,
                message: msg.message,
                created_at: msg.created_at,
                profiles: msg.profiles || undefined
            }))
            setMessages(transformedMessages)
            // Scroll to bottom after initial load
            setTimeout(scrollToBottom, 100)
        }

        setLoading(false)
    }, [roomId, limit, supabase, scrollToBottom])

    // Send message with optimistic update
    const sendMessage = useCallback(async (message: string) => {
        if (!user?.id || !message.trim()) return

        const trimmedMessage = message.trim()
        setSending(true)

        // Create optimistic message
        const optimisticMessage: RoomMessage = {
            id: `temp-${Date.now()}`,
            room_id: roomId,
            user_id: user.id,
            message: trimmedMessage,
            created_at: new Date().toISOString(),
            profiles: undefined // Will be filled by realtime update
        }

        // Add optimistic message immediately
        setMessages(prev => [...prev, optimisticMessage])
        setTimeout(scrollToBottom, 50)

        // Insert to database
        const { error } = await supabase
            .from('room_messages')
            .insert({
                room_id: roomId,
                user_id: user.id,
                message: trimmedMessage
            })

        if (error) {
            console.error('Error sending message:', error)
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
        }

        setSending(false)
    }, [roomId, user, supabase, scrollToBottom])

    // Subscribe to realtime updates
    useEffect(() => {
        if (!user?.id) return

        // Fetch initial messages
        fetchMessages()

        // Set up realtime subscription
        const channel = supabase
            .channel(`room_messages:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'room_messages',
                    filter: `room_id=eq.${roomId}`
                },
                async (payload) => {
                    const newMessage = payload.new as any

                    // Don't add if it's our own optimistic message
                    // Check by user_id and message content to avoid duplicates
                    setMessages(prev => {
                        // Remove optimistic message if exists
                        const withoutOptimistic = prev.filter(
                            m => !(m.id.startsWith('temp-') && m.user_id === newMessage.user_id && m.message === newMessage.message)
                        )

                        // Check if already exists
                        if (withoutOptimistic.some(m => m.id === newMessage.id)) {
                            return withoutOptimistic
                        }

                        // Fetch profile for the new message
                        const fetchAndAddMessage = async () => {
                            const { data: profileData } = await supabase
                                .from('profiles')
                                .select('full_name, username, avatar_url')
                                .eq('id', newMessage.user_id)
                                .single()

                            const messageWithProfile: RoomMessage = {
                                id: newMessage.id,
                                room_id: newMessage.room_id,
                                user_id: newMessage.user_id,
                                message: newMessage.message,
                                created_at: newMessage.created_at,
                                profiles: profileData || undefined
                            }

                            setMessages(current => {
                                // Ensure no duplicates
                                if (current.some(m => m.id === newMessage.id)) {
                                    return current
                                }
                                return [...current.filter(m => !m.id.startsWith('temp-')), messageWithProfile]
                                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                            })
                            setTimeout(scrollToBottom, 50)
                        }

                        fetchAndAddMessage()
                        return withoutOptimistic
                    })
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'room_messages',
                    filter: `room_id=eq.${roomId}`
                },
                (payload) => {
                    const deletedMessage = payload.old as any
                    setMessages(prev => prev.filter(m => m.id !== deletedMessage.id))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId, user?.id, supabase, fetchMessages, scrollToBottom])

    return {
        messages,
        loading,
        sending,
        sendMessage,
        messagesContainerRef
    }
}
