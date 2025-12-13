import { getCurrentUserWithProfile } from '@/lib/auth/getCurrentUserWithProfile'
import { AuthProvider } from '@/contexts/AuthContext'
import { redirect } from 'next/navigation'

/**
 * Protected layout that fetches user and profile on the server.
 * This ensures auth data is immediately available to all child components
 * via AuthContext, eliminating client-side loading states.
 */
export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, profile } = await getCurrentUserWithProfile()

    // Middleware handles most redirects, but double-check here
    if (!user) {
        redirect('/auth/login')
    }

    // If profile is incomplete, redirect to complete-profile
    if (!profile?.username) {
        redirect('/auth/complete-profile')
    }

    return (
        <AuthProvider initialUser={user} initialProfile={profile}>
            {children}
        </AuthProvider>
    )
}
