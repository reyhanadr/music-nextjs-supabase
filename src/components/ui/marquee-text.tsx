'use client'

import { useRef, useEffect, useState } from 'react'
import Marquee from 'react-fast-marquee'

interface MarqueeTextProps {
    text: string
    className?: string
    speed?: number
    delay?: number
}

export function MarqueeText({
    text,
    className = '',
    speed = 30,
    delay = 2
}: MarqueeTextProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const measureRef = useRef<HTMLSpanElement>(null)
    const [isOverflowing, setIsOverflowing] = useState(false)
    const [containerWidth, setContainerWidth] = useState(0)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        // Gunakan ResizeObserver untuk memantau perubahan ukuran container
        // Ini sangat penting untuk elemen di dalam Dialog/Modal
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentBoxSize) {
                    setContainerWidth(entry.contentRect.width)
                }
            }
        })

        resizeObserver.observe(container)

        return () => {
            resizeObserver.disconnect()
        }
    }, [])

    useEffect(() => {
        if (measureRef.current && containerWidth > 0) {
            const textWidth = measureRef.current.offsetWidth
            // Tambahkan sedikit buffer (1px) untuk menghindari glitch pada floating point
            setIsOverflowing(textWidth > containerWidth)
        }
    }, [text, containerWidth])

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden w-full max-w-full ${className}`}
        >
            {/* Span tersembunyi untuk mengukur lebar teks asli */}
            <span
                ref={measureRef}
                className={`absolute invisible whitespace-nowrap opacity-0 pointer-events-none ${className}`}
                aria-hidden="true"
            >
                {text}
            </span>

            {isOverflowing ? (
                <div className="w-full">
                    <Marquee
                        speed={speed}
                        delay={delay}
                        pauseOnHover
                        gradient={true} // Gradient membuat efek pudar di ujung
                        gradientWidth={20}
                        gradientColor="hsl(var(--card))" // Sesuaikan dengan warna background card Anda
                    >
                        <span className="pr-8">{text}</span>
                    </Marquee>
                </div>
            ) : (
                <div className="truncate" title={text}>
                    {text}
                </div>
            )}
        </div>
    )
}