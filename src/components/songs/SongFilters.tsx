'use client'

import { SortOption } from '@/types'
import { Button } from '@/components/ui/button'
import {
    ArrowDownAZ,
    ArrowUpZA,
    Clock,
    Calendar,
    Check,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SongFiltersProps {
    sortBy: SortOption
    onSortChange: (sort: SortOption) => void
}

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'newest', label: 'Newest First', icon: <Calendar className="h-4 w-4" /> },
    { value: 'oldest', label: 'Oldest First', icon: <Clock className="h-4 w-4" /> },
    { value: 'a-z', label: 'A to Z', icon: <ArrowDownAZ className="h-4 w-4" /> },
    { value: 'z-a', label: 'Z to A', icon: <ArrowUpZA className="h-4 w-4" /> },
]

export function SongFilters({ sortBy, onSortChange }: SongFiltersProps) {
    const currentSort = sortOptions.find(opt => opt.value === sortBy) || sortOptions[0]

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-secondary/50 border-primary/20 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                    >
                        {currentSort.icon}
                        <span className="hidden sm:inline ml-2">{currentSort.label}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-primary/20">
                    {sortOptions.map((option) => (
                        <DropdownMenuItem
                            key={option.value}
                            onClick={() => onSortChange(option.value)}
                            className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10"
                        >
                            <span className="flex items-center gap-2 flex-1">
                                {option.icon}
                                {option.label}
                            </span>
                            {sortBy === option.value && (
                                <Check className="h-4 w-4 text-primary" />
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
