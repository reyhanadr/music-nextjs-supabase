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

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type CompleteProfileFormData = z.infer<typeof completeProfileSchema>
