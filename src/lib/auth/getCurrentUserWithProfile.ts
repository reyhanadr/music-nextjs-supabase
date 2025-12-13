'use server'

import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'

export interface Profile {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
    updated_at: string | null
}

export interface AuthData {
    user: User | null
    profile: Profile | null
}

/**
 * Server-side utility to fetch current user and their profile in one go.
 * Use this in server components to get auth data for SSR.
 * 
 * @returns {Promise<AuthData>} User and profile data
 */
export async function getCurrentUserWithProfile(): Promise<AuthData> {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        return { user: null, profile: null }
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, updated_at')
        .eq('id', user.id)
        .single()

    if (profileError) {
        console.error('Error fetching profile:', profileError)
        return { user, profile: null }
    }

    return { user, profile: profile as Profile }
}
