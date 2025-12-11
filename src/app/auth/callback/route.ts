import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Check if profile is complete (has username)
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // First check if profile exists
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', user.id)
                    .single()

                // If profile doesn't exist, create it
                if (profileError && profileError.code === 'PGRST116') {
                    // Insert new profile for Google user
                    await supabase.from('profiles').insert({
                        id: user.id,
                        email: user.email,
                        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
                    })

                    // Redirect to complete profile
                    return NextResponse.redirect(`${origin}/auth/complete-profile`)
                }

                // If no username, redirect to complete profile
                if (!profile?.username) {
                    return NextResponse.redirect(`${origin}/auth/complete-profile`)
                }
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/login?error=Could not authenticate user`)
}
