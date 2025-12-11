import { ReactNode } from 'react'

export default function LandingLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-sidebar to-background">
            {children}
        </div>
    )
}
