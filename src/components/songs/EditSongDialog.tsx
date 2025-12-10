'use client'

import { useState, useEffect } from 'react'
import { Song } from '@/types'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { isValidYouTubeUrl, extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'
import { Loader2 } from 'lucide-react'

interface EditSongDialogProps {
    song: Song | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSongUpdated: () => void
}

export function EditSongDialog({ song, open, onOpenChange, onSongUpdated }: EditSongDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        artist: '',
        youtube_url: '',
        duration_minutes: '',
        duration_seconds: '',
    })
    const supabase = createClient()

    useEffect(() => {
        if (song) {
            // Convert total seconds to minutes and seconds
            const totalSeconds = song.duration || 0
            const minutes = Math.floor(totalSeconds / 60)
            const seconds = totalSeconds % 60

            setFormData({
                title: song.title,
                artist: song.artist || '',
                youtube_url: song.youtube_url,
                duration_minutes: minutes > 0 ? minutes.toString() : '',
                duration_seconds: seconds > 0 ? seconds.toString() : '',
            })
        }
    }, [song])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!song) return

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

        const { error } = await supabase
            .from('songs')
            .update({
                title: formData.title,
                artist: formData.artist || null,
                youtube_url: formData.youtube_url,
                cover_url: coverUrl,
                duration: totalDuration > 0 ? totalDuration : null,
            })
            .eq('id', song.id)

        if (error) {
            toast.error(error.message)
            setLoading(false)
        } else {
            toast.success('Song updated successfully!')
            onOpenChange(false)
            setLoading(false)
            onSongUpdated()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card/95 backdrop-blur-xl border-primary/20 text-foreground shadow-2xl shadow-primary/10 sm:rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">Edit Song</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Update song information
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="edit-title" className="text-foreground/80">Song Title <span className="text-primary">*</span></Label>
                        <Input
                            id="edit-title"
                            placeholder="Enter song title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            required
                            className="bg-secondary/50 border-secondary-foreground/10 focus:border-primary/50 focus:ring-primary/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-artist" className="text-foreground/80">Artist</Label>
                        <Input
                            id="edit-artist"
                            placeholder="Enter artist name (optional)"
                            value={formData.artist}
                            onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
                            className="bg-secondary/50 border-secondary-foreground/10 focus:border-primary/50 focus:ring-primary/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-youtube_url" className="text-foreground/80">YouTube URL <span className="text-primary">*</span></Label>
                        <Input
                            id="edit-youtube_url"
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
                                    id="edit-duration_minutes"
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
                                    id="edit-duration_seconds"
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
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Saving...</span>
                                </div>
                            ) : 'Save Changes'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 border-secondary hover:bg-secondary text-foreground"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
