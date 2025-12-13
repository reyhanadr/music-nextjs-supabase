'use client'

import { MotionDiv } from '@/components/motion/wrappers'
import { fadeIn } from '@/components/motion/variants'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
    message?: string
    onRetry?: () => void
}

export function ErrorState({
    message = 'Something went wrong while loading songs.',
    onRetry
}: ErrorStateProps) {
    return (
        <MotionDiv
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="flex flex-col items-center justify-center py-16 px-4 bg-destructive/5 rounded-2xl border border-destructive/20"
        >
            <div className="mb-4 p-4 rounded-full bg-destructive/10">
                <AlertTriangle className="h-12 w-12 text-destructive/70" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
                Error loading songs
            </h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
                {message}
            </p>
            {onRetry && (
                <Button
                    variant="outline"
                    onClick={onRetry}
                    className="border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                </Button>
            )}
        </MotionDiv>
    )
}
