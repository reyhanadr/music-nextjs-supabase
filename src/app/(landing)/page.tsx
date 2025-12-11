import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function HomePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // If user is logged in, redirect to dashboard (handled by middleware too)
    if (user) {
        redirect('/dashboard')
    }

    return <LandingPage />
}
