'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, MoreHorizontal, Search, Pause, Play } from 'lucide-react'

export function AppDemoShowcase() {
    const [isPlaying, setIsPlaying] = useState(true)
    const videoRef = useRef<HTMLVideoElement>(null)

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    return (
        <section className="relative py-20 px-4 overflow-hidden">
            {/* Background Gradient - Theme Compliant */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />
                <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] bg-primary/15 rounded-full blur-[100px]" />
                <div className="absolute bottom-[10%] right-[10%] w-[35%] h-[35%] bg-purple-600/15 rounded-full blur-[80px]" />
            </div>

            <div className="relative max-w-5xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                        See It In Action
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Experience the seamless music party experience with real-time sync and stunning visualizations.
                    </p>
                </motion.div>

                {/* App Mockup Container */}
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="relative"
                >
                    {/* Main Container - App Shell */}
                    <div className="relative rounded-2xl overflow-hidden bg-card shadow-2xl shadow-black/40 border border-primary/10">
                        {/* App Header - Dashboard Bar */}
                        <div className="flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border/50">
                            {/* Left Side - Menu & Dashboard */}
                            <div className="flex items-center gap-3">
                                <button className="p-1.5 hover:bg-primary/10 rounded-md transition-colors">
                                    <Menu className="h-5 w-5 text-muted-foreground" />
                                </button>
                                <span className="font-medium text-foreground">Dashboard</span>
                            </div>

                            {/* Right Side - Navigation Links */}
                            <div className="flex items-center gap-4">
                                <nav className="hidden sm:flex items-center gap-4">
                                    <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                                        Songs
                                    </span>
                                    <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                                        Party Room
                                    </span>
                                </nav>
                                <div className="flex items-center gap-1">
                                    <button className="p-1.5 hover:bg-primary/10 rounded-md transition-colors">
                                        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                                    </button>
                                    <button className="p-1.5 hover:bg-primary/10 rounded-md transition-colors">
                                        <Search className="h-5 w-5 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Video Area */}
                        <div className="relative aspect-video bg-black">
                            <video
                                ref={videoRef}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                            >
                                <source src="/landing_page_video.mp4" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>

                            {/* Overlay Controls */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                {/* Play/Pause Button */}
                                <motion.button
                                    onClick={handlePlayPause}
                                    className="relative group"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    animate={{
                                        y: [0, -8, 0],
                                    }}
                                    transition={{
                                        y: {
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }
                                    }}
                                >
                                    {/* Glow Effect - Theme Compliant */}
                                    <div className="absolute inset-0 rounded-full bg-primary/40 blur-xl scale-150 group-hover:bg-primary/50 transition-colors" />
                                    <div className="absolute inset-0 rounded-full bg-purple-600/30 blur-2xl scale-[2]" />

                                    {/* Button Body */}
                                    <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)]">
                                        <AnimatePresence mode="wait">
                                            {isPlaying ? (
                                                <motion.div
                                                    key="pause"
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.5 }}
                                                    transition={{ duration: 0.15 }}
                                                >
                                                    <Pause className="h-6 w-6 sm:h-8 sm:w-8 text-white fill-white" />
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="play"
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.5 }}
                                                    transition={{ duration: 0.15 }}
                                                >
                                                    <Play className="h-6 w-6 sm:h-8 sm:w-8 text-white fill-white ml-1" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.button>
                            </div>

                            {/* Bottom Gradient Overlay for polish */}
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        </div>
                    </div>

                    {/* Decorative Floating Elements */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="absolute -bottom-4 -left-4 sm:-left-8 p-3 sm:p-4 rounded-xl bg-card/95 backdrop-blur-lg border border-primary/20 shadow-xl"
                    >
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                                <span className="text-primary-foreground text-xs sm:text-sm font-bold">HD</span>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-foreground">High Quality</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Audio Visualizer</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        className="absolute -top-4 -right-4 sm:-right-8 p-3 sm:p-4 rounded-xl bg-card/95 backdrop-blur-lg border border-primary/20 shadow-xl"
                    >
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex -space-x-2">
                                {['from-primary to-purple-600', 'from-purple-600 to-primary', 'from-accent to-primary'].map((gradient, i) => (
                                    <div
                                        key={i}
                                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-card flex items-center justify-center text-[10px] sm:text-xs text-primary-foreground font-medium bg-gradient-to-br ${gradient}`}
                                    >
                                        {['A', 'B', 'C'][i]}
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">3 listening</span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}
