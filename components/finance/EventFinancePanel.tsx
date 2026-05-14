'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, ExternalLink, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

type Category = {
  id: string
  name: string
  type: 'income' | 'expense'
}

type FinanceTransaction = {
  id: string
  type: 'income' | 'expense'
  source: string
  categoryId: string
  categoryName: string | null
  paymentId: string | null
  amount: number
  title: string
  description: string | null
  transactionDate: string | null
  proofUrl: string | null
  status: 'posted' | 'void'
}

type FinanceResponse = {
  summary: {
    totalIncome: number
    totalExpense: number
    balance: number
    transactionCount: number
  }
  transactions: FinanceTransaction[]
  categories: Category[]
}

const DEFAULT_FORM = {
  type: 'income' as 'income' | 'expense',
  categoryId: '',
  title: '',
  amount: '',
  description: '',
  transactionDate: '',
  proofUrl: '',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('id-ID') : '-'
}

export function EventFinancePanel({ eventId }: { eventId: string }) {
  const [data, setData] = useState<FinanceResponse | null>(null)
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [form, setForm] = useState(DEFAULT_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const categories = data?.categories ?? []
  const formCategories = categories.filter((category) => category.type === form.type)

  const loadFinance = useMemo(() => async () => {
    try {
      setIsLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (typeFilter !== 'ALL') params.set('type', typeFilter)
      if (categoryFilter !== 'ALL') params.set('categoryId', categoryFilter)
      if (dateStart) params.set('dateStart', dateStart)
      if (dateEnd) params.set('dateEnd', dateEnd)
      const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/finance/transactions?${params.toString()}`, { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal memuat keuangan event')
      setData(payload.data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat keuangan event')
    } finally {
      setIsLoading(false)
    }
  }, [categoryFilter, dateEnd, dateStart, eventId, typeFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFinance()
  }, [loadFinance])

  async function uploadProof() {
    if (!proofFile) return ''
    const body = new FormData()
    body.append('file', proofFile)
    const response = await fetch('/api/admin/uploads/finance-proof', { method: 'POST', body })
    const payload = await response.json()
    if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal upload bukti')
    return String(payload.url)
  }

  function resetForm() {
    setForm(DEFAULT_FORM)
    setProofFile(null)
    setEditingId(null)
  }

  function editTransaction(transaction: FinanceTransaction) {
    if (transaction.source === 'payment' || transaction.status === 'void') return
    setEditingId(transaction.id)
    setForm({
      type: transaction.type,
      categoryId: transaction.categoryId,
      title: transaction.title,
      amount: String(transaction.amount),
      description: transaction.description ?? '',
      transactionDate: transaction.transactionDate ? transaction.transactionDate.slice(0, 10) : '',
      proofUrl: transaction.proofUrl ?? '',
    })
  }

  async function saveTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      setIsSaving(true)
      setError('')
      const proofUrl = await uploadProof()
      const payload = {
        ...form,
        amount: Number(form.amount),
        categoryId: form.categoryId || undefined,
        proofUrl: proofUrl || form.proofUrl || undefined,
      }
      const response = await fetch(
        editingId
          ? `/api/events/${encodeURIComponent(eventId)}/finance/transactions/${encodeURIComponent(editingId)}`
          : `/api/events/${encodeURIComponent(eventId)}/finance/transactions`,
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'Gagal menyimpan transaksi')
      resetForm()
      await loadFinance()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan transaksi')
    } finally {
      setIsSaving(false)
    }
  }

  async function voidTransaction(transactionId: string) {
    try {
      setError('')
      const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/finance/transactions/${encodeURIComponent(transactionId)}/void`, { method: 'POST' })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal void transaksi')
      await loadFinance()
    } catch (voidError) {
      setError(voidError instanceof Error ? voidError.message : 'Gagal void transaksi')
    }
  }

  const summary = data?.summary ?? { totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0 }

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Pemasukan', value: formatCurrency(summary.totalIncome), color: 'text-emerald-600' },
          { label: 'Pengeluaran', value: formatCurrency(summary.totalExpense), color: 'text-red-600' },
          { label: 'Saldo Event', value: formatCurrency(summary.balance), color: 'text-[#1B4332]' },
          { label: 'Transaksi', value: String(summary.transactionCount), color: 'text-amber-600' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-4 text-center">
            <p className={`text-lg font-extrabold ${item.color}`}>{item.value}</p>
            <p className="mt-1 text-xs text-gray-400">{item.label}</p>
          </div>
        ))}
      </div>

      <form onSubmit={saveTransaction} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-[#1B4332]">{editingId ? 'Edit Transaksi Manual' : 'Tambah Transaksi Manual'}</p>
            <p className="text-xs text-gray-500">Pemasukan/pengeluaran manual sesuai scope event.</p>
          </div>
          {editingId ? <Button type="button" variant="outline" onClick={resetForm}>Batal</Button> : null}
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value === 'expense' ? 'expense' : 'income', categoryId: '' }))}>
            <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Pemasukan</SelectItem>
              <SelectItem value="expense">Pengeluaran</SelectItem>
            </SelectContent>
          </Select>
          <Select value={form.categoryId} onValueChange={(value) => setForm((current) => ({ ...current, categoryId: value ?? '' }))}>
            <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Kategori" /></SelectTrigger>
            <SelectContent>
              {formCategories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="h-10 rounded-xl" placeholder="Judul transaksi" />
          <Input required type="number" min="1" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="h-10 rounded-xl" placeholder="Nominal" />
          <Input type="date" value={form.transactionDate} onChange={(event) => setForm((current) => ({ ...current, transactionDate: event.target.value }))} className="h-10 rounded-xl" />
          <Input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={(event) => setProofFile(event.target.files?.[0] ?? null)} className="h-10 rounded-xl" />
          <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="md:col-span-2 xl:col-span-2" placeholder="Catatan transaksi" />
        </div>
        <Button disabled={isSaving} className="mt-3 rounded-xl bg-[#1B4332] text-white">
          <Plus className="h-4 w-4" />
          {isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Transaksi'}
        </Button>
      </form>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-2 sm:grid-cols-4">
            <Select value={typeFilter} onValueChange={(value) => value !== null && setTypeFilter(value)}>
              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Jenis</SelectItem>
                <SelectItem value="income">Pemasukan</SelectItem>
                <SelectItem value="expense">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(value) => value !== null && setCategoryFilter(value)}>
              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Kategori</SelectItem>
                {categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} className="h-10 rounded-xl" />
            <Input type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} className="h-10 rounded-xl" />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={loadFinance}><RefreshCw className="h-4 w-4" />Refresh</Button>
            <a href={`/api/events/${encodeURIComponent(eventId)}/finance/export`}>
              <Button type="button" variant="outline"><Download className="h-4 w-4" />Export</Button>
            </a>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Memuat transaksi...</div>
        ) : !data?.transactions.length ? (
          <div className="p-8 text-center text-sm text-gray-500">Belum ada transaksi keuangan.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Tanggal</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Bukti</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.transactions.map((transaction) => (
                <TableRow key={transaction.id} className={transaction.status === 'void' ? 'opacity-60' : ''}>
                  <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                  <TableCell className="font-semibold text-[#1B4332]">{transaction.title}</TableCell>
                  <TableCell>{transaction.categoryName ?? '-'}</TableCell>
                  <TableCell>{transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} / {transaction.source}</TableCell>
                  <TableCell className={`font-mono ${transaction.type === 'income' ? 'text-emerald-700' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>{transaction.proofUrl ? <a href={transaction.proofUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a> : '-'}</TableCell>
                  <TableCell>{transaction.status}</TableCell>
                  <TableCell>
                    {transaction.source !== 'payment' && transaction.status !== 'void' ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" type="button" onClick={() => editTransaction(transaction)}>Edit</Button>
                        <Button size="sm" variant="outline" type="button" onClick={() => voidTransaction(transaction.id)}>Void</Button>
                      </div>
                    ) : <span className="text-xs text-gray-400">Read-only</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
