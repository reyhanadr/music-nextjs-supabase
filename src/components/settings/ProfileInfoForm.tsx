'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MotionButton } from '@/components/motion/wrappers'
import { AvatarUploader } from './AvatarUploader'
import { profileInfoSchema, type ProfileInfoFormData } from '@/lib/auth/schemas'
import { updateProfile } from '@/lib/auth/actions'
import { useAuth } from '@/hooks/useAuth'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Loader2, User } from 'lucide-react'
import { toast } from 'sonner'

interface ProfileInfoFormProps {
    initialData: {
        fullName: string
        username: string
        avatarUrl?: string | null
    }
    onUpdate?: () => void
}

export function ProfileInfoForm({ initialData, onUpdate }: ProfileInfoFormProps) {
    const [loading, setLoading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl)
    const { updateProfile: updateProfileOptimistic } = useAuth()

    const form = useForm<ProfileInfoFormData>({
        resolver: zodResolver(profileInfoSchema),
        defaultValues: {
            fullName: initialData.fullName || '',
            username: initialData.username || '',
        },
    })

    const handleSubmit = async (data: ProfileInfoFormData) => {
        setLoading(true)

        // Store previous values for rollback
        const previousValues = {
            full_name: initialData.fullName,
            username: initialData.username,
            avatar_url: initialData.avatarUrl,
        }

        // Optimistic update - update UI immediately
        updateProfileOptimistic({
            full_name: data.fullName,
            username: data.username,
            avatar_url: avatarUrl,
        })

        // Show optimistic success toast
        const toastId = toast.loading('Saving changes...')

        const result = await updateProfile({
            fullName: data.fullName,
            username: data.username,
            avatarUrl: avatarUrl || undefined,
        })

        if (!result.success) {
            // Rollback on error
            updateProfileOptimistic({
                full_name: previousValues.full_name,
                username: previousValues.username,
                avatar_url: previousValues.avatar_url,
            })
            toast.error(result.error || 'Failed to update profile', { id: toastId })
        } else {
            toast.success('Profile updated successfully!', { id: toastId })
            onUpdate?.()
        }

        setLoading(false)
    }

    const handleAvatarChange = (url: string) => {
        setAvatarUrl(url)
    }

    return (
        <Card className="border-primary/10 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Update your personal details</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <AvatarUploader
                        currentAvatarUrl={avatarUrl}
                        username={form.watch('username')}
                        onAvatarChange={handleAvatarChange}
                    />

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground/80">Full Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder="John Doe"
                                                className="bg-secondary/50 border-secondary-foreground/10 focus:border-primary/50 focus:ring-primary/20 h-11"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground/80">Username</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder="johndoe123"
                                                className="bg-secondary/50 border-secondary-foreground/10 focus:border-primary/50 focus:ring-primary/20 h-11"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                        <p className="text-xs text-muted-foreground">
                                            Letters, numbers, and underscores only. This must be unique.
                                        </p>
                                    </FormItem>
                                )}
                            />

                            <MotionButton
                                type="submit"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={loading}
                                className="w-full h-11 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Saving...</span>
                                    </div>
                                ) : (
                                    'Save Changes'
                                )}
                            </MotionButton>
                        </form>
                    </Form>
                </div>
            </CardContent>
        </Card>
    )
}
