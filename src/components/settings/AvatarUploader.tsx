'use client'

import { useState, useCallback, useRef } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { MotionDiv, MotionButton } from '@/components/motion/wrappers'
import { Upload, Camera, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface AvatarUploaderProps {
    currentAvatarUrl?: string | null
    username?: string | null
    onAvatarChange: (url: string) => void
}

// Helper to create cropped image
async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
): Promise<Blob | null> {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return null

    const maxSize = Math.max(image.width, image.height)
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

    canvas.width = safeArea
    canvas.height = safeArea

    ctx.translate(safeArea / 2, safeArea / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-safeArea / 2, -safeArea / 2)

    ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
    )

    const data = ctx.getImageData(0, 0, safeArea, safeArea)

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    )

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob)
        }, 'image/jpeg', 0.9)
    })
}

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.setAttribute('crossOrigin', 'anonymous')
        image.src = url
    })
}

export function AvatarUploader({ currentAvatarUrl, username, onAvatarChange }: AvatarUploaderProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadSuccess, setUploadSuccess] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image must be less than 5MB')
                return
            }
            const reader = new FileReader()
            reader.addEventListener('load', () => {
                setImageSrc(reader.result as string)
                setIsDialogOpen(true)
            })
            reader.readAsDataURL(file)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image must be less than 5MB')
                return
            }
            const reader = new FileReader()
            reader.addEventListener('load', () => {
                setImageSrc(reader.result as string)
                setIsDialogOpen(true)
            })
            reader.readAsDataURL(file)
        }
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }, [])

    const uploadCroppedImage = async () => {
        if (!imageSrc || !croppedAreaPixels) return

        setIsUploading(true)
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
            if (!croppedBlob) {
                throw new Error('Failed to crop image')
            }

            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error('Not authenticated')
            }

            const fileName = `${user.id}-${Date.now()}.jpg`
            const filePath = `${user.id}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, croppedBlob, {
                    cacheControl: '3600',
                    upsert: true,
                })

            if (uploadError) {
                throw uploadError
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // Update profile with new avatar URL
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
                .eq('id', user.id)

            if (updateError) {
                throw updateError
            }

            onAvatarChange(publicUrl)
            setUploadSuccess(true)
            toast.success('Avatar updated successfully!')

            // Reset after animation
            setTimeout(() => {
                setIsDialogOpen(false)
                setImageSrc(null)
                setUploadSuccess(false)
            }, 1000)

        } catch (error: any) {
            toast.error(error.message || 'Failed to upload avatar')
        } finally {
            setIsUploading(false)
        }
    }

    const handleClose = () => {
        setIsDialogOpen(false)
        setImageSrc(null)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
    }

    return (
        <>
            <div className="flex flex-col items-center gap-4">
                <MotionDiv
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    <Avatar className="h-24 w-24 border-4 border-primary/20 ring-4 ring-primary/5 transition-all group-hover:ring-primary/20">
                        <AvatarImage src={currentAvatarUrl || ''} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground text-2xl font-bold">
                            {(username?.[0] || '?').toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="h-8 w-8 text-primary" />
                    </div>
                </MotionDiv>

                <div
                    className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-primary/20 rounded-lg hover:border-primary/40 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                        <span className="font-medium text-primary">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className='text-lg sm:text-xl text-foreground'>Crop Avatar</DialogTitle>
                        <DialogDescription>
                            Adjust the crop area to select your avatar
                        </DialogDescription>
                    </DialogHeader>

                    {imageSrc && (
                        <div className="relative h-64 w-full">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-4 px-4">
                        <span className="text-sm text-muted-foreground">Zoom</span>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="flex-1 accent-primary"
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                        <MotionButton
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={uploadCroppedImage}
                            disabled={isUploading}
                            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : uploadSuccess ? (
                                <>✓ Done</>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Save Avatar
                                </>
                            )}
                        </MotionButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
