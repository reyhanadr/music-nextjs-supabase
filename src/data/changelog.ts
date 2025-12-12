import {
    ListMusic,
    Repeat2,
    Smartphone,
    Music2,
    Sparkles,
    Bug,
    Zap,
    User,
    Upload,
    Shield,
    Trash2,
    LucideIcon
} from 'lucide-react'

export interface ChangelogEntry {
    type: 'feature' | 'improvement' | 'fix'
    icon: LucideIcon
    title: string
    description: string
}

export interface ChangelogRelease {
    version: string
    date: string
    title: string
    changes: ChangelogEntry[]
}

export const changelog: ChangelogRelease[] = [
    {
        version: '1.1.0',
        date: '2025-12-12',
        title: 'Queue System & Player Enhancements',
        changes: [
            {
                type: 'feature',
                icon: ListMusic,
                title: 'Queue System',
                description: 'Added song queue with drag-and-drop reordering, localStorage persistence, and party mode guard.',
            },
            {
                type: 'feature',
                icon: Repeat2,
                title: 'Repeat Song',
                description: 'Added repeat toggle button to replay current song when it ends. Visual indicator with background and ring when active.',
            },
            {
                type: 'feature',
                icon: Music2,
                title: 'Expanded Music Player',
                description: 'New fullscreen player modal with artwork, queue panel, and playback controls. Accessible by tapping song info on mobile.',
            },
            {
                type: 'improvement',
                icon: Smartphone,
                title: 'Mobile Responsiveness',
                description: 'Improved ExpandedMusicPlayer layout for short viewports (Nest Hub, tablets). Controls now always visible with scrollable content.',
            },
            {
                type: 'improvement',
                icon: Sparkles,
                title: 'Enhanced Toggle Buttons',
                description: 'Queue and Repeat buttons now have visible active states with primary background and ring indicator.',
            },
            {
                type: 'fix',
                icon: Bug,
                title: 'Queue Playback Logic',
                description: 'Fixed queue not playing next song correctly. Now properly prioritizes queue over playlist.',
            },
            {
                type: 'fix',
                icon: Zap,
                title: 'Repeat Functionality',
                description: 'Fixed repeat not working - now properly seeks to beginning and plays again when song ends.',
            },
        ],
    },
    {
        version: '1.0.0',
        date: '2025-12-10',
        title: 'Profile Settings & Account Management',
        changes: [
            {
                type: 'feature',
                icon: User,
                title: 'Profile Settings',
                description: 'Complete profile management: edit full name, username, and email with validation.',
            },
            {
                type: 'feature',
                icon: Upload,
                title: 'Avatar Upload',
                description: 'Upload and edit profile avatar with image preview and Supabase storage integration.',
            },
            {
                type: 'feature',
                icon: Shield,
                title: 'Security Settings',
                description: 'Change password functionality and Google provider connection for OAuth login.',
            },
            {
                type: 'feature',
                icon: Trash2,
                title: 'Account Deletion',
                description: 'Delete account feature with confirmation dialog and complete data cleanup.',
            },
        ],
    },
]
