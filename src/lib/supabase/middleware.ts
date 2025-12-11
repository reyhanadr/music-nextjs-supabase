import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Protected routes that require authentication
    const protectedPaths = ['/songs', '/party', '/dashboard']
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

    // Auth routes (login/register pages)
    const authPaths = ['/auth/login', '/auth/register', '/login', '/register']
    const isAuthPath = authPaths.some(path => pathname.startsWith(path))

    // Complete profile page (requires auth but not complete profile)
    const isCompleteProfilePath = pathname.startsWith('/auth/complete-profile')

    // Redirect unauthenticated users from protected routes to login
    if (!user && isProtectedPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
    }

    // Redirect unauthenticated users from complete-profile to login
    if (!user && isCompleteProfilePath) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
    }

    // Check profile completeness for authenticated users on protected routes
    if (user && isProtectedPath) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single()

        // If user has no username, redirect to complete profile
        if (!profile?.username) {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/complete-profile'
            return NextResponse.redirect(url)
        }
    }

    // Redirect authenticated users from auth pages to dashboard
    if (user && isAuthPath) {
        // First check if profile is complete
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single()

        const url = request.nextUrl.clone()
        if (!profile?.username) {
            url.pathname = '/auth/complete-profile'
        } else {
            url.pathname = '/dashboard'
        }
        return NextResponse.redirect(url)
    }

    // Redirect old auth routes to new ones
    if (pathname === '/login') {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
    }
    if (pathname === '/register') {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/register'
        return NextResponse.redirect(url)
    }

    // Redirect authenticated users from landing page to dashboard
    if (user && pathname === '/') {
        // Check if profile is complete first
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single()

        const url = request.nextUrl.clone()
        if (!profile?.username) {
            url.pathname = '/auth/complete-profile'
        } else {
            url.pathname = '/dashboard'
        }
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

