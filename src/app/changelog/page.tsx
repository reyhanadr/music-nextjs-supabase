'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/layout/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MotionDiv } from '@/components/motion/wrappers'
import { changelog } from '@/data/changelog'
import { Music, ArrowLeft } from 'lucide-react'

function getBadgeVariant(type: string) {
    switch (type) {
        case 'feature':
            return 'default'
        case 'improvement':
            return 'secondary'
        case 'fix':
            return 'outline'
        default:
            return 'default'
    }
}

function getBadgeText(type: string) {
    switch (type) {
        case 'feature':
            return 'New'
        case 'improvement':
            return 'Improved'
        case 'fix':
            return 'Fixed'
        default:
            return type
    }
}

// Guest Navigation (similar to landing page)
function GuestNavigation() {
    return (
        <nav className="fixed top-0 left-0 right-0 bg-background/60 backdrop-blur-xl border-b border-primary/10 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="p-2 bg-gradient-to-r from-primary to-purple-600 rounded-lg group-hover:scale-110 transition-transform shadow-lg shadow-primary/25">
                            <Music className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                            Music Party
                        </span>
                    </Link>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <Button variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <Link href="/auth/login">
                            <Button variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                                Login
                            </Button>
                        </Link>
                        <Link href="/auth/register">
                            <Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default function ChangelogPage() {
    const { user, loading } = useAuth()

    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-sidebar to-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-sidebar to-background pb-24">
            {/* Show different navigation based on auth status */}
            {user ? <Navigation /> : <GuestNavigation />}

            {/* Background decorative elements */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] opacity-20" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/30 rounded-full blur-[100px] opacity-20" />
            </div>

            <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
                {/* Header */}
                <MotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-400 to-secondary-foreground bg-clip-text text-transparent">
                        Changelog
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        See what&apos;s new in Music Party
                    </p>
                </MotionDiv>

                {/* Changelog Entries */}
                <div className="space-y-8">
                    {changelog.map((release, idx) => (
                        <MotionDiv
                            key={release.version}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                        >
                            <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
                                <CardHeader>
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <CardTitle className="text-2xl text-foreground flex items-center gap-3">
                                            <span className="text-primary">v{release.version}</span>
                                            <span className="text-muted-foreground">—</span>
                                            <span>{release.title}</span>
                                        </CardTitle>
                                        <Badge variant="outline" className="text-muted-foreground">
                                            {release.date}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {release.changes.map((change, changeIdx) => {
                                            const Icon = change.icon
                                            return (
                                                <MotionDiv
                                                    key={changeIdx}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.2 + changeIdx * 0.05 }}
                                                    className="flex items-start gap-4 p-4 rounded-lg bg-background/50 border border-border/50"
                                                >
                                                    <div className={`p-2 rounded-lg ${change.type === 'feature'
                                                        ? 'bg-primary/10 text-primary'
                                                        : change.type === 'improvement'
                                                            ? 'bg-secondary/20 text-secondary-foreground'
                                                            : 'bg-muted text-muted-foreground'
                                                        }`}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-semibold text-foreground">
                                                                {change.title}
                                                            </h3>
                                                            <Badge
                                                                variant={getBadgeVariant(change.type)}
                                                                className="text-xs"
                                                            >
                                                                {getBadgeText(change.type)}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {change.description}
                                                        </p>
                                                    </div>
                                                </MotionDiv>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </MotionDiv>
                    ))}
                </div>
            </main>
        </div>
    )
}
