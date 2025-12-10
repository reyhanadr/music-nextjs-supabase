'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const MotionDiv = motion.div
export const MotionSection = motion.section
export const MotionH1 = motion.h1
export const MotionP = motion.p

// Wrappers for ShadCN components if needed, or just use motion.create
// For complex ShadCN components (like Card), we can just wrap them in MotionDiv
// or use motion.create(Card) if it forwards ref properly.

export const MotionCard = motion.create(Card)
export const MotionButton = motion.create(Button)
