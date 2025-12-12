import { z } from 'zod'

// Schema for login form
export const loginSchema = z.object({
    email: z.email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
})

// Schema for registration form
export const registerSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

// Schema for completing profile (username required, password optional for email users)
export const completeProfileSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must be at most 20 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
})

// Schema for updating profile info (settings page)
export const profileInfoSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must be at most 20 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
})

// Schema for changing email
export const changeEmailSchema = z.object({
    email: z.email('Please enter a valid email address'),
})

// Schema for changing password
export const changePasswordSchema = z.object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type CompleteProfileFormData = z.infer<typeof completeProfileSchema>
export type ProfileInfoFormData = z.infer<typeof profileInfoSchema>
export type ChangeEmailFormData = z.infer<typeof changeEmailSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

