'use client'

import { useCallback, useState } from 'react'
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
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
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
    setFileName(null)
    setError(null)
    onClear?.()
  }

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
          <div className="relative aspect-[4/5] max-h-64 overflow-hidden">
            <Image src={preview} alt="Poster preview" fill sizes="256px" className="object-cover" />
          </div>
          <button
            type="button"
            onClick={clearPreview}
            className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {fileName ? (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-3 py-1.5 truncate">
              {fileName}
            </div>
          ) : null}
        </div>
      ) : (
        <label
          htmlFor="poster-upload"
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            isDragging
              ? 'border-[#1B4332] bg-[#1B4332]/5 scale-[1.01]'
              : 'border-gray-200 bg-gray-50 hover:border-[#1B4332]/40 hover:bg-gray-100'
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-[#1B4332]/10' : 'bg-gray-200'}`}>
            {isDragging ? <Upload className="w-5 h-5 text-[#1B4332]" /> : <ImageIcon className="w-5 h-5 text-gray-400" />}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-600">{isDragging ? 'Lepaskan file di sini' : 'Drag & drop poster'}</p>
            <p className="text-xs text-gray-400 mt-0.5">atau <span className="text-[#1B4332] font-semibold">klik untuk memilih file</span></p>
          </div>
          <p className="text-[10px] text-gray-300">JPG / WebP / PNG - Rasio 4:5 - Maks 100KB</p>
          <input id="poster-upload" type="file" accept=".jpg,.jpeg,.webp,.png" className="hidden" onChange={handleChange} />
        </label>
      )}
      {error ? (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      ) : null}
    </div>
  )
}
