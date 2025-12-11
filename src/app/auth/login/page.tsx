'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { toast } from 'sonner'
import { MotionDiv, MotionCard, MotionButton } from '@/components/motion/wrappers'
import { fadeIn } from '@/components/motion/variants'
import { Loader2, Music, ArrowLeft } from 'lucide-react'
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '@/lib/auth/schemas'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'

function LoginForm() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    // Show error from URL params (OAuth errors)
    useEffect(() => {
        const errorParam = searchParams.get('error')
        if (errorParam) {
            toast.error(errorParam)
        }
    }, [searchParams])

    const handleLogin = async (data: LoginFormData) => {
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        })

        if (error) {
            toast.error(error.message)
            setLoading(false)
        } else {
            toast.success('Logged in successfully!')
            router.push('/dashboard')
        }
    }

    return (
        <MotionDiv
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-sidebar to-background p-4 relative overflow-hidden"
        >
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] opacity-30 animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/30 rounded-full blur-[100px] opacity-30 animate-pulse delay-1000" />
            </div>


            <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="p-3 bg-gradient-to-r from-primary to-purple-600 rounded-xl shadow-lg shadow-primary/25">
                    <Music className="h-7 w-7 text-primary-foreground" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                    Music Party
                </span>
            </div>

            <MotionCard
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/10 relative z-10"
            >
                <CardHeader className="space-y-2 text-center">
                    <CardTitle className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent pb-1">
                        Welcome Back
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-lg">
                        Login to continue to your music
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Google OAuth Button */}
                    <GoogleAuthButton />

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-secondary-foreground/20" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-muted px-2 py-1 text-muted-foreground rounded-full">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    {/* Email/Password Form */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground/80">Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="you@example.com"
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
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground/80">Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className="bg-secondary/50 border-secondary-foreground/10 focus:border-primary/50 focus:ring-primary/20 h-12"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <MotionButton
                                type="submit"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full h-12 text-lg font-medium bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25 transition-all"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Logging in...</span>
                                    </div>
                                ) : 'Login'}
                            </MotionButton>
                        </form>
                    </Form>

                    <div className="text-center text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link href="/auth/register" className="text-primary hover:text-primary/80 font-semibold underline-offset-4 hover:underline transition-colors">
                            Register
                        </Link>
                    </div>



                    {/* Back to Landing Page */}
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Home</span>
                    </Link>
                </CardContent>
            </MotionCard>
        </MotionDiv>
    )
}

function LoginLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-sidebar to-background">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading...</span>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginLoading />}>
            <LoginForm />
        </Suspense>
    )
}
