'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronDown, Search, X } from 'lucide-react'
import type { Speaker } from '@/types'

interface SpeakerComboboxProps {
  value?: string
  onChange?: (speakerId: string | null) => void
  placeholder?: string
}

export function SpeakerCombobox({ value, onChange, placeholder = 'Cari narasumber...' }: SpeakerComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true

    async function loadSpeakers() {
      try {
        setIsLoading(true)
        setError('')
        const response = await fetch('/api/admin/speakers', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal memuat narasumber')
        if (active) setSpeakers(payload.data)
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat narasumber')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadSpeakers()

    return () => {
      active = false
    }
  }, [])

  const selected = useMemo(
    () => (value ? speakers.find((speaker) => speaker.id === value) ?? null : null),
    [speakers, value],
  )

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return speakers
    return speakers.filter((speaker) =>
      speaker.nama_lengkap.toLowerCase().includes(keyword) ||
      speaker.keahlian.some((skill) => skill.toLowerCase().includes(keyword)) ||
      speaker.kategori.toLowerCase().includes(keyword)
    )
  }, [query, speakers])

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selectSpeaker(speaker: Speaker) {
    onChange?.(speaker.id)
    setOpen(false)
    setQuery('')
  }

  function clearSpeaker() {
    onChange?.(null)
    setQuery('')
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full flex items-center gap-2 px-3 h-10 rounded-xl border border-input bg-background text-sm text-left hover:border-[#1B4332]/40 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
      >
        {selected ? (
          <>
            <Image src={selected.foto_url} alt={selected.nama_lengkap} width={24} height={24} className="h-6 w-6 rounded-full object-cover shrink-0" />
            <span className="flex-1 font-medium text-[#1B4332] truncate">{selected.nama_lengkap}</span>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">{selected.kategori}</span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                clearSpeaker()
              }}
              className="p-0.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="flex-1 text-gray-400">{placeholder}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {open ? (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ketik nama atau keahlian..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 rounded-lg border-0 outline-none focus:ring-1 focus:ring-[#1B4332]/20"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-gray-400">Memuat narasumber...</div>
            ) : error ? (
              <div className="py-8 px-4 text-center text-sm text-red-500">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">Narasumber tidak ditemukan</div>
            ) : filtered.map((speaker) => (
              <button
                key={speaker.id}
                type="button"
                onClick={() => selectSpeaker(speaker)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#1B4332]/5 transition-colors text-left ${
                  speaker.id === value ? 'bg-[#1B4332]/5' : ''
                }`}
              >
                <Image src={speaker.foto_url} alt={speaker.nama_lengkap} width={32} height={32} className="h-8 w-8 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1B4332] truncate">{speaker.nama_lengkap}</p>
                  <p className="text-[10px] text-gray-400 truncate">{speaker.keahlian.slice(0, 2).join(' - ') || speaker.kategori}</p>
                </div>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">{speaker.kategori}</span>
                {speaker.id === value ? <span className="text-emerald-500 text-xs">OK</span> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
