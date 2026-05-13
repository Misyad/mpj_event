'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type PaymentRow = {
  paymentId: string
  eventTitle: string
  participantName: string
  path: string
  amount: number
  status: string
  paymentMethod: string
  paymentChannel: string | null
  paymentDate: string | null
  createdAt: string | null
}

const STATUS_OPTIONS = ['ALL', 'waiting_payment', 'verified', 'failed', 'expired', 'rejected']

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString('id-ID') : '-'
}

export function FinancePaymentsClient({ title, description }: { title: string; description: string }) {
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [status, setStatus] = useState('ALL')
  const [search, setSearch] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadRows() {
      try {
        setIsLoading(true)
        setError('')
        const params = new URLSearchParams()
        if (status !== 'ALL') params.set('status', status)
        if (dateStart) params.set('dateStart', dateStart)
        if (dateEnd) params.set('dateEnd', dateEnd)
        const response = await fetch(`/api/finance/payments?${params.toString()}`, { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal memuat payment')
        if (active) setRows(payload.data)
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat payment')
      } finally {
        if (active) setIsLoading(false)
      }
    }
    loadRows()
    return () => {
      active = false
    }
  }, [dateEnd, dateStart, status])

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return rows
    return rows.filter((row) =>
      [row.eventTitle, row.participantName, row.paymentId, row.status, row.path].some((value) => String(value ?? '').toLowerCase().includes(keyword)),
    )
  }, [rows, search])

  const exportHref = useMemo(() => {
    const params = new URLSearchParams()
    if (status !== 'ALL') params.set('status', status)
    if (dateStart) params.set('dateStart', dateStart)
    if (dateEnd) params.set('dateEnd', dateEnd)
    params.set('export', 'csv')
    return `/api/finance/payments?${params.toString()}`
  }, [dateEnd, dateStart, status])

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">Keuangan</p>
            <h1 className="mt-1 text-2xl font-extrabold text-[#1B4332]">{title}</h1>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
          <a href={exportHref}>
            <Button className="rounded-xl bg-[#1B4332] text-white">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </a>
        </div>

        {error ? <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

        <div className="grid gap-3 lg:grid-cols-[1fr_180px_170px_170px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 rounded-xl bg-white pl-9" placeholder="Cari event, peserta, payment ID..." />
          </div>
          <Select value={status} onValueChange={(value) => value !== null && setStatus(value)}>
            <SelectTrigger className="h-10 rounded-xl bg-white"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item === 'ALL' ? 'Semua Status' : item}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} className="h-10 rounded-xl bg-white" />
          <Input type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} className="h-10 rounded-xl bg-white" />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-sm font-semibold text-gray-500">Memuat payment...</div>
          ) : filteredRows.length === 0 ? (
            <div className="p-10 text-center text-sm font-semibold text-gray-500">Tidak ada payment yang cocok.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Event</TableHead>
                  <TableHead>Peserta</TableHead>
                  <TableHead>Jalur</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Payment ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.paymentId}>
                    <TableCell className="font-semibold text-[#1B4332]">{row.eventTitle}</TableCell>
                    <TableCell>{row.participantName}</TableCell>
                    <TableCell>{row.path}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(row.amount)}</TableCell>
                    <TableCell><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{row.status}</span></TableCell>
                    <TableCell>{row.paymentMethod}{row.paymentChannel ? ` / ${row.paymentChannel}` : ''}</TableCell>
                    <TableCell>{formatDate(row.paymentDate ?? row.createdAt)}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">{row.paymentId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </main>
  )
}
