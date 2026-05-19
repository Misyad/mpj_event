'use client'

import { useMemo, useState } from 'react'
import { dummyCrew, dummyMedia, dummyPesantren } from '@/lib/dummy'
import type { CrewMember, MediaUnit, Pesantren } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Building2, Database, Pencil, Radio, Search, Users } from 'lucide-react'
import { toast } from 'sonner'

type EditingState =
  | { kind: 'pesantren'; item: Pesantren }
  | { kind: 'media'; item: MediaUnit }
  | { kind: 'crew'; item: CrewMember }

export default function MasterDataPage() {
  const [pesantrenRows, setPesantrenRows] = useState(dummyPesantren)
  const [mediaRows, setMediaRows] = useState(dummyMedia)
  const [crewRows, setCrewRows] = useState(dummyCrew)
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('ALL')
  const [editing, setEditing] = useState<EditingState | null>(null)

  const regions = useMemo(() => ['ALL', ...Array.from(new Set([
    ...pesantrenRows.map((item) => item.region),
    ...mediaRows.map((item) => item.region),
    ...crewRows.map((item) => item.unit),
  ]))], [crewRows, mediaRows, pesantrenRows])

  const filteredPesantren = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return pesantrenRows.filter((item) => {
      const matchesSearch = !keyword || item.name.toLowerCase().includes(keyword) || item.founder.toLowerCase().includes(keyword) || item.kabupaten.toLowerCase().includes(keyword)
      const matchesRegion = regionFilter === 'ALL' || item.region === regionFilter
      return matchesSearch && matchesRegion
    })
  }, [pesantrenRows, regionFilter, search])

  const filteredMedia = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return mediaRows.filter((item) => {
      const matchesSearch = !keyword || item.name.toLowerCase().includes(keyword) || item.type.toLowerCase().includes(keyword) || item.pic.toLowerCase().includes(keyword)
      const matchesRegion = regionFilter === 'ALL' || item.region === regionFilter
      return matchesSearch && matchesRegion
    })
  }, [mediaRows, regionFilter, search])

  const filteredCrew = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return crewRows.filter((item) => {
      const matchesSearch = !keyword || item.full_name.toLowerCase().includes(keyword) || item.niam.toLowerCase().includes(keyword) || item.role.toLowerCase().includes(keyword)
      const matchesRegion = regionFilter === 'ALL' || item.unit === regionFilter
      return matchesSearch && matchesRegion
    })
  }, [crewRows, regionFilter, search])

  function updateEditing(field: string, value: string | number) {
    setEditing((current) => {
      if (!current) return current
      return { ...current, item: { ...current.item, [field]: value } } as EditingState
    })
  }

  function saveEditing() {
    if (!editing) return
    if (editing.kind === 'pesantren') setPesantrenRows((current) => current.map((item) => (item.id === editing.item.id ? editing.item : item)))
    if (editing.kind === 'media') setMediaRows((current) => current.map((item) => (item.id === editing.item.id ? editing.item : item)))
    if (editing.kind === 'crew') setCrewRows((current) => current.map((item) => (item.id === editing.item.id ? editing.item : item)))
    toast.success('Master data berhasil diperbarui')
    setEditing(null)
  }

  return (
    <div className="space-y-5 p-5 md:p-8">
      <div>
        <h1 className="text-xl font-extrabold text-[#1B4332] md:text-2xl">Master Data</h1>
        <p className="mt-0.5 text-sm text-gray-500">Penampungan Master Data MPJ Apps: Pesantren, Media, dan Kru MPJ</p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard icon={<Database className="h-4 w-4" />} label="Sumber Data" value="Penampungan" tone="text-[#1B4332]" />
        <SummaryCard icon={<Building2 className="h-4 w-4" />} label="Pesantren" value={String(pesantrenRows.length)} tone="text-emerald-700" />
        <SummaryCard icon={<Radio className="h-4 w-4" />} label="Media" value={String(mediaRows.length)} tone="text-blue-700" />
        <SummaryCard icon={<Users className="h-4 w-4" />} label="Kru" value={String(crewRows.length)} tone="text-purple-700" />
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Data ini masih menjadi penampungan internal. Edit di halaman ini menjaga bentuk UI dan tidak membuat data baru.
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, NIAM, lokasi..." className="h-9 rounded-xl border-gray-200 pl-9 text-sm" />
        </div>
        <Select value={regionFilter} onValueChange={(value) => value && setRegionFilter(value)}>
          <SelectTrigger className="h-9 w-full rounded-xl border-gray-200 text-sm sm:w-52">
            <SelectValue placeholder="Filter Regional" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((region) => <SelectItem key={region} value={region}>{region === 'ALL' ? 'Semua Regional' : region}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="pesantren" className="w-full">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-xl bg-gray-100 p-1">
          <TabsTrigger value="pesantren" className="rounded-lg px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-[#1B4332] data-[state=active]:text-white">
            Pesantren ({filteredPesantren.length})
          </TabsTrigger>
          <TabsTrigger value="media" className="rounded-lg px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-[#1B4332] data-[state=active]:text-white">
            Media ({filteredMedia.length})
          </TabsTrigger>
          <TabsTrigger value="crew" className="rounded-lg px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-[#1B4332] data-[state=active]:text-white">
            Kru ({filteredCrew.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pesantren" className="mt-4">
          <MasterTable
            emptyColSpan={7}
            headers={['Nama Pesantren', 'Pendiri', 'Regional', 'Kabupaten', 'Santri', 'Status', 'Aksi']}
            rows={filteredPesantren.map((item) => [
              item.name,
              item.founder,
              item.region,
              item.kabupaten,
              item.total_santri.toLocaleString('id-ID'),
              <StatusBadge key="status" status={item.status} />,
              <EditButton key="edit" onClick={() => setEditing({ kind: 'pesantren', item: { ...item } })} />,
            ])}
          />
          <MobileList items={filteredPesantren.map((item) => ({
            id: item.id,
            title: item.name,
            subtitle: `${item.founder} - ${item.region}`,
            meta: `${item.kabupaten} - ${item.total_santri.toLocaleString('id-ID')} santri`,
            status: item.status,
            onEdit: () => setEditing({ kind: 'pesantren', item: { ...item } }),
          }))} />
        </TabsContent>

        <TabsContent value="media" className="mt-4">
          <MasterTable
            emptyColSpan={6}
            headers={['Nama Media', 'Tipe', 'Regional', 'PIC', 'Status', 'Aksi']}
            rows={filteredMedia.map((item) => [
              item.name,
              <Badge key="type" className="bg-blue-100 text-blue-700">{item.type}</Badge>,
              item.region,
              item.pic,
              <StatusBadge key="status" status={item.status} />,
              <EditButton key="edit" onClick={() => setEditing({ kind: 'media', item: { ...item } })} />,
            ])}
          />
          <MobileList items={filteredMedia.map((item) => ({
            id: item.id,
            title: item.name,
            subtitle: `${item.type} - ${item.region}`,
            meta: `PIC: ${item.pic}`,
            status: item.status,
            onEdit: () => setEditing({ kind: 'media', item: { ...item } }),
          }))} />
        </TabsContent>

        <TabsContent value="crew" className="mt-4">
          <MasterTable
            emptyColSpan={7}
            headers={['Nama Kru', 'NIAM', 'Unit', 'Role', 'Pesantren', 'Bergabung', 'Aksi']}
            rows={filteredCrew.map((item) => [
              item.full_name,
              item.niam,
              item.unit,
              <Badge key="role" className="bg-purple-100 text-purple-700">{item.role}</Badge>,
              item.pesantren,
              new Date(item.joined_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
              <EditButton key="edit" onClick={() => setEditing({ kind: 'crew', item: { ...item } })} />,
            ])}
          />
          <MobileList items={filteredCrew.map((item) => ({
            id: item.id,
            title: item.full_name,
            subtitle: `${item.niam} - ${item.role}`,
            meta: `${item.unit} - ${item.pesantren}`,
            onEdit: () => setEditing({ kind: 'crew', item: { ...item } }),
          }))} />
        </TabsContent>
      </Tabs>

      <EditMasterDialog editing={editing} onChange={updateEditing} onCancel={() => setEditing(null)} onSave={saveEditing} />
    </div>
  )
}

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gray-50 ${tone}`}>{icon}</div>
      <p className="text-xs font-semibold text-gray-400">{label}</p>
      <p className={`mt-1 text-lg font-extrabold ${tone}`}>{value}</p>
    </div>
  )
}

function MasterTable({ headers, rows, emptyColSpan }: { headers: string[]; rows: React.ReactNode[][]; emptyColSpan: number }) {
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            {headers.map((header) => <TableHead key={header} className="font-bold text-[#1B4332]">{header}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={emptyColSpan} className="py-12 text-center text-sm text-gray-400">Tidak ada data ditemukan.</TableCell></TableRow>
          ) : rows.map((row, index) => (
            <TableRow key={index} className="transition-colors hover:bg-green-50/40">
              {row.map((cell, cellIndex) => <TableCell key={`${index}-${cellIndex}`} className="text-sm text-gray-600">{cell}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function MobileList({ items }: { items: Array<{ id: string; title: string; subtitle: string; meta: string; status?: 'Aktif' | 'Non-Aktif'; onEdit: () => void }> }) {
  return (
    <div className="space-y-3 md:hidden">
      {items.map((item) => (
        <div key={item.id} className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-[#1B4332]">{item.title}</p>
            {item.status ? <StatusBadge status={item.status} /> : null}
          </div>
          <p className="text-xs text-gray-400">{item.subtitle}</p>
          <p className="text-xs text-gray-500">{item.meta}</p>
          <button type="button" onClick={item.onEdit} className="text-xs font-bold text-[#1B4332] hover:underline">Edit</button>
        </div>
      ))}
    </div>
  )
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <Button size="sm" variant="outline" type="button" onClick={onClick}>
      <Pencil className="h-3.5 w-3.5" />
      Edit
    </Button>
  )
}

function StatusBadge({ status }: { status: 'Aktif' | 'Non-Aktif' }) {
  return <Badge className={status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}>{status}</Badge>
}

function EditMasterDialog({ editing, onChange, onCancel, onSave }: { editing: EditingState | null; onChange: (field: string, value: string | number) => void; onCancel: () => void; onSave: () => void }) {
  return (
    <Dialog open={Boolean(editing)} onOpenChange={(open) => {
      if (!open) onCancel()
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {editing?.kind === 'pesantren' ? 'Pesantren' : editing?.kind === 'media' ? 'Media' : 'Kru'}</DialogTitle>
          <DialogDescription>Preload data existing, lalu simpan perubahan tanpa membuat data baru.</DialogDescription>
        </DialogHeader>
        {editing?.kind === 'pesantren' ? (
          <div className="grid gap-3">
            <EditInput label="Nama Pesantren" value={editing.item.name} onChange={(value) => onChange('name', value)} />
            <EditInput label="Pendiri" value={editing.item.founder} onChange={(value) => onChange('founder', value)} />
            <EditInput label="Regional" value={editing.item.region} onChange={(value) => onChange('region', value)} />
            <EditInput label="Kabupaten" value={editing.item.kabupaten} onChange={(value) => onChange('kabupaten', value)} />
            <EditInput label="Total Santri" type="number" value={String(editing.item.total_santri)} onChange={(value) => onChange('total_santri', Number(value || 0))} />
            <EditStatus value={editing.item.status} onChange={(value) => onChange('status', value)} />
          </div>
        ) : null}
        {editing?.kind === 'media' ? (
          <div className="grid gap-3">
            <EditInput label="Nama Media" value={editing.item.name} onChange={(value) => onChange('name', value)} />
            <EditInput label="Tipe" value={editing.item.type} onChange={(value) => onChange('type', value)} />
            <EditInput label="Regional" value={editing.item.region} onChange={(value) => onChange('region', value)} />
            <EditInput label="PIC" value={editing.item.pic} onChange={(value) => onChange('pic', value)} />
            <EditStatus value={editing.item.status} onChange={(value) => onChange('status', value)} />
          </div>
        ) : null}
        {editing?.kind === 'crew' ? (
          <div className="grid gap-3">
            <EditInput label="Nama Kru" value={editing.item.full_name} onChange={(value) => onChange('full_name', value)} />
            <EditInput label="NIAM" value={editing.item.niam} onChange={(value) => onChange('niam', value)} />
            <EditInput label="Unit" value={editing.item.unit} onChange={(value) => onChange('unit', value)} />
            <EditInput label="Role" value={editing.item.role} onChange={(value) => onChange('role', value)} />
            <EditInput label="Pesantren" value={editing.item.pesantren} onChange={(value) => onChange('pesantren', value)} />
            <EditInput label="Tanggal Bergabung" type="date" value={editing.item.joined_at} onChange={(value) => onChange('joined_at', value)} />
          </div>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
          <Button type="button" className="bg-[#1B4332] text-white hover:bg-[#14532d]" onClick={onSave}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-600">{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl" />
    </div>
  )
}

function EditStatus({ value, onChange }: { value: 'Aktif' | 'Non-Aktif'; onChange: (value: 'Aktif' | 'Non-Aktif') => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-600">Status</Label>
      <Select value={value} onValueChange={(next) => onChange(next as 'Aktif' | 'Non-Aktif')}>
        <SelectTrigger className="h-10 rounded-xl">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Aktif">Aktif</SelectItem>
          <SelectItem value="Non-Aktif">Non-Aktif</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
