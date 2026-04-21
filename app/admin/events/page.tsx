'use client'

import { useState } from 'react'
import { dummyEvents } from '@/lib/dummy'
import { Event, EventCategory, EventStatus } from '@/types'
import Link from 'next/link'
import { CheckCircle, ChevronRight, Filter, Plus, Search, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  LIVE: 'Live',
  FINISHED: 'Selesai',
  COMPLETED: 'Completed',
}

const STATUS_COLORS: Record<EventStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  LIVE: 'bg-green-100 text-green-700',
  FINISHED: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function MasterEventPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [approveTarget, setApproveTarget] = useState<Event | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Event | null>(null)
  const [events, setEvents] = useState<Event[]>(dummyEvents)

  const filtered = events.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.location_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || e.status === statusFilter
    const matchCat = categoryFilter === 'ALL' || e.category === categoryFilter
    return matchSearch && matchStatus && matchCat
  })

  function handleApprove(event: Event) {
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: 'APPROVED' as EventStatus } : e))
    setApproveTarget(null)
  }

  function handleReject(event: Event) {
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: 'DRAFT' as EventStatus } : e))
    setRejectTarget(null)
  }

  return (
    <div className="p-5 md:p-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#1B4332]">Master Event</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola dan setujui semua event MPJ</p>
        </div>
        <Link href="/admin/events/new">
          <Button className="bg-[#1B4332] hover:bg-[#14532d] text-white gap-1.5 h-9 text-sm rounded-xl">
            <Plus className="w-4 h-4" /> Buat Event
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama event atau lokasi..."
            className="pl-9 h-9 rounded-xl border-gray-200 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v !== null && setStatusFilter(v)}>
          <SelectTrigger className="h-9 w-full sm:w-44 rounded-xl border-gray-200 text-sm">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => v !== null && setCategoryFilter(v)}>
          <SelectTrigger className="h-9 w-full sm:w-44 rounded-xl border-gray-200 text-sm">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Kategori</SelectItem>
            {(['Pelatihan', 'Seremonial', 'Rapat'] as EventCategory[]).map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table Desktop */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-bold text-[#1B4332]">Nama Event</TableHead>
              <TableHead className="font-bold text-[#1B4332]">Kategori</TableHead>
              <TableHead className="font-bold text-[#1B4332]">Tanggal</TableHead>
              <TableHead className="font-bold text-[#1B4332]">Status</TableHead>
              <TableHead className="font-bold text-[#1B4332]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-400 text-sm">Tidak ada event ditemukan.</TableCell>
              </TableRow>
            ) : filtered.map(event => (
              <TableRow key={event.id} className="hover:bg-green-50/40 transition-colors">
                <TableCell>
                  <p className="font-semibold text-[#1B4332] text-sm">{event.title}</p>
                  <p className="text-xs text-gray-400">{event.location_name}</p>
                </TableCell>
                <TableCell>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{event.category}</span>
                </TableCell>
                <TableCell className="text-sm text-gray-600 whitespace-nowrap">{formatDate(event.start_date)}</TableCell>
                <TableCell>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[event.status]}`}>
                    {STATUS_LABELS[event.status]}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {event.status === 'PENDING' && (
                      <>
                        <button onClick={() => setApproveTarget(event)} className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-semibold px-2.5 py-1 rounded-lg transition-colors">
                          <CheckCircle className="w-3.5 h-3.5" /> Setujui
                        </button>
                        <button onClick={() => setRejectTarget(event)} className="flex items-center gap-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 font-semibold px-2.5 py-1 rounded-lg transition-colors">
                          <XCircle className="w-3.5 h-3.5" /> Tolak
                        </button>
                      </>
                    )}
                    <Link href={`/admin/events/${event.id}`}>
                      <button className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 font-semibold px-2.5 py-1 rounded-lg transition-colors">
                        Kelola <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Cards Mobile */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl">Tidak ada event ditemukan.</div>
        ) : filtered.map(event => (
          <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1B4332] text-sm line-clamp-2">{event.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{event.location_name} · {formatDate(event.start_date)}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${STATUS_COLORS[event.status]}`}>
                {STATUS_LABELS[event.status]}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{event.category}</span>
              {event.status === 'PENDING' && (
                <>
                  <button onClick={() => setApproveTarget(event)} className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-semibold px-2.5 py-1 rounded-lg transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" /> Setujui
                  </button>
                  <button onClick={() => setRejectTarget(event)} className="flex items-center gap-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 font-semibold px-2.5 py-1 rounded-lg transition-colors">
                    <XCircle className="w-3.5 h-3.5" /> Tolak
                  </button>
                </>
              )}
              <Link href={`/admin/events/${event.id}`}>
                <button className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-lg transition-colors">
                  Kelola <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Approve Dialog */}
      <Dialog open={!!approveTarget} onOpenChange={() => setApproveTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#1B4332]">Setujui Event</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menyetujui event <strong>{approveTarget?.title}</strong>? Event akan berstatus <strong>APPROVED</strong> dan siap dipublikasikan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 flex-row justify-end">
            <Button variant="outline" onClick={() => setApproveTarget(null)} className="rounded-xl">Batal</Button>
            <Button onClick={() => approveTarget && handleApprove(approveTarget)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              Ya, Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600">Tolak Event</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menolak event <strong>{rejectTarget?.title}</strong>? Event akan dikembalikan ke status <strong>DRAFT</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 flex-row justify-end">
            <Button variant="outline" onClick={() => setRejectTarget(null)} className="rounded-xl">Batal</Button>
            <Button onClick={() => rejectTarget && handleReject(rejectTarget)} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
              Ya, Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
