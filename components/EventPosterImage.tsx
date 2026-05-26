'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { ImageIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { normalizeEventPosterUrl } from '@/lib/event-poster'

interface EventPosterImageProps {
  src?: string | null
  alt: string
  priority?: boolean
  sizes?: string
  className?: string
  imageClassName?: string
}

export function EventPosterImage({
  src,
  alt,
  priority,
  sizes = '100vw',
  className = 'relative w-full aspect-video',
  imageClassName = 'object-cover',
}: EventPosterImageProps) {
  const normalizedSrc = useMemo(() => normalizeEventPosterUrl(src), [src])
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setIsLoaded(false)
    setHasError(false)
  }, [normalizedSrc])

  if (hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-emerald-50`}>
        <div className="flex flex-col items-center gap-2 text-center text-slate-500">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-slate-200">
            <ImageIcon className="h-5 w-5" />
          </span>
          <span className="text-xs font-semibold">Poster tidak tersedia</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} bg-slate-100`}>
      {!isLoaded ? (
        <Skeleton className="absolute inset-0 rounded-none bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100" />
      ) : null}
      <Image
        src={normalizedSrc}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={`${imageClassName} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  )
}
