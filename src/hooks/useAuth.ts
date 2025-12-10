'use client'

import { useEffect, useState } from 'react'
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

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            // Loading state will be handled after profile fetch if user exists
            if (!user) setLoading(false)
        }

        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (!session?.user) {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [supabase.auth])

    useEffect(() => {
        const getProfile = async () => {
            if (!user) return

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (data) {
                    setProfile(data as Profile)
                } else if (error) {
                    console.error('Error fetching profile:', error)
                }
            } catch (error) {
                console.error('Error in getProfile:', error)
            } finally {
                setLoading(false)
            }
        }

        getProfile()
    }, [user, supabase])

    const signOut = async () => {
        await supabase.auth.signOut()
        setProfile(null)
        router.push('/login')
    }

    return {
        user,
        profile,
        loading,
        signOut,
        supabase
    }
}
