'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { dummySpeakers } from '@/lib/dummy'
import { Speaker } from '@/types'

interface SpeakerComboboxProps {
  value?: string
  onChange?: (speakerId: string | null) => void
  placeholder?: string
}

export function SpeakerCombobox({ value, onChange, placeholder = 'Cari narasumber...' }: SpeakerComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selected = value ? dummySpeakers.find(s => s.id === value) : null

  const filtered = dummySpeakers.filter(s =>
    s.nama_lengkap.toLowerCase().includes(query.toLowerCase()) ||
    s.keahlian.some(k => k.toLowerCase().includes(query.toLowerCase())) ||
    s.kategori.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selectSpeaker(s: Speaker) {
    onChange?.(s.id)
    setOpen(false)
    setQuery('')
  }

  function clearSpeaker() {
    onChange?.(null)
    setQuery('')
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 h-10 rounded-xl border border-input bg-background text-sm text-left hover:border-[#1B4332]/40 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
      >
        {selected ? (
          <>
            <img src={selected.foto_url} alt={selected.nama_lengkap}
              className="w-6 h-6 rounded-full object-cover shrink-0" />
            <span className="flex-1 font-medium text-[#1B4332] truncate">{selected.nama_lengkap}</span>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">{selected.kategori}</span>
            <button type="button" onClick={e => { e.stopPropagation(); clearSpeaker() }}
              className="p-0.5 text-gray-400 hover:text-red-500 transition-colors shrink-0">
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

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ketik nama atau keahlian..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 rounded-lg border-0 outline-none focus:ring-1 focus:ring-[#1B4332]/20"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">Narasumber tidak ditemukan</div>
            ) : filtered.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => selectSpeaker(s)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#1B4332]/5 transition-colors text-left ${
                  s.id === value ? 'bg-[#1B4332]/5' : ''
                }`}
              >
                <img src={s.foto_url} alt={s.nama_lengkap} className="w-8 h-8 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1B4332] truncate">{s.nama_lengkap}</p>
                  <p className="text-[10px] text-gray-400 truncate">{s.keahlian.slice(0, 2).join(' · ')}</p>
                </div>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">{s.kategori}</span>
                {s.id === value && <span className="text-emerald-500 text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
