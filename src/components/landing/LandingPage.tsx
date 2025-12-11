'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MotionDiv, MotionCard, MotionButton, MotionSection } from '@/components/motion/wrappers'
import { fadeIn, slideUp, staggerContainer, hoverScale, scaleUp } from '@/components/motion/variants'
import { Music, Play, Users, MessageCircle, Headphones, ArrowRight, Github, ChevronDown } from 'lucide-react'
import { AppDemoShowcase } from '@/components/landing/AppDemoShowcase'

const features = [
    {
        icon: Play,
        title: 'YouTube Music Playback',
        description: 'Add, edit, and delete songs from YouTube. Build your perfect playlist with ease.',
    },
    {
        icon: Headphones,
        title: 'Real-time Party Sync',
        description: 'Play, pause, seek, and skip—all synced in real-time across all party members.',
    },
    {
        icon: Users,
        title: 'Multi-user Collaboration',
        description: 'Create rooms and invite friends. Everyone can contribute to the playlist.',
    },
    {
        icon: MessageCircle,
        title: 'Live Chat',
        description: 'Chat with your party members while enjoying music together.',
    },
]

const steps = [
    {
        number: '01',
        title: 'Login or Register',
        description: 'Create your account in seconds using email or Google.',
    },
    {
        number: '02',
        title: 'Create or Join a Room',
        description: 'Start your own party room or join an existing one with friends.',
    },
    {
        number: '03',
        title: 'Enjoy Synced Music',
        description: 'Play music together in perfect sync. Everyone hears the same beat.',
    },
]

export function LandingPage() {
    const scrollToFeatures = () => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div className="min-h-screen overflow-x-hidden">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] opacity-30" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/30 rounded-full blur-[120px] opacity-30" />
                <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-chart-2/20 rounded-full blur-[100px] opacity-20" />
            </div>

            {/* Navigation Bar */}
            <nav className="fixed top-0 left-0 right-0 bg-background/60 backdrop-blur-xl border-b border-primary/10 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2 group">
                            <div className="p-2 bg-gradient-to-r from-primary to-purple-600 rounded-lg group-hover:scale-110 transition-transform shadow-lg shadow-primary/25">
                                <Music className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                                Music Party
                            </span>
                        </div>

                        {/* Auth Buttons */}
                        <div className="flex items-center gap-3">
                            <Link href="/auth/login">
                                <Button variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                                    Login
                                </Button>
                            </Link>
                            <Link href="/auth/register">
                                <Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <MotionSection
                variants={fadeIn}
                initial="initial"
                animate="animate"
                className="relative min-h-screen flex items-center justify-center pt-16 px-4"
            >
                <div className="max-w-7xl mx-auto w-full">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Hero Text */}
                        <MotionDiv
                            initial={{ opacity: 0, x: -40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-center lg:text-left"
                        >
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                                <span className="bg-gradient-to-r from-foreground via-primary to-purple-500 bg-clip-text text-transparent">
                                    Listen Together,
                                </span>
                                <br />
                                <span className="bg-gradient-to-r from-purple-500 via-primary to-foreground bg-clip-text text-transparent">
                                    Party Together
                                </span>
                            </h1>
                            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                                Create party rooms, sync YouTube music in real-time, and enjoy the same beat
                                with friends—no matter where they are.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link href="/auth/login">
                                    <MotionButton
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-full sm:w-auto h-12 px-8 text-lg font-medium bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl shadow-primary/30"
                                    >
                                        Get Started
                                        <ArrowRight className="h-5 w-5 ml-2" />
                                    </MotionButton>
                                </Link>
                                <MotionButton
                                    variant="outline"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={scrollToFeatures}
                                    className="w-full sm:w-auto text-foreground h-12 px-8 text-lg font-medium border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                                >
                                    Learn More
                                    <ChevronDown className="h-5 w-5 ml-2" />
                                </MotionButton>
                            </div>
                        </MotionDiv>

                        {/* Hero Mockup */}
                        <MotionDiv
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="relative"
                        >
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-card via-card/80 to-secondary border border-primary/20 shadow-2xl shadow-primary/10">
                                {/* Mockup Header */}
                                <div className="absolute top-0 left-0 right-0 h-12 bg-background/50 backdrop-blur-sm border-b border-primary/10 flex items-center px-4 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-destructive/70" />
                                        <div className="w-3 h-3 rounded-full bg-chart-3/70" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/70" />
                                    </div>
                                    <div className="flex-1 flex justify-center">
                                        <div className="px-4 py-1 rounded-full bg-primary/10 text-xs text-muted-foreground">
                                            Party Room: Chill Vibes 🎵
                                        </div>
                                    </div>
                                </div>

                                {/* Mockup Content */}
                                <div className="absolute inset-0 pt-16 p-6 flex flex-col">
                                    {/* Now Playing */}
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20 mb-4">
                                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                                            <Music className="h-8 w-8 text-primary-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="h-3 w-32 bg-foreground/20 rounded mb-2" />
                                            <div className="h-2 w-24 bg-muted-foreground/20 rounded" />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                                <Play className="h-5 w-5 text-primary fill-primary" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Playlist Items */}
                                    <div className="flex-1 space-y-2">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30">
                                                <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-muted-foreground text-sm font-medium">
                                                    {i}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="h-2.5 bg-foreground/15 rounded w-28 mb-1" />
                                                    <div className="h-2 bg-muted-foreground/15 rounded w-20" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Users Bar */}
                                    <div className="flex items-center gap-2 pt-4 border-t border-border/30">
                                        <div className="flex -space-x-2">
                                            {[0, 1, 2].map((i) => (
                                                <div
                                                    key={i}
                                                    className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 border-2 border-card flex items-center justify-center text-xs text-primary-foreground font-medium"
                                                >
                                                    {['A', 'B', 'C'][i]}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-xs text-muted-foreground">3 users listening</span>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <MotionDiv
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.8 }}
                                className="absolute -bottom-4 -left-4 p-3 rounded-xl bg-card/90 backdrop-blur-lg border border-primary/20 shadow-xl"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Headphones className="h-4 w-4 text-green-500" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">Real-time Sync</span>
                                </div>
                            </MotionDiv>

                            <MotionDiv
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 1 }}
                                className="absolute -top-4 -right-4 p-3 rounded-xl bg-card/90 backdrop-blur-lg border border-primary/20 shadow-xl"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Users className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">Party Mode</span>
                                </div>
                            </MotionDiv>
                        </MotionDiv>
                    </div>
                </div>
            </MotionSection>

            {/* App Demo Showcase Section */}
            <AppDemoShowcase />

            {/* Features Section */}
            <MotionSection
                id="features"
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: "-100px" }}
                className="relative py-24 px-4"
            >
                <div className="max-w-7xl mx-auto">
                    <MotionDiv
                        variants={slideUp}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                            Everything You Need
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            A complete music party experience with all the features you need to enjoy music together.
                        </p>
                    </MotionDiv>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => {
                            const Icon = feature.icon
                            return (
                                <MotionCard
                                    key={feature.title}
                                    variants={scaleUp}
                                    whileHover={hoverScale}
                                    className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-colors"
                                >
                                    <CardHeader>
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center mb-4 border border-primary/20">
                                            <Icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <CardTitle className="text-lg text-foreground">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-muted-foreground">
                                            {feature.description}
                                        </CardDescription>
                                    </CardContent>
                                </MotionCard>
                            )
                        })}
                    </div>
                </div>
            </MotionSection>

            {/* How It Works Section */}
            <MotionSection
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: "-100px" }}
                className="relative py-24 px-4 bg-gradient-to-b from-transparent via-secondary/30 to-transparent"
            >
                <div className="max-w-5xl mx-auto">
                    <MotionDiv
                        variants={slideUp}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                            How It Works
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Get started in three simple steps and start partying with your friends.
                        </p>
                    </MotionDiv>

                    <div className="grid md:grid-cols-3 gap-8">
                        {steps.map((step) => (
                            <MotionDiv
                                key={step.number}
                                variants={slideUp}
                                className="text-center"
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground font-bold text-xl mb-6 shadow-lg shadow-primary/30">
                                    {step.number}
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                                <p className="text-muted-foreground">{step.description}</p>
                            </MotionDiv>
                        ))}
                    </div>
                </div>
            </MotionSection>

            {/* CTA Section */}
            <MotionSection
                variants={fadeIn}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: "-100px" }}
                className="relative py-24 px-4"
            >
                <div className="max-w-4xl mx-auto">
                    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 via-card to-purple-600/20 border border-primary/20 p-8 sm:p-12 lg:p-16">
                        {/* Background glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-600/10 pointer-events-none" />

                        <div className="relative text-center">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                                Ready to Party?
                            </h2>
                            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                                Join thousands of users enjoying music together. Create your first party room today.
                            </p>
                            <Link href="/auth/register">
                                <MotionButton
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="h-14 px-16 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl shadow-primary/30"
                                >
                                    Start For Free
                                    <ArrowRight className="h-5 w-5 ml-2" />
                                </MotionButton>
                            </Link>
                        </div>
                    </div>
                </div>
            </MotionSection>

            {/* Footer */}
            <footer className="relative py-12 px-4 border-t border-border/50">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Logo */}
                        <div className="flex flex-col items-center md:items-start gap-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-r from-primary to-purple-600 rounded-lg shadow-lg shadow-primary/25">
                                    <Music className="h-5 w-5 text-primary-foreground" />
                                </div>
                                <span className="text-lg font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                                    Music Party
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground text-center md:text-left">
                                Listen together, party together.
                            </p>
                        </div>

                        {/* Links */}
                        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground">
                            <a
                                href="https://github.com/reyhanadr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-primary transition-colors"
                            >
                                <Github className="h-4 w-4" />
                                GitHub
                            </a>
                            <a
                                href="https://instagram.com/reyhanadr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-primary transition-colors"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                                Instagram
                            </a>
                            <a
                                href="https://www.linkedin.com/in/reyhan-adriana-deris/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-primary transition-colors"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                                LinkedIn
                            </a>
                            <a
                                href="https://reyhanadr.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-primary transition-colors"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="2" y1="12" x2="22" y2="12" />
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                </svg>
                                Website
                            </a>
                        </div>

                        {/* Copyright */}
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Music Party. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
