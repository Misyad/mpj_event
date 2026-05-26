'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { AddTransactionDialog } from '@/components/finance/AddTransactionDialog'
import { FinanceStatsCards } from '@/components/finance/FinanceStatsCards'
import { TransactionList } from '@/components/finance/TransactionList'
import { validateProofFile, validateTransactionForm } from '@/components/finance/TransactionForm'
import {
  DEFAULT_TRANSACTION_FORM,
  EMPTY_FINANCE_SUMMARY,
  type FinanceResponse,
  type FinanceTransaction,
  type TransactionFormErrors,
  type TransactionFormState,
} from '@/components/finance/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FinanceStatsSkeleton } from '@/components/skeletons/FinanceStatsSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

function isDirtyForm(form: TransactionFormState, proofFile: File | null) {
  return Boolean(
    proofFile ||
    form.categoryId ||
    form.title.trim() ||
    form.amount.trim() ||
    form.description.trim() ||
    form.transactionDate ||
    form.proofUrl ||
    form.type !== DEFAULT_TRANSACTION_FORM.type,
  )
}

function transactionToForm(transaction: FinanceTransaction): TransactionFormState {
  return {
    type: transaction.type,
    categoryId: transaction.categoryId,
    title: transaction.title,
    amount: String(transaction.amount),
    description: transaction.description ?? '',
    transactionDate: transaction.transactionDate ? transaction.transactionDate.slice(0, 10) : '',
    proofUrl: transaction.proofUrl ?? '',
  }
}

export function EventFinancePanel({ eventId }: { eventId: string }) {
  const [data, setData] = useState<FinanceResponse | null>(null)
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [form, setForm] = useState<TransactionFormState>(DEFAULT_TRANSACTION_FORM)
  const [formErrors, setFormErrors] = useState<TransactionFormErrors>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const categories = data?.categories ?? []
  const transactions = data?.transactions ?? []
  const summary = data?.summary ?? EMPTY_FINANCE_SUMMARY
  const formIsDirty = isDirtyForm(form, proofFile)

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

  function resetForm() {
    setForm(DEFAULT_TRANSACTION_FORM)
    setFormErrors({})
    setProofFile(null)
    setEditingId(null)
  }

  function closeDialog() {
    setIsDialogOpen(false)
    resetForm()
  }

  function openCreateDialog() {
    resetForm()
    setIsDialogOpen(true)
  }

  function openEditDialog(transaction: FinanceTransaction) {
    if (transaction.source === 'payment' || transaction.status === 'void') return
    setEditingId(transaction.id)
    setForm(transactionToForm(transaction))
    setFormErrors({})
    setProofFile(null)
    setIsDialogOpen(true)
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setIsDialogOpen(true)
      return
    }
    closeDialog()
  }

  function handleFormChange(nextForm: TransactionFormState) {
    setForm(nextForm)
    setFormErrors((current) => {
      const next = { ...current }
      delete next.submit
      return next
    })
  }

  function handleProofFileChange(file: File | null, proofError?: string) {
    setProofFile(file)
    setFormErrors((current) => ({ ...current, proofFile: proofError, submit: undefined }))
  }

  async function uploadProof() {
    if (!proofFile) return ''
    const proofError = validateProofFile(proofFile)
    if (proofError) throw new Error(proofError)

    const body = new FormData()
    body.append('file', proofFile)
    const response = await fetch('/api/admin/uploads/finance-proof', { method: 'POST', body })
    const payload = await response.json()
    if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal upload bukti')
    return String(payload.url)
  }

  async function saveTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validateTransactionForm(form)
    if (proofFile) {
      const proofError = validateProofFile(proofFile)
      if (proofError) validationErrors.proofFile = proofError
    }
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors)
      return
    }

    try {
      setIsSaving(true)
      setFormErrors({})
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
      closeDialog()
      await loadFinance()
      toast.success(editingId ? 'Transaksi berhasil diperbarui' : 'Transaksi berhasil ditambahkan')
    } catch (saveError) {
      setFormErrors((current) => ({
        ...current,
        submit: saveError instanceof Error ? saveError.message : 'Gagal menyimpan transaksi',
      }))
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
      toast.success('Transaksi berhasil divoid')
    } catch (voidError) {
      setError(voidError instanceof Error ? voidError.message : 'Gagal void transaksi')
    }
  }

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

      {isLoading && !data ? <FinanceStatsSkeleton /> : <FinanceStatsCards summary={summary} />}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-extrabold text-[#1B4332]">Transaksi Keuangan</p>
            <p className="mt-1 text-xs text-gray-500">Pantau pembayaran dan transaksi manual event dari satu daftar.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={openCreateDialog} className="h-10 rounded-xl bg-[#1B4332] px-4 text-white hover:bg-[#14532d]">
              <Plus className="h-4 w-4" />
              Tambah Transaksi
            </Button>
            <Button type="button" variant="outline" onClick={loadFinance} className="h-10 rounded-xl">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <a href={`/api/events/${encodeURIComponent(eventId)}/finance/export`}>
              <Button type="button" variant="outline" className="h-10 w-full rounded-xl sm:w-auto">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </a>
          </div>
        </div>

        {isLoading && !data ? (
          <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
            <Skeleton className="mb-3 h-3 w-28" />
            <div className="grid gap-2 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-10 rounded-xl" />)}
            </div>
          </div>
        ) : (
          <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Filter Transaksi</p>
            <div className="grid gap-2 md:grid-cols-4">
              <Select value={typeFilter} onValueChange={(value) => value !== null && setTypeFilter(value)}>
                <SelectTrigger className="h-10 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Jenis</SelectItem>
                  <SelectItem value="income">Pemasukan</SelectItem>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={(value) => value !== null && setCategoryFilter(value)}>
                <SelectTrigger className="h-10 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kategori</SelectItem>
                  {categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} className="h-10 rounded-xl bg-white" />
              <Input type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} className="h-10 rounded-xl bg-white" />
            </div>
          </div>
        )}

        <TransactionList
          transactions={transactions}
          isLoading={isLoading && !data}
          onEdit={openEditDialog}
          onVoid={voidTransaction}
        />
      </div>

      <AddTransactionDialog
        open={isDialogOpen}
        mode={editingId ? 'edit' : 'create'}
        form={form}
        errors={formErrors}
        categories={categories}
        proofFile={proofFile}
        isSaving={isSaving}
        isDirty={formIsDirty}
        onOpenChange={handleDialogOpenChange}
        onFormChange={handleFormChange}
        onProofFileChange={handleProofFileChange}
        onSubmit={saveTransaction}
      />
    </div>
  )
}
