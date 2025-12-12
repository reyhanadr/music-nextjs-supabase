'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DangerZoneProps {
    userEmail: string
}

export function DangerZone({ userEmail }: DangerZoneProps) {
    const [confirmText, setConfirmText] = useState('')
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const router = useRouter()

    const isConfirmed = confirmText === 'DELETE'

    const handleDeleteAccount = async () => {
        if (!isConfirmed) return

        setLoading(true)
        try {
            const supabase = createClient()

            // First, sign out the user
            await supabase.auth.signOut()

            // Note: For full account deletion, you would need a server-side function
            // or Edge Function with admin privileges to delete the user from auth.users
            // For now, we sign out and show a message

            toast.success('You have been signed out. To complete account deletion, please contact support.')
            router.push('/auth/login')
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete account')
            setLoading(false)
        }
    }

    return (
        <Card className="border-destructive/20 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                    </div>
                    <div>
                        <CardTitle className="text-lg sm:text-xl text-destructive">Danger Zone</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Irreversible actions for your account</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                    <div>
                        <p className="font-medium text-foreground text-sm sm:text-base">Delete Account</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Permanently delete your account and all associated data.
                        </p>
                    </div>
                    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Account
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                    <AlertTriangle className="h-5 w-5" />
                                    Delete Your Account?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="space-y-4">
                                    <p>
                                        This action cannot be undone. This will permanently delete your account
                                        and remove all your data including:
                                    </p>
                                    <ul className="list-disc list-inside text-sm space-y-1">
                                        <li>Your profile information</li>
                                        <li>Your uploaded songs</li>
                                        <li>Your party rooms</li>
                                        <li>All messages and activity</li>
                                    </ul>
                                    <div className="pt-2">
                                        <p className="text-sm font-medium text-foreground mb-2">
                                            Type <span className="font-bold text-destructive">DELETE</span> to confirm:
                                        </p>
                                        <Input
                                            value={confirmText}
                                            onChange={(e) => setConfirmText(e.target.value)}
                                            placeholder="Type DELETE to confirm"
                                            className="bg-secondary/50"
                                        />
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setConfirmText('')} className='text-muted-foreground'>
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteAccount}
                                    disabled={!isConfirmed || loading}
                                    className="bg-destructive hover:bg-destructive/90"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Account
                                        </>
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    )
}
