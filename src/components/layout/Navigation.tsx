'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Music, Home, LibraryBig, Users, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/songs', label: 'Songs', icon: LibraryBig },
    { href: '/party', label: 'Party Rooms', icon: Users },
]

export function Navigation() {
    const pathname = usePathname()
    const { user, signOut } = useAuth()

    return (
        <nav className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-b border-purple-500/20 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                            <Music className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            Music Party
                        </span>
                    </Link>

                    {/* Nav Links */}
                    <div className="flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname?.startsWith(item.href)
                            return (
                                <Link key={item.href} href={item.href}>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "gap-2 text-slate-400 hover:text-white hover:bg-purple-500/10",
                                            isActive && "text-white bg-purple-500/20"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="hidden sm:inline">{item.label}</span>
                                    </Button>
                                </Link>
                            )
                        })}
                    </div>

                    {/* User menu */}
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border-2 border-purple-500/30">
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                                {user?.email?.[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={signOut}
                            className="text-slate-400 hover:text-white hover:bg-red-500/10"
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    )
}
