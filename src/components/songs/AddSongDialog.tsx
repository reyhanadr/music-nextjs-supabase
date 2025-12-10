'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { isValidYouTubeUrl, extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'
import { MotionButton } from '@/components/motion/wrappers'
import { Loader2 } from 'lucide-react'

interface AddSongDialogProps {
    onSongAdded: () => void
}

export function AddSongDialog({ onSongAdded }: AddSongDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        artist: '',
        youtube_url: '',
        duration_minutes: '',
        duration_seconds: '',
    })
    const { user } = useAuth()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isValidYouTubeUrl(formData.youtube_url)) {
            toast.error('Please enter a valid YouTube URL')
            return
        }

        // Calculate total duration in seconds
        const minutes = parseInt(formData.duration_minutes) || 0
        const seconds = parseInt(formData.duration_seconds) || 0
        const totalDuration = (minutes * 60) + seconds

        setLoading(true)

        const videoId = extractYouTubeId(formData.youtube_url)
        const coverUrl = videoId ? getYouTubeThumbnail(videoId) : null

        const { error } = await supabase.from('songs').insert({
            title: formData.title,
            artist: formData.artist || null,
            youtube_url: formData.youtube_url,
            cover_url: coverUrl,
            duration: totalDuration > 0 ? totalDuration : null,
            user_id: user?.id!,
        })

        if (error) {
            toast.error(error.message)
            setLoading(false)
        } else {
            toast.success('Song added successfully!')
            setFormData({ title: '', artist: '', youtube_url: '', duration_minutes: '', duration_seconds: '' })
            setOpen(false)
            setLoading(false)
            onSongAdded()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <MotionButton
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Song
                </MotionButton>
            </DialogTrigger>
            <DialogContent className="bg-card/95 backdrop-blur-xl border-primary/20 text-foreground shadow-2xl shadow-primary/10 sm:rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">Add New Song</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Add a song from YouTube to your library
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-foreground/80">Song Title <span className="text-primary">*</span></Label>
                        <Input
                            id="title"
                            placeholder="Enter song title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            required
                            className="bg-secondary/50 border-secondary-foreground/10 focus:border-primary/50 focus:ring-primary/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="artist" className="text-foreground/80">Artist</Label>
                        <Input
                            id="artist"
                            placeholder="Enter artist name (optional)"
                            value={formData.artist}
                            onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
                            className="bg-secondary/50 border-secondary-foreground/10 focus:border-primary/50 focus:ring-primary/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="youtube_url" className="text-foreground/80">YouTube URL <span className="text-primary">*</span></Label>
                        <Input
                            id="youtube_url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={formData.youtube_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, youtube_url: e.target.value }))}
                            required
                            className="bg-secondary/50 border-secondary-foreground/10 focus:border-primary/50 focus:ring-primary/20 font-mono text-xs"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-foreground/80">Duration</Label>
                        <p className="text-xs text-muted-foreground">Enter song duration (optional)</p>
                        <div className="flex gap-2 items-center">
                            <div className="flex-1">
                                <Input
                                    id="duration_minutes"
                                    type="number"
                                    min="0"
                                    max="999"
                                    placeholder="0"
                                    value={formData.duration_minutes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                                    className="bg-secondary/50 border-secondary-foreground/10 focus:border-primary/50 focus:ring-primary/20"
                                />
                            </div>
                            <span className="text-muted-foreground text-sm">min</span>
                            <div className="flex-1">
                                <Input
                                    id="duration_seconds"
                                    type="number"
                                    min="0"
                                    max="59"
                                    placeholder="0"
                                    value={formData.duration_seconds}
                                    onChange={(e) => setFormData(prev => ({ ...prev, duration_seconds: e.target.value }))}
                                    className="bg-secondary/50 border-secondary-foreground/10 focus:border-primary/50 focus:ring-primary/20"
                                />
                            </div>
                            <span className="text-muted-foreground text-sm">sec</span>
                        </div>
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 h-10 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-primary/20"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Adding...</span>
                            </div>
                        ) : 'Add Song'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
