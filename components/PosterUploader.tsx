'use client'

import { useCallback, useId, useState } from 'react'
import Image from 'next/image'
import { ImageIcon, Upload, X } from 'lucide-react'

interface PosterUploaderProps {
  onFileSelect?: (file: File, previewUrl: string) => void
  onClear?: () => void
  currentUrl?: string
}

const MAX_SIZE_KB = 100
const ALLOWED = ['image/jpeg', 'image/webp', 'image/png']

export function PosterUploader({ onFileSelect, onClear, currentUrl }: PosterUploaderProps) {
  const inputId = useId()
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [imageRatio, setImageRatio] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const processFile = useCallback((file: File) => {
    setError(null)
    if (!ALLOWED.includes(file.type)) {
      setError('Format harus JPG, WebP, atau PNG')
      return
    }
    if (file.size > MAX_SIZE_KB * 1024) {
      setError(`Ukuran maks ${MAX_SIZE_KB}KB. File Anda: ${Math.round(file.size / 1024)}KB`)
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const url = event.target?.result as string
      setPreview(url)
      setImageRatio(null)
      setFileName(file.name)
      onFileSelect?.(file, url)
    }
    reader.readAsDataURL(file)
  }, [onFileSelect])

  function handleDrop(event: React.DragEvent) {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) processFile(file)
  }

  function clearPreview() {
    setPreview(null)
    setImageRatio(null)
    setFileName(null)
    setError(null)
    onClear?.()
  }

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="w-full max-w-sm overflow-hidden rounded-xl border border-emerald-100 bg-white/90 shadow-sm">
          <div className="relative bg-gray-50">
            <div
              className="relative w-full max-h-80 overflow-hidden"
              style={{ aspectRatio: imageRatio ?? 4 / 5 }}
            >
              <Image
                src={preview}
                alt="Poster preview"
                fill
                sizes="(max-width: 640px) 100vw, 384px"
                className="object-contain"
                onLoad={(event) => {
                  const image = event.currentTarget
                  if (image.naturalWidth && image.naturalHeight) {
                    setImageRatio(image.naturalWidth / image.naturalHeight)
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={clearPreview}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              aria-label="Hapus poster"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {fileName ? (
              <div className="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-3 py-1.5 text-[10px] text-white">
                {fileName}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-emerald-50 bg-white/80 p-3">
            <label htmlFor={inputId} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-emerald-700 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800">
              <Upload className="h-3.5 w-3.5" />
              Ganti Poster
            </label>
            <button type="button" onClick={clearPreview} className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-100 bg-white px-3 text-xs font-bold text-red-600 transition hover:bg-red-50">
              <X className="h-3.5 w-3.5" />
              Hapus Poster
            </button>
            <input id={inputId} type="file" accept=".jpg,.jpeg,.webp,.png" className="hidden" onChange={handleChange} />
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all ${
            isDragging
              ? 'scale-[1.01] border-emerald-600 bg-emerald-50'
              : 'border-gray-200 bg-white/70 hover:border-emerald-500 hover:bg-emerald-50/50'
          }`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${isDragging ? 'bg-emerald-100' : 'bg-gray-100'}`}>
            {isDragging ? <Upload className="h-5 w-5 text-emerald-700" /> : <ImageIcon className="h-5 w-5 text-gray-400" />}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-600">{isDragging ? 'Lepaskan file di sini' : 'Drag & drop poster'}</p>
            <p className="mt-0.5 text-xs text-gray-400">atau <span className="font-semibold text-emerald-700">klik untuk Upload Poster</span></p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-700">Upload Poster</span>
          <p className="text-[10px] text-gray-400">JPG / WebP / PNG - Rasio mengikuti gambar - Maks 100KB</p>
          <input id={inputId} type="file" accept=".jpg,.jpeg,.webp,.png" className="hidden" onChange={handleChange} />
        </label>
      )}
      {error ? (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      ) : null}
    </div>
  )
}
