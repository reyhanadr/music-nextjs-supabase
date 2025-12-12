'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useQueue } from '@/contexts/QueueContext'
import { useGlobalPlayer } from '@/contexts/PlayerContext'
import { Song } from '@/types'
import { Button } from '@/components/ui/button'
import { GripVertical, X, Trash2, ListMusic, Play } from 'lucide-react'
import Image from 'next/image'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'
import { MotionDiv, MotionButton } from '@/components/motion/wrappers'
import { AnimatePresence } from 'framer-motion'
import { MarqueeText } from '@/components/ui/marquee-text'

// ============================================
// Sortable Queue Item Component
// ============================================

interface SortableQueueItemProps {
    song: Song
    onRemove: (songId: string) => void
    onPlay: (song: Song) => void
    isDisabled: boolean
}

function SortableQueueItem({ song, onRemove, onPlay, isDisabled }: SortableQueueItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: song.id, disabled: isDisabled })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
    }

    const videoId = extractYouTubeId(song.youtube_url)
    const thumbnail = videoId ? getYouTubeThumbnail(videoId) : '/placeholder-music.jpg'

    return (
        <MotionDiv
            ref={setNodeRef}
            style={style}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/10 hover:border-primary/30 transition-all group ${isDragging ? 'shadow-lg ring-2 ring-primary/50' : ''
                }`}
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className={`touch-none p-1 rounded hover:bg-primary/10 transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
                    }`}
                disabled={isDisabled}
            >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Thumbnail */}
            <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                <Image
                    src={thumbnail}
                    alt={song.title}
                    fill
                    className="object-cover"
                />
            </div>

            {/* Song Info */}
            <div className="flex-1 min-w-0 overflow-hidden">
                <MarqueeText
                    text={song.title}
                    className="text-sm font-medium text-foreground"
                />
                {song.artist && (
                    <MarqueeText
                        text={song.artist}
                        className="text-xs text-muted-foreground"
                    />
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <MotionButton
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    size="icon"
                    variant="ghost"
                    onClick={() => onPlay(song)}
                    className="h-8 w-8 text-primary hover:bg-primary/10"
                >
                    <Play className="h-4 w-4" />
                </MotionButton>
                <MotionButton
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    size="icon"
                    variant="ghost"
                    onClick={() => onRemove(song.id)}
                    disabled={isDisabled}
                    className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                >
                    <X className="h-4 w-4" />
                </MotionButton>
            </div>
        </MotionDiv>
    )
}

// ============================================
// Queue Panel Component
// ============================================

interface QueuePanelProps {
    className?: string
}

export function QueuePanel({ className = '' }: QueuePanelProps) {
    const { queue, isInPartyRoom, removeFromQueue, clearQueue, reorderQueue } = useQueue()
    const player = useGlobalPlayer()

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Minimum drag distance before activation
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Handle drag end - reorder queue
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = queue.findIndex(s => s.id === active.id)
            const newIndex = queue.findIndex(s => s.id === over.id)
            reorderQueue(oldIndex, newIndex)
        }
    }

    // Play song from queue
    const handlePlayFromQueue = (song: Song) => {
        player.playSongDirectly(song)
    }

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ListMusic className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Queue</h3>
                    {queue.length > 0 && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            {queue.length} songs
                        </span>
                    )}
                </div>
                {queue.length > 0 && !isInPartyRoom && (
                    <MotionButton
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        variant="ghost"
                        size="sm"
                        onClick={clearQueue}
                        className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear All
                    </MotionButton>
                )}
            </div>

            {/* Party Mode Warning */}
            {isInPartyRoom && (
                <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 text-sm">
                    Queue is not available in Party Room
                </div>
            )}

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {queue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <ListMusic className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-sm">
                            Queue is empty
                        </p>
                        <p className="text-muted-foreground/60 text-xs mt-1">
                            Add songs from song cards
                        </p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={queue.map(s => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <AnimatePresence mode="popLayout">
                                {queue.map((song) => (
                                    <SortableQueueItem
                                        key={song.id}
                                        song={song}
                                        onRemove={removeFromQueue}
                                        onPlay={handlePlayFromQueue}
                                        isDisabled={isInPartyRoom}
                                    />
                                ))}
                            </AnimatePresence>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    )
}
