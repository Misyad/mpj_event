'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Summary = {
  totalIncome: number
  totalExpense: number
  balance: number
  eventCount: number
  transactionCount: number
}

type RecapRow = {
  eventId: string
  eventTitle: string
  scope: string
  regionId: string | null
  totalIncome: number
  totalExpense: number
  balance: number
  transactionCount: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

export function FinanceRecapClient({ title, description }: { title: string; description: string }) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [rows, setRows] = useState<RecapRow[]>([])
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadData() {
      try {
        setIsLoading(true)
        setError('')
        const params = new URLSearchParams()
        if (dateStart) params.set('dateStart', dateStart)
        if (dateEnd) params.set('dateEnd', dateEnd)
        const [summaryResponse, recapResponse] = await Promise.all([
          fetch(`/api/finance/events/summary?${params.toString()}`, { cache: 'no-store' }),
          fetch(`/api/finance/events/recap?${params.toString()}`, { cache: 'no-store' }),
        ])
        const [summaryPayload, recapPayload] = await Promise.all([summaryResponse.json(), recapResponse.json()])
        if (!summaryResponse.ok || !summaryPayload.ok) throw new Error(summaryPayload.error || 'Gagal memuat summary')
        if (!recapResponse.ok || !recapPayload.ok) throw new Error(recapPayload.error || 'Gagal memuat rekap')
        if (active) {
          setSummary(summaryPayload.data)
          setRows(recapPayload.data)
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat rekap keuangan')
      } finally {
        if (active) setIsLoading(false)
      }
    }
    loadData()
    return () => {
      active = false
    }
  }, [dateEnd, dateStart])

  const exportHref = useMemo(() => {
    const params = new URLSearchParams()
    if (dateStart) params.set('dateStart', dateStart)
    if (dateEnd) params.set('dateEnd', dateEnd)
    params.set('export', 'csv')
    return `/api/finance/events/recap?${params.toString()}`
  }, [dateEnd, dateStart])

  const cards = [
    { label: 'Total Pemasukan', value: formatCurrency(summary?.totalIncome ?? 0), color: 'text-emerald-600' },
    { label: 'Total Pengeluaran', value: formatCurrency(summary?.totalExpense ?? 0), color: 'text-red-600' },
    { label: 'Saldo Bersih', value: formatCurrency(summary?.balance ?? 0), color: 'text-[#1B4332]' },
    { label: 'Transaksi', value: String(summary?.transactionCount ?? 0), color: 'text-amber-600' },
  ]

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

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-400">{card.label}</p>
              <p className={`mt-2 text-xl font-extrabold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px] lg:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500">Tanggal mulai</p>
            <Input type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} className="h-10 rounded-xl bg-white" />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500">Tanggal akhir</p>
            <Input type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} className="h-10 rounded-xl bg-white" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-sm font-semibold text-gray-500">Memuat rekap...</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm font-semibold text-gray-500">Belum ada transaksi keuangan.</div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Event</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead className="text-right">Pemasukan</TableHead>
                      <TableHead className="text-right">Pengeluaran</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead className="text-right">Transaksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.eventId}>
                        <TableCell className="font-semibold text-[#1B4332]">{row.eventTitle}</TableCell>
                        <TableCell>{row.scope}{row.regionId ? ` / ${row.regionId}` : ''}</TableCell>
                        <TableCell className="text-right font-mono text-emerald-700">{formatCurrency(row.totalIncome)}</TableCell>
                        <TableCell className="text-right font-mono text-red-600">{formatCurrency(row.totalExpense)}</TableCell>
                        <TableCell className="text-right font-mono font-bold">{formatCurrency(row.balance)}</TableCell>
                        <TableCell className="text-right">{row.transactionCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-3 p-3 md:hidden">
                {rows.map((row) => (
                  <div key={row.eventId} className="rounded-xl border border-gray-100 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-[#1B4332]">{row.eventTitle}</p>
                        <p className="text-xs text-gray-500">{row.scope}{row.regionId ? ` / ${row.regionId}` : ''}</p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">{row.transactionCount} trx</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <AmountBox label="Masuk" value={formatCurrency(row.totalIncome)} className="text-emerald-700" />
                      <AmountBox label="Keluar" value={formatCurrency(row.totalExpense)} className="text-red-600" />
                      <AmountBox label="Saldo" value={formatCurrency(row.balance)} className="text-[#1B4332]" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

function AmountBox({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-2">
      <p className="text-[10px] font-semibold text-gray-400">{label}</p>
      <p className={`mt-1 break-words font-mono font-bold ${className}`}>{value}</p>
    </div>
  )
}
