'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export interface Profile {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
    updated_at: string | null
}

interface AuthContextValue {
    user: User | null
    profile: Profile | null
    loading: boolean
    signOut: () => Promise<void>
    updateProfile: (updates: Partial<Profile>) => void
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
    children: ReactNode
    initialUser: User | null
    initialProfile: Profile | null
}

/**
 * AuthProvider that receives SSR data and provides auth state to all children.
 * This eliminates client-side loading states since data is available immediately.
 */
export function AuthProvider({ children, initialUser, initialProfile }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(initialUser)
    const [profile, setProfile] = useState<Profile | null>(initialProfile)
    const [loading] = useState(false) // No loading state - data available from SSR
    const router = useRouter()
    const supabase = createClient()

    // Refresh profile from database
    const refreshProfile = useCallback(async () => {
        if (!user) return

        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, updated_at')
            .eq('id', user.id)
            .single()

        if (data && !error) {
            setProfile(data as Profile)
        }
    }, [user, supabase])

    // Subscribe to auth state changes (for sign out, session refresh, etc.)
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_OUT') {
                    setUser(null)
                    setProfile(null)
                } else if (event === 'SIGNED_IN' && session?.user) {
                    setUser(session.user)
                    // Fetch profile for newly signed in user
                    const { data } = await supabase
                        .from('profiles')
                        .select('id, full_name, username, avatar_url, updated_at')
                        .eq('id', session.user.id)
                        .single()
                    if (data) {
                        setProfile(data as Profile)
                    }
                } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                    setUser(session.user)
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [supabase])

    // Sign out handler
    const signOut = useCallback(async () => {
        // Clear music player localStorage data
        if (typeof window !== 'undefined') {
            localStorage.removeItem('music-player-queue')
            localStorage.removeItem('music-player-state')
        }

        await supabase.auth.signOut()
        setProfile(null)
        router.push('/auth/login')
    }, [supabase, router])

    // Optimistic profile update
    const updateProfile = useCallback((updates: Partial<Profile>) => {
        setProfile(prev => prev ? { ...prev, ...updates } : null)
    }, [])

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                signOut,
                updateProfile,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

/**
 * Hook to access auth context. Must be used within AuthProvider.
 * Use this instead of useAuth for components under protected routes.
 */
export function useAuthContext() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider')
    }
    return context
}

/**
 * Safe version of useAuthContext that doesn't throw if outside provider.
 * Useful for components that might be rendered both inside and outside protected areas.
 */
export function useAuthContextSafe(): AuthContextValue | null {
    return useContext(AuthContext) ?? null
}
