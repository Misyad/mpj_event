'use client'

import { useState } from 'react'
import { dummyCrew, dummyMedia, dummyPesantren } from '@/lib/dummy'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Building2, Database, Radio, Search, Users } from 'lucide-react'

export default function MasterDataPage() {
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('ALL')

  const regions = ['ALL', ...Array.from(new Set([
    ...dummyPesantren.map(p => p.region),
    ...dummyMedia.map(m => m.region),
    ...dummyCrew.map(c => c.unit),
  ]))]

  const filteredPesantren = dummyPesantren.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.kabupaten.toLowerCase().includes(search.toLowerCase())
    const matchRegion = regionFilter === 'ALL' || p.region === regionFilter
    return matchSearch && matchRegion
  })

  const filteredMedia = dummyMedia.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.type.toLowerCase().includes(search.toLowerCase())
    const matchRegion = regionFilter === 'ALL' || m.region === regionFilter
    return matchSearch && matchRegion
  })

  const filteredCrew = dummyCrew.filter(c => {
    const matchSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) || c.niam.toLowerCase().includes(search.toLowerCase())
    const matchRegion = regionFilter === 'ALL' || c.unit === regionFilter
    return matchSearch && matchRegion
  })

  return (
    <div className="p-5 md:p-8 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-[#1B4332]">Master Data</h1>
        <p className="text-sm text-gray-500 mt-0.5">Penampungan Master Data MPJ Apps: Pesantren, Media, dan Kru MPJ</p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard icon={<Database className="h-4 w-4" />} label="Sumber Data" value="Penampungan" tone="text-[#1B4332]" />
        <SummaryCard icon={<Building2 className="h-4 w-4" />} label="Pesantren" value={String(dummyPesantren.length)} tone="text-emerald-700" />
        <SummaryCard icon={<Radio className="h-4 w-4" />} label="Media" value={String(dummyMedia.length)} tone="text-blue-700" />
        <SummaryCard icon={<Users className="h-4 w-4" />} label="Kru" value={String(dummyCrew.length)} tone="text-purple-700" />
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Data ini masih menjadi penampungan internal. Struktur UI dipertahankan agar nanti bisa diganti ke API MPJ Apps tanpa merombak halaman.
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, NIAM, lokasi..."
            className="pl-9 h-9 rounded-xl border-gray-200 text-sm"
          />
        </div>
        <Select value={regionFilter} onValueChange={(v) => v !== null && setRegionFilter(v)}>
          <SelectTrigger className="h-9 w-full sm:w-52 rounded-xl border-gray-200 text-sm">
            <SelectValue placeholder="Filter Regional" />
          </SelectTrigger>
          <SelectContent>
            {regions.map(r => (
              <SelectItem key={r} value={r}>{r === 'ALL' ? 'Semua Regional' : r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="pesantren" className="w-full">
        <TabsList className="bg-gray-100 rounded-xl h-auto p-1 gap-1 w-full justify-start">
          <TabsTrigger value="pesantren" className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 data-[state=active]:bg-[#1B4332] data-[state=active]:text-white">
            <Building2 className="w-3.5 h-3.5" /> Pesantren ({filteredPesantren.length})
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 data-[state=active]:bg-[#1B4332] data-[state=active]:text-white">
            <Radio className="w-3.5 h-3.5" /> Media ({filteredMedia.length})
          </TabsTrigger>
          <TabsTrigger value="crew" className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 data-[state=active]:bg-[#1B4332] data-[state=active]:text-white">
            <Users className="w-3.5 h-3.5" /> Kru ({filteredCrew.length})
          </TabsTrigger>
        </TabsList>

        {/* Pesantren */}
        <TabsContent value="pesantren" className="mt-4">
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-bold text-[#1B4332]">Nama Pesantren</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Pendiri</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Regional</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Kabupaten</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Santri</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPesantren.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-gray-400 text-sm">Tidak ada data ditemukan.</TableCell></TableRow>
                ) : filteredPesantren.map(p => (
                  <TableRow key={p.id} className="hover:bg-green-50/40 transition-colors">
                    <TableCell className="font-semibold text-[#1B4332] text-sm">{p.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{p.founder}</TableCell>
                    <TableCell className="text-sm text-gray-600">{p.region}</TableCell>
                    <TableCell className="text-sm text-gray-600">{p.kabupaten}</TableCell>
                    <TableCell className="text-sm font-semibold text-[#1B4332]">{p.total_santri.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredPesantren.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-[#1B4332] text-sm">{p.name}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${p.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                </div>
                <p className="text-xs text-gray-400">{p.founder}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{p.region} · {p.kabupaten}</span>
                  <span className="font-semibold text-[#1B4332]">{p.total_santri.toLocaleString('id-ID')} santri</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Media */}
        <TabsContent value="media" className="mt-4">
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-bold text-[#1B4332]">Nama Media</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Tipe</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Regional</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">PIC</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedia.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-gray-400 text-sm">Tidak ada data ditemukan.</TableCell></TableRow>
                ) : filteredMedia.map(m => (
                  <TableRow key={m.id} className="hover:bg-green-50/40 transition-colors">
                    <TableCell className="font-semibold text-[#1B4332] text-sm">{m.name}</TableCell>
                    <TableCell><span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">{m.type}</span></TableCell>
                    <TableCell className="text-sm text-gray-600">{m.region}</TableCell>
                    <TableCell className="text-sm text-gray-600">{m.pic}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${m.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{m.status}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-3">
            {filteredMedia.map(m => (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-[#1B4332] text-sm">{m.name}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${m.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{m.status}</span>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold inline-block">{m.type}</span>
                <p className="text-xs text-gray-400">{m.region} · PIC: {m.pic}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Crew */}
        <TabsContent value="crew" className="mt-4">
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-bold text-[#1B4332]">Nama Kru</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">NIAM</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Unit</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Role</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Pesantren</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Bergabung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCrew.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-gray-400 text-sm">Tidak ada data ditemukan.</TableCell></TableRow>
                ) : filteredCrew.map(c => (
                  <TableRow key={c.id} className="hover:bg-green-50/40 transition-colors">
                    <TableCell className="font-semibold text-[#1B4332] text-sm">{c.full_name}</TableCell>
                    <TableCell className="text-xs font-mono text-gray-500">{c.niam}</TableCell>
                    <TableCell className="text-sm text-gray-600">{c.unit}</TableCell>
                    <TableCell><span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">{c.role}</span></TableCell>
                    <TableCell className="text-sm text-gray-600">{c.pesantren}</TableCell>
                    <TableCell className="text-xs text-gray-400">{new Date(c.joined_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-3">
            {filteredCrew.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-[#1B4332] text-sm">{c.full_name}</p>
                    <p className="text-xs font-mono text-gray-400 mt-0.5">{c.niam}</p>
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold shrink-0">{c.role}</span>
                </div>
                <p className="text-xs text-gray-400">{c.unit} · {c.pesantren}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gray-50 ${tone}`}>
        {icon}
      </div>
      <p className="text-xs font-semibold text-gray-400">{label}</p>
      <p className={`mt-1 text-lg font-extrabold ${tone}`}>{value}</p>
    </div>
  )
}
