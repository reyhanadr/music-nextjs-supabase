import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import InvitePageClient from './client'

interface InvitePageProps {
    params: Promise<{ roomId: string }>
}

// Generate dynamic metadata for OpenGraph
export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
    const { roomId } = await params
    const supabase = await createClient()

    const { data: room } = await supabase
        .from('rooms')
        .select(`
            *,
            host_profile:profiles!host_id(full_name, username, avatar_url)
        `)
        .eq('id', roomId)
        .single()

    if (!room) {
        return {
            title: 'Room Not Found - Music Party',
            description: 'This party room does not exist or has been deleted.',
        }
    }

    const hostName = room.host_profile?.full_name || room.host_profile?.username || 'Someone'
    const songInfo = room.current_song_title
        ? `Now playing: ${room.current_song_title}${room.current_song_artist ? ` by ${room.current_song_artist}` : ''}`
        : `${room.playlist?.length || 0} songs in playlist`
    const listenerText = room.listener_count === 1 ? '1 listener' : `${room.listener_count || 0} listeners`

    return {
        title: `Join ${room.name} - Music Party`,
        description: `${hostName} invited you to join "${room.name}"! ${songInfo}. ${listenerText} currently.`,
        openGraph: {
            type: 'website',
            title: `🎵 Join "${room.name}" on Music Party`,
            description: `${hostName} is hosting a party room! ${songInfo}`,
            siteName: 'Music Party',
            images: [
                {
                    url: `/api/og/invite/${roomId}`,
                    width: 1200,
                    height: 630,
                    alt: `Join ${room.name} party room`,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `🎵 Join "${room.name}" on Music Party`,
            description: `${hostName} is hosting a party room! ${songInfo}`,
            images: [`/api/og/invite/${roomId}`],
        },
    }
}

export default async function InvitePage({ params }: InvitePageProps) {
    const { roomId } = await params
    const supabase = await createClient()

    // Check if room exists
    const { data: room, error } = await supabase
        .from('rooms')
        .select(`
            id,
            name,
            host_id,
            is_playing,
            current_song_title,
            current_song_artist,
            current_song_youtube_url,
            listener_count,
            playlist,
            host_profile:profiles!host_id(id, full_name, username, avatar_url)
        `)
        .eq('id', roomId)
        .single()

    if (error || !room) {
        notFound()
    }

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()

    // If authenticated, redirect to the actual party room
    if (user) {
        redirect(`/party/${roomId}`)
    }

    // Transform the room data to match client props
    // Supabase returns host_profile as array when using foreign key joins
    const hostProfile = Array.isArray(room.host_profile)
        ? room.host_profile[0]
        : room.host_profile

    const roomData = {
        id: room.id,
        name: room.name,
        host_id: room.host_id,
        is_playing: room.is_playing,
        current_song_title: room.current_song_title,
        current_song_artist: room.current_song_artist,
        current_song_youtube_url: room.current_song_youtube_url,
        listener_count: room.listener_count,
        playlist: room.playlist as string[] | undefined,
        host_profile: hostProfile ? {
            id: hostProfile.id as string,
            full_name: hostProfile.full_name as string | null,
            username: hostProfile.username as string | null,
            avatar_url: hostProfile.avatar_url as string | null,
        } : null,
    }

    // If not authenticated, show the invite page with login modal
    return <InvitePageClient room={roomData} roomId={roomId} />
}

