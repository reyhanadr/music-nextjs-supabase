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
            <DialogContent className="bg-slate-900 border-purple-500/20 text-white">
                <DialogHeader>
                    <DialogTitle>Edit Song</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Update song information
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-title">Song Title *</Label>
                        <Input
                            id="edit-title"
                            placeholder="Enter song title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            required
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-artist">Artist</Label>
                        <Input
                            id="edit-artist"
                            placeholder="Enter artist name (optional)"
                            value={formData.artist}
                            onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-youtube_url">YouTube URL *</Label>
                        <Input
                            id="edit-youtube_url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={formData.youtube_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, youtube_url: e.target.value }))}
                            required
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Duration</Label>
                        <p className="text-xs text-slate-500">Enter song duration (optional)</p>
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
                                    className="bg-slate-800 border-slate-700"
                                />
                            </div>
                            <span className="text-slate-400 text-sm">min</span>
                            <div className="flex-1">
                                <Input
                                    id="edit-duration_seconds"
                                    type="number"
                                    min="0"
                                    max="59"
                                    placeholder="0"
                                    value={formData.duration_seconds}
                                    onChange={(e) => setFormData(prev => ({ ...prev, duration_seconds: e.target.value }))}
                                    className="bg-slate-800 border-slate-700"
                                />
                            </div>
                            <span className="text-slate-400 text-sm">sec</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-slate-700 hover:bg-slate-800"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
