'use client'

import { MotionDiv } from '@/components/motion/wrappers'
import { scaleUp } from '@/components/motion/variants'

export function RoomCardSkeleton() {
    return (
        <MotionDiv
            variants={scaleUp}
            className="bg-card/30 rounded-xl border border-primary/10 overflow-hidden"
        >
            {/* Top bar shimmer */}
            <div className="h-2 bg-gradient-to-r from-secondary/20 via-secondary/40 to-secondary/20 animate-pulse" />

            <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                        <div className="h-6 bg-secondary/50 rounded w-3/4 animate-pulse" />
                        {/* Host skeleton */}
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-secondary/40 animate-pulse" />
                            <div className="h-3 bg-secondary/30 rounded w-20 animate-pulse" />
                        </div>
                    </div>
                    <div className="h-6 w-16 bg-secondary/30 rounded-full animate-pulse" />
                </div>

                {/* Song info skeleton */}
                <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/10">
                    <div className="w-10 h-10 rounded bg-secondary/30 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-4 bg-secondary/40 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-secondary/20 rounded w-1/2 animate-pulse" />
                    </div>
                </div>

                {/* Stats row */}
                <div className="flex justify-between">
                    <div className="h-4 bg-secondary/30 rounded w-20 animate-pulse" />
                    <div className="h-4 bg-secondary/20 rounded w-16 animate-pulse" />
                </div>

                {/* Join button */}
                <div className="flex gap-2">
                    <div className="h-10 bg-primary/20 rounded flex-1 animate-pulse" />
                    <div className="h-10 w-10 bg-secondary/20 rounded animate-pulse" />
                </div>
            </div>
        </MotionDiv>
    )
}
