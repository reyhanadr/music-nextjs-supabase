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
                <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Song
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-purple-500/20 text-white">
                <DialogHeader>
                    <DialogTitle>Add New Song</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Add a song from YouTube to your library
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Song Title *</Label>
                        <Input
                            id="title"
                            placeholder="Enter song title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            required
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="artist">Artist</Label>
                        <Input
                            id="artist"
                            placeholder="Enter artist name (optional)"
                            value={formData.artist}
                            onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="youtube_url">YouTube URL *</Label>
                        <Input
                            id="youtube_url"
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
                                    id="duration_minutes"
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
                                    id="duration_seconds"
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
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                        disabled={loading}
                    >
                        {loading ? 'Adding...' : 'Add Song'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
