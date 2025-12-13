import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

// Create a Supabase client for Edge runtime (no cookies needed for public read)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
    request: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const { roomId } = await params

    // Fetch room data
    const { data: room } = await supabase
        .from('rooms')
        .select(`
            id,
            name,
            is_playing,
            current_song_title,
            current_song_artist,
            current_song_youtube_url,
            listener_count,
            playlist,
            host_profile:profiles!host_id(full_name, username, avatar_url)
        `)
        .eq('id', roomId)
        .single()

    if (!room) {
        // Return a fallback image if room not found
        return new ImageResponse(
            (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                        fontFamily: 'system-ui, sans-serif',
                    }}
                >
                    <div style={{ fontSize: 64, color: '#fff', marginBottom: 16 }}>🎵</div>
                    <div style={{ fontSize: 32, color: '#888', textAlign: 'center' }}>
                        Room Not Found
                    </div>
                </div>
            ),
            { width: 1200, height: 630 }
        )
    }

    // Get host info
    const hostProfile = Array.isArray(room.host_profile)
        ? room.host_profile[0]
        : room.host_profile
    const hostName = hostProfile?.full_name || hostProfile?.username || 'Unknown Host'

    // Get YouTube thumbnail if available
    let thumbnailUrl: string | null = null
    if (room.current_song_youtube_url) {
        const videoIdMatch = room.current_song_youtube_url.match(
            /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
        )
        if (videoIdMatch) {
            thumbnailUrl = `https://img.youtube.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`
        }
    }

    // Playlist count
    const playlistCount = room.playlist?.length || 0
    const listenerCount = room.listener_count || 0

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                    fontFamily: 'system-ui, sans-serif',
                    position: 'relative',
                }}
            >
                {/* Background decorations */}
                <div
                    style={{
                        position: 'absolute',
                        top: -100,
                        left: -50,
                        width: 400,
                        height: 400,
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
                        borderRadius: '50%',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: -150,
                        right: -100,
                        width: 500,
                        height: 500,
                        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)',
                        borderRadius: '50%',
                    }}
                />

                {/* Main content container */}
                <div
                    style={{
                        display: 'flex',
                        flex: 1,
                        padding: 60,
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    {/* Left side - Thumbnail */}
                    <div
                        style={{
                            width: 420,
                            height: 420,
                            borderRadius: 24,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)',
                            border: '2px solid rgba(139, 92, 246, 0.3)',
                            flexShrink: 0,
                            marginRight: 50,
                        }}
                    >
                        {thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={thumbnailUrl}
                                alt=""
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                        ) : (
                            <div style={{ fontSize: 120, opacity: 0.5 }}>🎵</div>
                        )}
                    </div>

                    {/* Right side - Room info */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            flex: 1,
                            gap: 20,
                        }}
                    >
                        {/* Status badge */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    background: room.is_playing
                                        ? 'rgba(34, 197, 94, 0.2)'
                                        : 'rgba(156, 163, 175, 0.2)',
                                    border: room.is_playing
                                        ? '1px solid rgba(34, 197, 94, 0.5)'
                                        : '1px solid rgba(156, 163, 175, 0.3)',
                                    borderRadius: 20,
                                    padding: '8px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <div
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        background: room.is_playing ? '#22c55e' : '#9ca3af',
                                    }}
                                />
                                <span
                                    style={{
                                        color: room.is_playing ? '#22c55e' : '#9ca3af',
                                        fontSize: 18,
                                        fontWeight: 500,
                                    }}
                                >
                                    {room.is_playing ? 'Now Playing' : 'Idle'}
                                </span>
                            </div>
                        </div>

                        {/* Room name */}
                        <div
                            style={{
                                fontSize: 56,
                                fontWeight: 700,
                                color: '#fff',
                                lineHeight: 1.1,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}
                        >
                            {room.name}
                        </div>

                        {/* Host info */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                            }}
                        >
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: 18,
                                    fontWeight: 600,
                                }}
                            >
                                {hostName.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ color: '#a1a1aa', fontSize: 22 }}>
                                Hosted by{' '}
                                <span style={{ color: '#fff', fontWeight: 500 }}>{hostName}</span>
                            </span>
                        </div>

                        {/* Current song info */}
                        {room.current_song_title && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    border: '1px solid rgba(139, 92, 246, 0.2)',
                                    borderRadius: 16,
                                    padding: '16px 20px',
                                }}
                            >
                                <span style={{ color: '#a1a1aa', fontSize: 16 }}>Now Playing</span>
                                <span
                                    style={{
                                        color: '#fff',
                                        fontSize: 24,
                                        fontWeight: 600,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {room.current_song_title}
                                </span>
                                {room.current_song_artist && (
                                    <span style={{ color: '#a1a1aa', fontSize: 18 }}>
                                        {room.current_song_artist}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Stats */}
                        <div
                            style={{
                                display: 'flex',
                                gap: 24,
                                marginTop: 8,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 24 }}>👥</span>
                                <span style={{ color: '#a1a1aa', fontSize: 20 }}>
                                    {listenerCount} listening
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 24 }}>🎵</span>
                                <span style={{ color: '#a1a1aa', fontSize: 20 }}>
                                    {playlistCount} songs
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '20px 60px 30px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <span style={{ fontSize: 32 }}>🎶</span>
                        <span
                            style={{
                                fontSize: 28,
                                fontWeight: 700,
                                background: 'linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%)',
                                backgroundClip: 'text',
                                color: 'transparent',
                            }}
                        >
                            Music Party
                        </span>
                    </div>
                    <span style={{ color: '#6b7280', fontSize: 18 }}>
                        Join the party now!
                    </span>
                </div>
            </div>
        ),
        { width: 1200, height: 630 }
    )
}
