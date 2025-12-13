'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/layout/Navigation'
import { ProfileInfoForm } from '@/components/settings/ProfileInfoForm'
import { AccountInfoForm } from '@/components/settings/AccountInfoForm'
import { ConnectedAccounts } from '@/components/settings/ConnectedAccounts'
import { DangerZone } from '@/components/settings/DangerZone'
import { useAuth } from '@/hooks/useAuth'
import { MotionDiv } from '@/components/motion/wrappers'
import { staggerContainer, slideUp } from '@/components/motion/variants'
import { Loader2, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { Suspense } from 'react'

function SettingsContent() {
    const { user, profile, loading, supabase } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        // Check for successful Google connection
        const connected = searchParams.get('connected')
        if (connected === 'google') {
            toast.success('Google account connected successfully!')
            // Clean up URL
            router.replace('/settings')
        }
    }, [searchParams, router])

    const handleUpdate = () => {
        // Trigger a refresh of the auth state
        setRefreshKey(prev => prev + 1)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-sidebar to-background">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading settings...</span>
                </div>
            </div>
        )
    }

    if (!user) {
        router.push('/auth/login')
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-sidebar to-background">
            <Navigation />

            {/* Background decorative elements */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] opacity-20" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/30 rounded-full blur-[100px] opacity-20" />
            </div>

            <main className="relative z-10 pt-20 pb-24 md:pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <MotionDiv
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-r from-primary to-purple-600 rounded-lg shadow-lg shadow-primary/25">
                                <Settings className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                                Settings
                            </h1>
                        </div>
                        <p className="text-muted-foreground">
                            Manage your profile and account settings
                        </p>
                    </MotionDiv>

                    {/* Settings Sections */}
                    <MotionDiv
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="grid gap-6 md:grid-cols-1 lg:grid-cols-1"
                    >
                        {/* Profile Information Section */}
                        <MotionDiv variants={slideUp}>
                            <ProfileInfoForm
                                key={`profile-${refreshKey}`}
                                initialData={{
                                    fullName: profile?.full_name || '',
                                    username: profile?.username || '',
                                    avatarUrl: profile?.avatar_url,
                                }}
                                onUpdate={handleUpdate}
                            />
                        </MotionDiv>

                        {/* Account Security Section */}
                        <MotionDiv variants={slideUp}>
                            <AccountInfoForm
                                currentEmail={user.email || ''}
                                onUpdate={handleUpdate}
                            />
                        </MotionDiv>

                        {/* Connected Accounts Section */}
                        <MotionDiv variants={slideUp}>
                            <ConnectedAccounts
                                key={`connected-${refreshKey}`}
                                onUpdate={handleUpdate}
                            />
                        </MotionDiv>

                        {/* Danger Zone Section */}
                        <MotionDiv variants={slideUp}>
                            <DangerZone userEmail={user.email || ''} />
                        </MotionDiv>
                    </MotionDiv>
                </div>
            </main>
        </div>
    )
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-sidebar to-background">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading settings...</span>
                </div>
            </div>
        }>
            <SettingsContent />
        </Suspense>
    )
}
