'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MotionButton, MotionDiv } from '@/components/motion/wrappers'
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
import { getUserIdentities, connectGoogle, disconnectGoogle } from '@/lib/auth/actions'
import { Link2, Unlink, Loader2, Check, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

// Google Icon SVG Component
function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24">
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    )
}

interface ConnectedAccountsProps {
    onUpdate?: () => void
}

export function ConnectedAccounts({ onUpdate }: ConnectedAccountsProps) {
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [identities, setIdentities] = useState<{ provider: string; email?: string; id: string; identity_id: string }[]>([])

    useEffect(() => {
        loadIdentities()
    }, [])

    const loadIdentities = async () => {
        setLoading(true)
        const result = await getUserIdentities()
        if (!result.error) {
            setIdentities(result.identities)
        }
        setLoading(false)
    }

    const googleIdentity = identities.find(i => i.provider === 'google')
    const hasEmailProvider = identities.some(i => i.provider === 'email')
    const isOnlyAuthMethod = identities.length === 1 && googleIdentity && !hasEmailProvider

    const handleConnectGoogle = async () => {
        setActionLoading(true)
        try {
            await connectGoogle()
        } catch (error: any) {
            toast.error(error.message || 'Failed to connect Google account')
            setActionLoading(false)
        }
    }

    const handleDisconnectGoogle = async () => {
        if (!googleIdentity) return

        setActionLoading(true)
        const result = await disconnectGoogle(googleIdentity.identity_id)

        if (!result.success) {
            toast.error(result.error || 'Failed to disconnect Google account')
        } else {
            toast.success('Google account disconnected successfully!')
            await loadIdentities()
            onUpdate?.()
        }

        setActionLoading(false)
    }

    return (
        <Card className="border-primary/10 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <Link2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg sm:text-xl">Connected Accounts</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Manage your connected OAuth providers</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <MotionDiv
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border/50 bg-secondary/30"
                    >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="p-2 bg-background rounded-lg border border-border/50 flex-shrink-0">
                                <GoogleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium text-foreground text-sm sm:text-base">Google</p>
                                    {googleIdentity ? (
                                        <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                                            <Check className="h-3 w-3" />
                                            Connected
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground text-xs">
                                            Not connected
                                        </Badge>
                                    )}
                                </div>
                                {googleIdentity?.email && (
                                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{googleIdentity.email}</p>
                                )}
                            </div>
                        </div>

                        {googleIdentity ? (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isOnlyAuthMethod || actionLoading}
                                        className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/10"
                                    >
                                        <Unlink className="h-3 w-3" />
                                        Disconnect
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2 text-lg sm:text-xl text-foreground">
                                            <AlertTriangle className="h-5 w-5 text-destructive" />
                                            Disconnect Google Account
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {isOnlyAuthMethod ? (
                                                "You cannot disconnect Google because it's your only login method. Please set a password first."
                                            ) : (
                                                "Are you sure you want to disconnect your Google account? You will no longer be able to sign in with Google."
                                            )}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className='text-muted-foreground'>Cancel</AlertDialogCancel>
                                        {!isOnlyAuthMethod && (
                                            <AlertDialogAction
                                                onClick={handleDisconnectGoogle}
                                                className="bg-destructive hover:bg-destructive/90"
                                            >
                                                {actionLoading ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Disconnecting...
                                                    </>
                                                ) : (
                                                    'Disconnect'
                                                )}
                                            </AlertDialogAction>
                                        )}
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : (
                            <MotionButton
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleConnectGoogle}
                                disabled={actionLoading}
                                className="gap-2 bg-gradient-to-r from-primary to-purple-600"
                            >
                                {actionLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <Link2 className="h-4 w-4" />
                                        Connect Google
                                    </>
                                )}
                            </MotionButton>
                        )}
                    </MotionDiv>
                )}

                {isOnlyAuthMethod && (
                    <p className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Google is your only login method. Set a password before disconnecting.
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
