'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export type AuthResult = {
    success: boolean
    error?: string
}

/**
 * Sign up with email and password
 * Creates user in Supabase Auth - username will be set in complete-profile
 */
export async function signUpWithEmail(formData: {
    email: string
    password: string
    fullName: string
}): Promise<AuthResult> {
    const supabase = await createClient()

    // Sign up user
    const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
            data: {
                full_name: formData.fullName,
            },
        },
    })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Sign in with Google OAuth
 * Redirects to Google OAuth flow
 */
export async function signInWithGoogle() {
    const supabase = await createClient()
    const headersList = await headers()
    const origin = headersList.get('origin') || 'http://localhost:3000'

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/auth/callback`,
        },
    })

    if (error) {
        return { success: false, error: error.message }
    }

    if (data.url) {
        redirect(data.url)
    }

    return { success: false, error: 'Failed to initiate Google OAuth' }
}

/**
 * Complete profile for users
 * Sets username and optionally password (for Google users who need fallback login)
 */
export async function completeProfile(formData: {
    fullName: string
    username: string
    password?: string
}): Promise<AuthResult> {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Not authenticated' }
    }

    // Check if username is already taken
    const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', formData.username)
        .neq('id', user.id)
        .single()

    if (existingUser) {
        return { success: false, error: 'Username already taken' }
    }

    // Update password only if provided (for Google users)
    if (formData.password && formData.password.length >= 6) {
        const { error: passwordError } = await supabase.auth.updateUser({
            password: formData.password,
        })

        if (passwordError) {
            return { success: false, error: passwordError.message }
        }
    }

    // Update profile with username and full_name
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            username: formData.username,
            full_name: formData.fullName,
        })
        .eq('id', user.id)

    if (profileError) {
        return { success: false, error: profileError.message }
    }

    return { success: true }
}

/**
 * Check if user profile is complete
 * Returns true if user has username set
 */
export async function checkProfileComplete(): Promise<{ complete: boolean; profile: { full_name: string | null; username: string | null } | null }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { complete: false, profile: null }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', user.id)
        .single()

    return {
        complete: !!profile?.username,
        profile: profile || null,
    }
}

/**
 * Sign out user
 */
export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/auth/login')
}
