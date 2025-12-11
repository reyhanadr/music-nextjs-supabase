'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { MotionDiv, MotionCard, MotionButton } from '@/components/motion/wrappers'
import { fadeIn } from '@/components/motion/variants'
import { Loader2, UserCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { completeProfileSchema, type CompleteProfileFormData } from '@/lib/auth/schemas'
import { completeProfile } from '@/lib/auth/actions'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'

export default function CompleteProfilePage() {
    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isGoogleUser, setIsGoogleUser] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const form = useForm<CompleteProfileFormData>({
        resolver: zodResolver(completeProfileSchema),
        defaultValues: {
            fullName: '',
            username: '',
            password: '',
        },
    })

    useEffect(() => {
        async function fetchProfile() {
            try {
                // Get current user from client
                const { data: { user }, error: userError } = await supabase.auth.getUser()

                if (userError || !user) {
                    console.error('No user found:', userError)
                    router.push('/auth/login')
                    return
                }

                // Check if user signed up with Google (OAuth provider)
                const isGoogle = user.app_metadata?.provider === 'google' ||
                    !!(user.identities?.some(identity => identity.provider === 'google'))
                setIsGoogleUser(isGoogle)

                // Fetch profile data
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name, username, email')
                    .eq('id', user.id)
                    .single()

                if (profileError) {
                    console.error('Profile fetch error:', profileError)
                    // Profile might not exist yet, continue with empty form
                }

                // If profile has username, redirect to dashboard
                if (profile?.username) {
                    router.push('/dashboard')
                    return
                }

                // Pre-fill form with available data
                if (profile?.full_name) {
                    form.setValue('fullName', profile.full_name)
                } else if (user.user_metadata?.full_name) {
                    form.setValue('fullName', user.user_metadata.full_name)
                } else if (user.user_metadata?.name) {
                    form.setValue('fullName', user.user_metadata.name)
                }

                setChecking(false)
            } catch (err) {
                console.error('Error in fetchProfile:', err)
                setError('Failed to load profile data')
                setChecking(false)
            }
        }

        fetchProfile()
    }, [router, form, supabase])


    const handleComplete = async (data: CompleteProfileFormData) => {
        setLoading(true)

        const result = await completeProfile({
            fullName: data.fullName,
            username: data.username,
            password: data.password || undefined,
        })

        if (!result.success) {
            toast.error(result.error || 'Failed to complete profile')
            setLoading(false)
        } else {
            toast.success('Profile completed! Welcome aboard!')
            router.push('/dashboard')
        }
    }

    if (checking) {
        return (
            <MotionDiv
                variants={fadeIn}
                initial="initial"
                animate="animate"
                className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background"
            >
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading profile...</span>
                </div>
            </MotionDiv>
        )
    }

    if (error) {
        return (
            <MotionDiv
                variants={fadeIn}
                initial="initial"
                animate="animate"
                className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background"
            >
                <div className="text-center text-destructive">
                    <p>{error}</p>
                    <button
                        onClick={() => router.push('/auth/login')}
                        className="mt-4 text-primary underline"
                    >
                        Back to Login
                    </button>
                </div>
            </MotionDiv>
        )
    }

    return (
        <MotionDiv
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background p-4 relative overflow-hidden"
        >
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] opacity-30 animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/30 rounded-full blur-[100px] opacity-30 animate-pulse delay-1000" />
            </div>

            <MotionCard
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/10 relative z-10"
            >
                <CardHeader className="space-y-2 text-center">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                            <UserCircle className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent pb-1">
                        Complete Your Profile
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Just a few more details to get started
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleComplete)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground/80">Full Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder="John Doe"
                                                className="bg-secondary/50 border-secondary-foreground/10 focus:border-primary/50 focus:ring-primary/20 h-12"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground/80">Username</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder="johndoe123"
                                                className="bg-secondary/50 border-secondary-foreground/10 focus:border-primary/50 focus:ring-primary/20 h-12"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                        <p className="text-xs text-muted-foreground">Choose a unique username (letters, numbers, underscores)</p>
                                    </FormItem>
                                )}
                            />
                            {isGoogleUser && (
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground/80">Create Password (Optional)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="bg-secondary/50 border-secondary-foreground/10 focus:border-primary/50 focus:ring-primary/20 h-12"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            <p className="text-xs text-muted-foreground">Set a password for email/password login fallback</p>
                                        </FormItem>
                                    )}
                                />
                            )}
                            <MotionButton
                                type="submit"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full h-12 text-lg font-medium bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25 transition-all mt-6"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Completing...</span>
                                    </div>
                                ) : 'Complete Profile'}
                            </MotionButton>
                        </form>
                    </Form>
                </CardContent>
            </MotionCard>
        </MotionDiv>
    )
}
