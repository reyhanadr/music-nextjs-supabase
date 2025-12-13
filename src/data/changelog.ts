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
    MessageCircle,
    LucideIcon,
    Search,
    Clock,
    Globe,
    Keyboard,
    ListEnd
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
        version: '1.3.0',
        date: '2025-12-14',
        title: 'Songs Page Overhaul',
        changes: [
            {
                type: 'feature',
                icon: Globe,
                title: 'Tab Navigation',
                description: 'New tabs for My Songs, Global Songs, and Recently Played with URL sync (?tab=my|global|recent).',
            },
            {
                type: 'feature',
                icon: Search,
                title: 'Enhanced Search',
                description: 'Debounced search (400ms) with sorting options: Newest, Oldest, A-Z, Z-A.',
            },
            {
                type: 'feature',
                icon: Clock,
                title: 'Recently Played',
                description: 'Tracks played songs in localStorage, persists per device. View your listening history.',
            },
            {
                type: 'feature',
                icon: ListEnd,
                title: 'Play Next',
                description: 'New "Play Next" button on song cards to add songs to the front of the queue.',
            },
            {
                type: 'improvement',
                icon: Zap,
                title: 'Infinite Scroll',
                description: 'Global songs tab now loads more songs automatically as you scroll down.',
            },
            {
                type: 'improvement',
                icon: Sparkles,
                title: 'Song Card Enhancements',
                description: 'Duration badge, owner badge (You/username), and improved hover animations.',
            },
            {
                type: 'improvement',
                icon: Keyboard,
                title: 'Keyboard Shortcuts',
                description: 'Press Ctrl+K (or Cmd+K) to quickly focus the search input.',
            },
            {
                type: 'fix',
                icon: Bug,
                title: 'Loading States',
                description: 'Fixed skeleton loader not showing during auth and data loading.',
            },
            {
                type: 'feature',
                icon: Clock,
                title: 'Recently Played Cloud Sync',
                description: 'Play history now syncs to Supabase, accessible across devices when logged in.',
            },
            {
                type: 'fix',
                icon: Smartphone,
                title: 'Create Room Dialog',
                description: 'Fixed long song titles expanding dialog width. MarqueeText now properly truncates.',
            },
        ],
    },
    {
        version: '1.2.0',
        date: '2025-12-13',
        title: 'Seamless Auth & Profile Flow',
        changes: [
            {
                type: 'improvement',
                icon: Zap,
                title: 'SSR Profile Fetch',
                description: 'Profile data now fetched server-side, eliminating loading delay on dashboard and navigation.',
            },
            {
                type: 'improvement',
                icon: User,
                title: 'Username Consistency',
                description: 'Header now displays username immediately without flicker from email to username.',
            },
            {
                type: 'fix',
                icon: MessageCircle,
                title: 'Chat Optimistic UI',
                description: 'Messages now display with username & avatar instantly, without "Anonymous" placeholder.',
            },
            {
                type: 'fix',
                icon: Bug,
                title: 'Chat Flicker Fix',
                description: 'Fixed double-render issue when sending chat messages by atomic state replacement.',
            },
        ],
    },
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
