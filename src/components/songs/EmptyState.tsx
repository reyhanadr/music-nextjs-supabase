'use client'

import { MotionDiv } from '@/components/motion/wrappers'
import { fadeIn } from '@/components/motion/variants'
import { Music, FolderOpen, Search, AlertCircle } from 'lucide-react'
import { ReactNode } from 'react'

interface EmptyStateProps {
    type: 'no-songs' | 'no-results' | 'no-global' | 'no-recent' | 'custom'
    searchQuery?: string
    customIcon?: ReactNode
    customTitle?: string
    customDescription?: string
    action?: ReactNode
}

const emptyStateConfig = {
    'no-songs': {
        icon: <Music className="h-12 w-12 text-muted-foreground/50" />,
        title: 'No songs yet',
        description: 'Add your first song to get started!',
    },
    'no-results': {
        icon: <Search className="h-12 w-12 text-muted-foreground/50" />,
        title: 'No songs found',
        description: 'Try adjusting your search or filters.',
    },
    'no-global': {
        icon: <FolderOpen className="h-12 w-12 text-muted-foreground/50" />,
        title: 'No global songs',
        description: 'Be the first to add a song to the global library!',
    },
    'no-recent': {
        icon: <Music className="h-12 w-12 text-muted-foreground/50" />,
        title: 'No recently played',
        description: 'Start playing songs to see them here.',
    },
    'custom': {
        icon: <AlertCircle className="h-12 w-12 text-muted-foreground/50" />,
        title: 'Empty',
        description: 'No items to display.',
    },
}

export function EmptyState({
    type,
    searchQuery,
    customIcon,
    customTitle,
    customDescription,
    action
}: EmptyStateProps) {
    const config = emptyStateConfig[type]

    // Override for search results
    const title = type === 'no-results' && searchQuery
        ? `No songs matching "${searchQuery}"`
        : customTitle || config.title

    const description = customDescription || config.description
    const icon = customIcon || config.icon

    return (
        <MotionDiv
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="flex flex-col items-center justify-center py-16 px-4 bg-card/30 rounded-2xl border border-primary/5"
        >
            <div className="mb-4 p-4 rounded-full bg-secondary/30">
                {icon}
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
                {title}
            </h3>
            <p className="text-muted-foreground text-center max-w-sm">
                {description}
            </p>
            {action && (
                <div className="mt-6">
                    {action}
                </div>
            )}
        </MotionDiv>
    )
}
