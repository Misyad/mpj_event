'use client'

import { useEffect, useMemo, useState } from 'react'
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

type MasterKind = 'pesantren' | 'media' | 'crew'

type EditingState =
  | { kind: 'pesantren'; item: Pesantren }
  | { kind: 'media'; item: MediaUnit }
  | { kind: 'crew'; item: CrewMember }

const EMPTY_PESANTREN: Pesantren = { id: '', name: '', founder: '', region: '', kabupaten: '', total_santri: 0, status: 'Aktif' }
const EMPTY_MEDIA: MediaUnit = { id: '', name: '', type: '', region: '', pic: '', status: 'Aktif' }
const EMPTY_CREW: CrewMember = { id: '', niam: '', full_name: '', unit: '', role: '', pesantren: '', joined_at: new Date().toISOString().slice(0, 10) }

const ENDPOINTS: Record<MasterKind, string> = {
  pesantren: '/api/admin/master-data/pesantren',
  media: '/api/admin/master-data/media',
  crew: '/api/admin/master-data/crew',
}

export default function MasterDataPage({ mode = 'pusat' }: { mode?: 'pusat' | 'regional' }) {
  const [pesantrenRows, setPesantrenRows] = useState<Pesantren[]>([])
  const [mediaRows, setMediaRows] = useState<MediaUnit[]>([])
  const [crewRows, setCrewRows] = useState<CrewMember[]>([])
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('ALL')
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadMasterData(active = true) {
    try {
      setIsLoading(true)
      setError('')
      const [pesantrenResponse, mediaResponse, crewResponse] = await Promise.all([
        fetch(ENDPOINTS.pesantren, { cache: 'no-store' }),
        fetch(ENDPOINTS.media, { cache: 'no-store' }),
        fetch(ENDPOINTS.crew, { cache: 'no-store' }),
      ])
      const [pesantrenPayload, mediaPayload, crewPayload] = await Promise.all([
        pesantrenResponse.json(),
        mediaResponse.json(),
        crewResponse.json(),
      ])
      if (!pesantrenResponse.ok || !pesantrenPayload.ok) throw new Error(pesantrenPayload.error || 'Gagal memuat pesantren')
      if (!mediaResponse.ok || !mediaPayload.ok) throw new Error(mediaPayload.error || 'Gagal memuat media')
      if (!crewResponse.ok || !crewPayload.ok) throw new Error(crewPayload.error || 'Gagal memuat kru')
      if (!active) return
      setPesantrenRows(pesantrenPayload.data ?? [])
      setMediaRows(mediaPayload.data ?? [])
      setCrewRows(crewPayload.data ?? [])
    } catch (loadError) {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat master data')
    } finally {
      if (active) setIsLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMasterData(active)
    return () => {
      active = false
    }
  }, [])

  const regions = useMemo(() => ['ALL', ...Array.from(new Set([
    ...pesantrenRows.map((item) => item.region),
    ...mediaRows.map((item) => item.region),
    ...crewRows.map((item) => item.unit),
  ].map((region) => region.trim()).filter(Boolean)))], [crewRows, mediaRows, pesantrenRows])

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

  function startCreate(kind: MasterKind) {
    if (kind === 'pesantren') setEditing({ kind, item: { ...EMPTY_PESANTREN } })
    if (kind === 'media') setEditing({ kind, item: { ...EMPTY_MEDIA } })
    if (kind === 'crew') setEditing({ kind, item: { ...EMPTY_CREW } })
    setError('')
  }

  function canEditItem(item: Pesantren | MediaUnit | CrewMember) {
    return mode !== 'regional' || item.scope === 'regional'
  }

  function editAction(editingState: EditingState) {
    return canEditItem(editingState.item) ? (
      <EditButton onClick={() => setEditing(editingState)} />
    ) : (
      <Badge className="bg-gray-100 text-gray-500">Pusat</Badge>
    )
  }

  async function saveEditing() {
    if (!editing) return
    const endpoint = editing.item.id ? `${ENDPOINTS[editing.kind]}/${editing.item.id}` : ENDPOINTS[editing.kind]
    try {
      setIsSaving(true)
      setError('')
      const response = await fetch(endpoint, {
        method: editing.item.id ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(editing.item),
      })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal menyimpan master data')
      toast.success(editing.item.id ? 'Master data berhasil diperbarui' : 'Master data berhasil ditambahkan')
      setEditing(null)
      await loadMasterData()
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Gagal menyimpan master data'
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5 p-5 md:p-8">
      <div>
        <h1 className="text-xl font-extrabold text-[#1B4332] md:text-2xl">Master Data</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {mode === 'regional'
            ? 'Kelola Master Data regional dan pakai data pusat sebagai referensi bersama.'
            : 'Penampungan Master Data MPJ Apps: Pesantren, Media, dan Kru MPJ'}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard icon={<Database className="h-4 w-4" />} label="Sumber Data" value="Database" tone="text-[#1B4332]" />
        <SummaryCard icon={<Building2 className="h-4 w-4" />} label="Pesantren" value={String(pesantrenRows.length)} tone="text-emerald-700" />
        <SummaryCard icon={<Radio className="h-4 w-4" />} label="Media" value={String(mediaRows.length)} tone="text-blue-700" />
        <SummaryCard icon={<Users className="h-4 w-4" />} label="Kru" value={String(crewRows.length)} tone="text-purple-700" />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

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

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => startCreate('pesantren')} className="rounded-xl bg-[#1B4332] text-white">Tambah Pesantren</Button>
        <Button type="button" onClick={() => startCreate('media')} variant="outline" className="rounded-xl">Tambah Media</Button>
        <Button type="button" onClick={() => startCreate('crew')} variant="outline" className="rounded-xl">Tambah Kru</Button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center text-sm font-semibold text-gray-400">
          Memuat master data...
        </div>
      ) : (
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
              editAction({ kind: 'pesantren', item: { ...item } }),
            ])}
          />
          <MobileList items={filteredPesantren.map((item) => ({
            id: item.id,
            title: item.name,
            subtitle: `${item.founder} - ${item.region}`,
            meta: `${item.kabupaten} - ${item.total_santri.toLocaleString('id-ID')} santri`,
            status: item.status,
            onEdit: canEditItem(item) ? () => setEditing({ kind: 'pesantren', item: { ...item } }) : undefined,
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
              editAction({ kind: 'media', item: { ...item } }),
            ])}
          />
          <MobileList items={filteredMedia.map((item) => ({
            id: item.id,
            title: item.name,
            subtitle: `${item.type} - ${item.region}`,
            meta: `PIC: ${item.pic}`,
            status: item.status,
            onEdit: canEditItem(item) ? () => setEditing({ kind: 'media', item: { ...item } }) : undefined,
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
              editAction({ kind: 'crew', item: { ...item } }),
            ])}
          />
          <MobileList items={filteredCrew.map((item) => ({
            id: item.id,
            title: item.full_name,
            subtitle: `${item.niam} - ${item.role}`,
            meta: `${item.unit} - ${item.pesantren}`,
            onEdit: canEditItem(item) ? () => setEditing({ kind: 'crew', item: { ...item } }) : undefined,
          }))} />
        </TabsContent>
      </Tabs>
      )}

      <EditMasterDialog editing={editing} isSaving={isSaving} onChange={updateEditing} onCancel={() => setEditing(null)} onSave={saveEditing} />
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

function MobileList({ items }: { items: Array<{ id: string; title: string; subtitle: string; meta: string; status?: 'Aktif' | 'Non-Aktif'; onEdit?: () => void }> }) {
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
          {item.onEdit ? (
            <button type="button" onClick={item.onEdit} className="text-xs font-bold text-[#1B4332] hover:underline">Edit</button>
          ) : (
            <Badge className="w-fit bg-gray-100 text-gray-500">Data Pusat</Badge>
          )}
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

function EditMasterDialog({ editing, isSaving, onChange, onCancel, onSave }: { editing: EditingState | null; isSaving: boolean; onChange: (field: string, value: string | number) => void; onCancel: () => void; onSave: () => void }) {
  const actionLabel = editing?.item.id ? 'Edit' : 'Tambah'
  return (
    <Dialog open={Boolean(editing)} onOpenChange={(open) => {
      if (!open) onCancel()
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{actionLabel} {editing?.kind === 'pesantren' ? 'Pesantren' : editing?.kind === 'media' ? 'Media' : 'Kru'}</DialogTitle>
          <DialogDescription>Data disimpan ke database master data dan langsung dipakai modul registrasi/event.</DialogDescription>
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
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Batal</Button>
          <Button type="button" className="bg-[#1B4332] text-white hover:bg-[#14532d]" onClick={onSave} disabled={isSaving}>{isSaving ? 'Menyimpan...' : 'Simpan'}</Button>
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
