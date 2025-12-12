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

/**
 * Update user profile (full name, username, avatar)
 */
export async function updateProfile(formData: {
    fullName: string
    username: string
    avatarUrl?: string
}): Promise<AuthResult> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Not authenticated' }
    }

    // Check if username is already taken by another user
    const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', formData.username)
        .neq('id', user.id)
        .single()

    if (existingUser) {
        return { success: false, error: 'Username already taken' }
    }

    // Update profile
    const updateData: { full_name: string; username: string; avatar_url?: string; updated_at: string } = {
        full_name: formData.fullName,
        username: formData.username,
        updated_at: new Date().toISOString(),
    }

    if (formData.avatarUrl) {
        updateData.avatar_url = formData.avatarUrl
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

    if (profileError) {
        return { success: false, error: profileError.message }
    }

    return { success: true }
}

/**
 * Update user avatar URL
 */
export async function updateAvatar(avatarUrl: string): Promise<AuthResult> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id)

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Update user email
 * Sends confirmation email to the new address
 */
export async function updateEmail(newEmail: string): Promise<AuthResult> {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
        email: newEmail,
    })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Get user identities (connected OAuth providers)
 */
export async function getUserIdentities(): Promise<{ identities: { provider: string; email?: string; id: string; identity_id: string }[]; error?: string }> {
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return { identities: [], error: 'Not authenticated' }
    }

    const identities = user.identities?.map(identity => ({
        provider: identity.provider,
        email: identity.identity_data?.email as string | undefined,
        id: identity.id, // This is the provider's user id
        identity_id: identity.identity_id, // This is the UUID needed for unlinkIdentity
    })) || []

    return { identities }
}

/**
 * Connect Google account
 */
export async function connectGoogle() {
    const supabase = await createClient()
    const headersList = await headers()
    const origin = headersList.get('origin') || 'http://localhost:3000'

    const { data, error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
            redirectTo: `${origin}/settings?connected=google`,
        },
    })

    if (error) {
        return { success: false, error: error.message }
    }

    if (data.url) {
        redirect(data.url)
    }

    return { success: false, error: 'Failed to initiate Google connection' }
}

/**
 * Disconnect Google account
 * Prevents disconnection if it's the only auth method
 */
export async function disconnectGoogle(identityId: string): Promise<AuthResult> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Not authenticated' }
    }

    // Check if user has identities
    const identities = user.identities || []

    // Debug: log identities for troubleshooting
    console.log('User identities:', JSON.stringify(identities, null, 2))
    console.log('Looking for identity_id:', identityId)

    if (identities.length === 0) {
        return { success: false, error: 'No identities found for user' }
    }

    // Check if user has email provider (password-based auth)
    const hasEmailProvider = identities.some(i => i.provider === 'email')

    // Find the Google identity by identity_id
    const googleIdentity = identities.find(i => i.provider === 'google' && i.identity_id === identityId)

    if (!googleIdentity) {
        // Try to find any Google identity as fallback (in case identity_id format differs)
        const anyGoogleIdentity = identities.find(i => i.provider === 'google')
        console.log('Google identity not found by ID. Available Google identity:', anyGoogleIdentity)

        if (!anyGoogleIdentity) {
            return { success: false, error: 'No Google account connected' }
        }

        // Use the found Google identity
        const googleIdentities = identities.filter(i => i.provider === 'google')

        if (googleIdentities.length === 1 && !hasEmailProvider && identities.length === 1) {
            return { success: false, error: 'Cannot disconnect Google. It is your only login method. Please set a password first.' }
        }

        // Pass the full identity object to unlinkIdentity
        const { error } = await supabase.auth.unlinkIdentity(anyGoogleIdentity)

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true }
    }

    const googleIdentities = identities.filter(i => i.provider === 'google')

    if (googleIdentities.length === 1 && !hasEmailProvider && identities.length === 1) {
        return { success: false, error: 'Cannot disconnect Google. It is your only login method. Please set a password first.' }
    }

    // Pass the full identity object to unlinkIdentity
    const { error } = await supabase.auth.unlinkIdentity(googleIdentity)

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

