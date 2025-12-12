'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Music, Home, LibraryBig, Users, LogOut, Menu, X, Settings, ChevronDown, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MotionDiv, MotionButton } from '@/components/motion/wrappers'
import { AnimatePresence, motion } from 'framer-motion'
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
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)

    const handleMouseEnter = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current)
            closeTimeoutRef.current = null
        }
        setIsUserMenuOpen(true)
    }

    const handleMouseLeave = () => {
        closeTimeoutRef.current = setTimeout(() => {
            setIsUserMenuOpen(false)
        }, 150) // Small delay to prevent flickering
    }

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

                    {/* Desktop User Menu with Dropdown */}
                    <div
                        className="hidden md:block relative"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <button className="flex items-center gap-2 group px-2 py-1.5 rounded-lg transition-all hover:bg-accent/100">
                            <Avatar className="h-8 w-8 border-2 border-primary/20 ring-2 ring-primary/5 transition-all group-hover:ring-primary/20">
                                <AvatarImage src={profile?.avatar_url || ''} className="object-cover" />
                                <AvatarFallback className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground font-bold text-sm">
                                    {(profile?.username?.[0] || user?.email?.[0] || '?').toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-muted-foreground max-w-[100px] truncate group-hover:text-foreground transition-colors">
                                {profile?.username || user?.email?.split('@')[0]}
                            </span>
                            <motion.div
                                animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </motion.div>
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {isUserMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                    className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-xl shadow-black/10 overflow-hidden"
                                >
                                    {/* User Info Header */}
                                    <div className="px-4 py-3 border-b border-border/50 bg-accent/10">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {profile?.full_name || profile?.username || user?.email}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {profile?.username ? `@${profile.username}` : user?.email}
                                        </p>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="p-2">
                                        <Link href="/settings" onClick={() => setIsUserMenuOpen(false)}>
                                            <motion.div
                                                whileHover={{ x: 4 }}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/90 transition-colors cursor-pointer"
                                            >
                                                <Settings className="h-4 w-4" />
                                                <span className="text-sm font-medium">Settings</span>
                                            </motion.div>
                                        </Link>
                                        <Link href="/changelog" onClick={() => setIsUserMenuOpen(false)}>
                                            <motion.div
                                                whileHover={{ x: 4 }}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/90 transition-colors cursor-pointer mt-1"
                                            >
                                                <FileText className="h-4 w-4" />
                                                <span className="text-sm font-medium">Changelog</span>
                                            </motion.div>
                                        </Link>
                                        <motion.div
                                            whileHover={{ x: 4 }}
                                            onClick={signOut}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors cursor-pointer mt-1"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span className="text-sm font-medium">Sign Out</span>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
                                <div className="space-y-4">
                                    <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-center gap-2 border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
                                        >
                                            <Settings className="h-4 w-4" />
                                            Settings
                                        </Button>
                                    </Link>
                                    <Link href="/changelog" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-center gap-2 border-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground mt-2"
                                        >
                                            <FileText className="h-4 w-4" />
                                            Changelog
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        onClick={signOut}
                                        className="w-full justify-center gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive mt-2"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign Out
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </MotionDiv>
                )}
            </AnimatePresence>
        </nav>
    )
}
