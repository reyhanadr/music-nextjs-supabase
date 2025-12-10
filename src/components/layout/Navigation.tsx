'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Music, Home, LibraryBig, Users, LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MotionDiv, MotionButton } from '@/components/motion/wrappers'
import { AnimatePresence } from 'framer-motion'
import { slideIn, slideUp } from '@/components/motion/variants'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/songs', label: 'Songs', icon: LibraryBig },
    { href: '/party', label: 'Party Rooms', icon: Users },
]

export function Navigation() {
    const pathname = usePathname()
    const { user, profile, signOut } = useAuth()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)

    return (
        <nav className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-b border-primary/10 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="p-2 bg-gradient-to-r from-primary to-purple-600 rounded-lg group-hover:scale-110 transition-transform shadow-lg shadow-primary/25">
                            <Music className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                            Music Party
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname?.startsWith(item.href)
                            return (
                                <Link key={item.href} href={item.href}>
                                    <MotionButton
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        variant="ghost"
                                        className={cn(
                                            "gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors",
                                            isActive && "text-primary bg-primary/10 font-medium"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{item.label}</span>
                                    </MotionButton>
                                </Link>
                            )
                        })}
                    </div>

                    {/* Desktop User Menu */}
                    <div className="hidden md:flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-9 w-9 border-2 border-primary/20 ring-2 ring-primary/5">
                                <AvatarImage src={profile?.avatar_url || ''} className="object-cover" />
                                <AvatarFallback className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground font-bold">
                                    {(profile?.username?.[0] || user?.email?.[0] || '?').toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-muted-foreground max-w-[100px] truncate">
                                {profile?.username || user?.email?.split('@')[0]}
                            </span>
                        </div>
                        <div className="h-6 w-px bg-border/50 mx-1" />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={signOut}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleMobileMenu}
                            className="text-foreground hover:bg-accent"
                        >
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <MotionDiv
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden border-t border-primary/10 bg-background/95 backdrop-blur-xl overflow-hidden"
                    >
                        <div className="px-4 pt-2 pb-6 space-y-4">
                            <div className="space-y-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon
                                    const isActive = pathname?.startsWith(item.href)
                                    return (
                                        <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    "w-full justify-start gap-3 h-12 text-muted-foreground hover:text-primary hover:bg-primary/10",
                                                    isActive && "text-primary bg-primary/10 font-medium"
                                                )}
                                            >
                                                <Icon className="h-5 w-5" />
                                                <span className="text-base">{item.label}</span>
                                            </Button>
                                        </Link>
                                    )
                                })}
                            </div>

                            <div className="pt-4 border-t border-border/50">
                                <div className="flex items-center gap-3 px-2 mb-4">
                                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                                        <AvatarImage src={profile?.avatar_url || ''} className="object-cover" />
                                        <AvatarFallback className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground">
                                            {(profile?.username?.[0] || user?.email?.[0] || '?').toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || profile?.username || user?.email}</p>
                                        <p className="text-xs text-muted-foreground">{profile?.username ? `@${profile.username}` : 'Logged in'}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={signOut}
                                    className="w-full justify-center gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign Out
                                </Button>
                            </div>
                        </div>
                    </MotionDiv>
                )}
            </AnimatePresence>
        </nav>
    )
}
