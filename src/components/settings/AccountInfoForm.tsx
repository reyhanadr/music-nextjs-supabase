'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MotionButton } from '@/components/motion/wrappers'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { changeEmailSchema, changePasswordSchema, type ChangeEmailFormData, type ChangePasswordFormData } from '@/lib/auth/schemas'
import { updateEmail, updatePassword } from '@/lib/auth/actions'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Loader2, Mail, Lock, Pencil, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface AccountInfoFormProps {
    currentEmail: string
    onUpdate?: () => void
}

export function AccountInfoForm({ currentEmail, onUpdate }: AccountInfoFormProps) {
    const [emailDialogOpen, setEmailDialogOpen] = useState(false)
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
    const [emailLoading, setEmailLoading] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const emailForm = useForm<ChangeEmailFormData>({
        resolver: zodResolver(changeEmailSchema),
        defaultValues: {
            email: '',
        },
    })

    const passwordForm = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        },
    })

    const handleEmailChange = async (data: ChangeEmailFormData) => {
        setEmailLoading(true)

        const result = await updateEmail(data.email)

        if (!result.success) {
            toast.error(result.error || 'Failed to update email')
        } else {
            toast.success('Confirmation email sent! Please check your new email address.')
            setEmailDialogOpen(false)
            emailForm.reset()
            onUpdate?.()
        }

        setEmailLoading(false)
    }

    const handlePasswordChange = async (data: ChangePasswordFormData) => {
        setPasswordLoading(true)

        const result = await updatePassword(data.newPassword)

        if (!result.success) {
            toast.error(result.error || 'Failed to update password')
        } else {
            toast.success('Password updated successfully!')
            setPasswordDialogOpen(false)
            passwordForm.reset()
            onUpdate?.()
        }

        setPasswordLoading(false)
    }

    return (
        <Card className="border-primary/10 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg sm:text-xl">Account Security</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Manage your email and password</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Email Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">Email Address</p>
                            <p className="text-sm text-muted-foreground truncate">{currentEmail}</p>
                        </div>
                    </div>
                    <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Pencil className="h-3 w-3" />
                                Change
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-lg sm:text-xl text-foreground">Change Email Address</DialogTitle>
                                <DialogDescription className="text-xs sm:text-sm">
                                    A confirmation email will be sent to your new address.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...emailForm}>
                                <form onSubmit={emailForm.handleSubmit(handleEmailChange)} className="space-y-4">
                                    <FormField
                                        control={emailForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-foreground">New Email Address</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        placeholder="newemail@example.com"
                                                        className="bg-background border-input text-foreground focus:border-primary/50 focus:ring-primary/20 h-11"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter className="gap-2 sm:gap-0">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setEmailDialogOpen(false)}
                                            disabled={emailLoading}
                                            className="border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 mr-2"
                                        >
                                            Cancel
                                        </Button>
                                        <MotionButton
                                            type="submit"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            disabled={emailLoading}
                                            className="bg-gradient-to-r from-primary to-purple-600"
                                        >
                                            {emailLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                'Send Confirmation'
                                            )}
                                        </MotionButton>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Separator className="bg-border/50" />

                {/* Password Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-foreground">Password</p>
                            <p className="text-sm text-muted-foreground">••••••••</p>
                        </div>
                    </div>
                    <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Pencil className="h-3 w-3" />
                                Change
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-lg sm:text-xl text-foreground">Change Password</DialogTitle>
                                <DialogDescription className="text-xs sm:text-sm">
                                    Enter your new password below.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...passwordForm}>
                                <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                                    <FormField
                                        control={passwordForm.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-foreground">New Password</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={showNewPassword ? 'text' : 'password'}
                                                            placeholder="••••••••"
                                                            className="bg-background border-input text-foreground h-11 pr-12"
                                                            {...field}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                        >
                                                            {showNewPassword ? (
                                                                <EyeOff className="h-5 w-5" />
                                                            ) : (
                                                                <Eye className="h-5 w-5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={passwordForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-foreground">Confirm Password</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={showConfirmPassword ? 'text' : 'password'}
                                                            placeholder="••••••••"
                                                            className="bg-background border-input text-foreground h-11 pr-12"
                                                            {...field}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                        >
                                                            {showConfirmPassword ? (
                                                                <EyeOff className="h-5 w-5" />
                                                            ) : (
                                                                <Eye className="h-5 w-5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter className="gap-2 sm:gap-0">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setPasswordDialogOpen(false)}
                                            disabled={passwordLoading}
                                            className="border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 mr-2"
                                        >
                                            Cancel
                                        </Button>
                                        <MotionButton
                                            type="submit"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            disabled={passwordLoading}
                                            className="bg-gradient-to-r from-primary to-purple-600"
                                        >
                                            {passwordLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                'Update Password'
                                            )}
                                        </MotionButton>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    )
}
