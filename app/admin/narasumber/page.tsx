'use client'

import { useState } from 'react'
import Image from 'next/image'
import { dummySpeakers } from '@/lib/dummy'
import { Speaker, SpeakerCategory } from '@/types'
import Link from 'next/link'
import { ExternalLink, Phone, Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const CATEGORY_COLORS: Record<SpeakerCategory, string> = {
  Tech: 'bg-blue-100 text-blue-700',
  Bisnis: 'bg-amber-100 text-amber-700',
  Desain: 'bg-purple-100 text-purple-700',
  Jurnalistik: 'bg-emerald-100 text-emerald-700',
  Keagamaan: 'bg-teal-100 text-teal-700',
  Lainnya: 'bg-gray-100 text-gray-600',
}

export default function NarasumberPage() {
  const [search, setSearch] = useState('')
  const [kategoriFilter, setKategoriFilter] = useState<string>('ALL')
  const [keahlianFilter, setKeahlianFilter] = useState('')
  const [speakers, setSpeakers] = useState<Speaker[]>(dummySpeakers)

  const allKeahlian = Array.from(new Set(dummySpeakers.flatMap(s => s.keahlian))).sort()

  const filtered = speakers.filter(s => {
    const matchSearch = s.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
      s.alamat.toLowerCase().includes(search.toLowerCase())
    const matchKat = kategoriFilter === 'ALL' || s.kategori === kategoriFilter
    const matchKeahlian = keahlianFilter === '' || s.keahlian.some(k => k.toLowerCase().includes(keahlianFilter.toLowerCase()))
    return matchSearch && matchKat && matchKeahlian
  })

  function sendWhatsApp(speaker: Speaker) {
    setSpeakers(prev => prev.map(s => s.id === speaker.id ? { ...s, whatsapp_notif_sent: true } : s))
  }

  return (
    <div className="p-5 md:p-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#1B4332]">Narasumber</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola daftar pembicara & narasumber event</p>
        </div>
        <Link href="/admin/narasumber/new">
          <Button className="bg-[#1B4332] hover:bg-[#14532d] text-white gap-1.5 h-9 text-sm rounded-xl">
            <Plus className="w-4 h-4" /> Tambah
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: speakers.length, color: 'text-[#1B4332]' },
          { label: 'Notif Terkirim', value: speakers.filter(s => s.whatsapp_notif_sent).length, color: 'text-emerald-600' },
          { label: 'Belum Notif', value: speakers.filter(s => !s.whatsapp_notif_sent).length, color: 'text-amber-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama atau lokasi..." className="pl-9 h-9 rounded-xl border-gray-200 text-sm" />
        </div>
        <Select value={kategoriFilter} onValueChange={v => v !== null && setKategoriFilter(v)}>
          <SelectTrigger className="h-9 w-full sm:w-44 rounded-xl border-gray-200 text-sm">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Kategori</SelectItem>
            {(['Tech', 'Bisnis', 'Desain', 'Jurnalistik', 'Keagamaan', 'Lainnya'] as SpeakerCategory[]).map(k => (
              <SelectItem key={k} value={k}>{k}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={keahlianFilter} onValueChange={v => v !== null && setKeahlianFilter(v)}>
          <SelectTrigger className="h-9 w-full sm:w-48 rounded-xl border-gray-200 text-sm">
            <SelectValue placeholder="Filter Keahlian" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Keahlian</SelectItem>
            {allKeahlian.map(k => (
              <SelectItem key={k} value={k}>{k}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400 text-sm">
          Tidak ada narasumber ditemukan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(speaker => (
            <div key={speaker.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start gap-3">
                <Image src={speaker.foto_url} alt={speaker.nama_lengkap} width={48} height={48}
                  className="h-12 w-12 rounded-xl object-cover bg-gray-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#1B4332] text-sm line-clamp-1">{speaker.nama_lengkap}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{speaker.alamat}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${CATEGORY_COLORS[speaker.kategori]}`}>
                    {speaker.kategori}
                  </span>
                </div>
              </div>

              {/* Bio */}
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{speaker.bio}</p>

              {/* Keahlian Tags */}
              <div className="flex flex-wrap gap-1.5">
                {speaker.keahlian.map(k => (
                  <span key={k} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{k}</span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                <a href={`tel:${speaker.no_telp}`} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#1B4332] transition-colors">
                  <Phone className="w-3.5 h-3.5" /> {speaker.no_telp}
                </a>
                <div className="flex-1" />
                {speaker.portfolio_url && (
                  <a href={speaker.portfolio_url} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => sendWhatsApp(speaker)}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                    speaker.whatsapp_notif_sent
                      ? 'bg-emerald-100 text-emerald-700 cursor-default'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                  disabled={speaker.whatsapp_notif_sent}
                >
                  {speaker.whatsapp_notif_sent ? '✓ Terkirim' : '📱 Kirim WA'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
