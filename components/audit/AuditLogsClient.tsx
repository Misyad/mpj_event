'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, CreditCard, Eye, History, Search, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type AuditLogSource = 'login' | 'admin_activity' | 'payment'

type AuditLogRow = {
  id: string
  source: AuditLogSource
  action: string
  actorName: string | null
  actorEmail: string | null
  entityType: string | null
  entityId: string | null
  success: boolean | null
  metadata: unknown
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

type AuditSummary = {
  total: number
  loginFailed: number
  paymentAudit: number
  adminActivity: number
  last24h: number
}

const SOURCE_OPTIONS = [
  { value: 'all', label: 'Semua sumber' },
  { value: 'login', label: 'Login' },
  { value: 'admin_activity', label: 'Aktivitas Admin' },
  { value: 'payment', label: 'Payment' },
]

const SUMMARY_CARDS = [
  { key: 'total', label: 'Total Audit', icon: History, className: 'text-[#1B4332] bg-emerald-50' },
  { key: 'last24h', label: '24 Jam Terakhir', icon: Activity, className: 'text-blue-700 bg-blue-50' },
  { key: 'adminActivity', label: 'Mutasi Admin', icon: ShieldCheck, className: 'text-violet-700 bg-violet-50' },
  { key: 'paymentAudit', label: 'Audit Payment', icon: CreditCard, className: 'text-amber-700 bg-amber-50' },
  { key: 'loginFailed', label: 'Login Gagal', icon: AlertTriangle, className: 'text-red-700 bg-red-50' },
] as const

function formatDate(value: string) {
  return new Date(value).toLocaleString('id-ID')
}

function sourceLabel(source: AuditLogSource) {
  if (source === 'login') return 'Login'
  if (source === 'payment') return 'Payment'
  return 'Admin'
}

function sourceClass(source: AuditLogSource) {
  if (source === 'login') return 'bg-blue-50 text-blue-700'
  if (source === 'payment') return 'bg-amber-50 text-amber-700'
  return 'bg-emerald-50 text-emerald-700'
}

function stringifyMetadata(value: unknown) {
  if (value === null || value === undefined) return '-'
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function AuditLogsClient() {
  const [rows, setRows] = useState<AuditLogRow[]>([])
  const [summary, setSummary] = useState<AuditSummary>({ total: 0, loginFailed: 0, paymentAudit: 0, adminActivity: 0, last24h: 0 })
  const [source, setSource] = useState('all')
  const [query, setQuery] = useState('')
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [selected, setSelected] = useState<AuditLogRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadAuditLogs() {
      try {
        setIsLoading(true)
        setError('')
        const params = new URLSearchParams()
        params.set('limit', '120')
        if (source !== 'all') params.set('source', source)
        if (query.trim()) params.set('q', query.trim())
        if (action.trim()) params.set('action', action.trim())
        if (entityType.trim()) params.set('entityType', entityType.trim())
        if (dateStart) params.set('dateStart', dateStart)
        if (dateEnd) params.set('dateEnd', dateEnd)

        const response = await fetch(`/api/super-admin/audit-logs?${params.toString()}`, { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal memuat audit log')
        if (!active) return
        setRows(payload.data.items)
        setSummary(payload.data.summary)
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat audit log')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    const timer = window.setTimeout(loadAuditLogs, 250)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [action, dateEnd, dateStart, entityType, query, source])

  const actionOptions = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.action))).sort()
  }, [rows])

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">Audit Operasional</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#1B4332]">Audit Log Terpadu</h1>
          <p className="mt-1 text-sm text-gray-500">Pantau login, perubahan data admin, dan audit pembayaran dari satu dashboard read-only.</p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {SUMMARY_CARDS.map(({ key, label, icon: Icon, className }) => (
            <div key={key} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500">{label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-[#1B4332]">{summary[key].toLocaleString('id-ID')}</p>
                </div>
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', className)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </section>

        {error ? <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

        <section className="grid gap-3 lg:grid-cols-[1fr_170px_180px_160px_160px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 rounded-xl bg-white pl-9" placeholder="Cari aktor, action, entity, event, payment..." />
          </div>
          <Select value={source} onValueChange={(value) => value !== null && setSource(value)}>
            <SelectTrigger className="h-10 rounded-xl bg-white"><SelectValue placeholder="Sumber" /></SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input value={action} onChange={(event) => setAction(event.target.value)} list="audit-action-options" className="h-10 rounded-xl bg-white" placeholder="Action" />
          <datalist id="audit-action-options">
            {actionOptions.map((item) => <option key={item} value={item} />)}
          </datalist>
          <Input type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} className="h-10 rounded-xl bg-white" />
          <Input type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} className="h-10 rounded-xl bg-white" />
        </section>

        <section className="grid gap-3 md:grid-cols-[220px_1fr]">
          <Input value={entityType} onChange={(event) => setEntityType(event.target.value)} className="h-10 rounded-xl bg-white" placeholder="Entity type" />
          <div className="flex flex-wrap gap-2">
            {['event', 'participant', 'payment', 'payment_gateway', 'user', 'role'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setEntityType((current) => current === item ? '' : item)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
                  entityType === item ? 'border-[#1B4332] bg-[#1B4332] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-[#1B4332]/40',
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-sm font-semibold text-gray-500">Memuat audit log...</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm font-semibold text-gray-500">Tidak ada audit log yang cocok.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Waktu</TableHead>
                  <TableHead>Sumber</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Aktor</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="w-20">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={`${row.source}-${row.id}`}>
                    <TableCell className="whitespace-nowrap text-xs text-gray-500">{formatDate(row.createdAt)}</TableCell>
                    <TableCell>
                      <span className={cn('rounded-full px-2 py-1 text-xs font-bold', sourceClass(row.source))}>{sourceLabel(row.source)}</span>
                    </TableCell>
                    <TableCell className="font-semibold text-[#1B4332]">{row.action}</TableCell>
                    <TableCell>
                      <div className="max-w-52">
                        <p className="truncate text-sm font-medium text-gray-800">{row.actorName || row.actorEmail || '-'}</p>
                        {row.actorEmail ? <p className="truncate text-xs text-gray-400">{row.actorEmail}</p> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-48">
                        <p className="truncate text-sm text-gray-700">{row.entityType || '-'}</p>
                        <p className="truncate font-mono text-xs text-gray-400">{row.entityId || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">{row.ipAddress || '-'}</TableCell>
                    <TableCell>
                      <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => setSelected(row)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detail Audit</DialogTitle>
            <DialogDescription>{selected ? `${sourceLabel(selected.source)} - ${selected.action}` : 'Metadata audit'}</DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="grid gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2">
                <div><span className="font-semibold text-gray-500">Waktu:</span> {formatDate(selected.createdAt)}</div>
                <div><span className="font-semibold text-gray-500">Sumber:</span> {sourceLabel(selected.source)}</div>
                <div><span className="font-semibold text-gray-500">Aktor:</span> {selected.actorName || selected.actorEmail || '-'}</div>
                <div><span className="font-semibold text-gray-500">IP:</span> {selected.ipAddress || '-'}</div>
                <div><span className="font-semibold text-gray-500">Entity:</span> {selected.entityType || '-'}</div>
                <div><span className="font-semibold text-gray-500">Entity ID:</span> <span className="font-mono text-xs">{selected.entityId || '-'}</span></div>
              </div>
              <pre className="max-h-[420px] overflow-auto rounded-xl bg-[#10261d] p-4 text-xs leading-relaxed text-white">
                {stringifyMetadata(selected.metadata)}
              </pre>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  )
}
