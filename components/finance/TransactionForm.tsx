'use client'

import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Category, TransactionFormErrors, TransactionFormState } from '@/components/finance/types'

const MAX_PROOF_SIZE = 2 * 1024 * 1024
const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export function validateProofFile(file: File) {
  if (!ALLOWED_PROOF_TYPES.includes(file.type)) return 'Format bukti harus JPG, PNG, WebP, atau PDF'
  if (file.size > MAX_PROOF_SIZE) return 'Ukuran bukti maksimal 2MB'
  return ''
}

export function validateTransactionForm(form: TransactionFormState) {
  const errors: TransactionFormErrors = {}
  const amount = Number(form.amount)

  if (!form.title.trim()) errors.title = 'Judul transaksi wajib diisi'
  if (!form.amount.trim()) {
    errors.amount = 'Nominal transaksi wajib diisi'
  } else if (!Number.isFinite(amount) || amount < 1) {
    errors.amount = 'Nominal transaksi wajib lebih dari 0'
  }

  return errors
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs font-semibold text-red-600">{message}</p>
}

export function TransactionForm({
  form,
  errors,
  categories,
  proofFile,
  isSaving,
  submitLabel,
  onChange,
  onProofFileChange,
  onSubmit,
  onCancel,
}: {
  form: TransactionFormState
  errors: TransactionFormErrors
  categories: Category[]
  proofFile: File | null
  isSaving: boolean
  submitLabel: string
  onChange: (form: TransactionFormState) => void
  onProofFileChange: (file: File | null, error?: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}) {
  const formCategories = categories.filter((category) => category.type === form.type)

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {errors.submit ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {errors.submit}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Jenis Transaksi</Label>
          <Select value={form.type} onValueChange={(value) => onChange({ ...form, type: value === 'expense' ? 'expense' : 'income', categoryId: '' })}>
            <SelectTrigger className="h-11 rounded-xl bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Pemasukan</SelectItem>
              <SelectItem value="expense">Pengeluaran</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Kategori</Label>
          <Select value={form.categoryId} onValueChange={(value) => onChange({ ...form, categoryId: value ?? '' })}>
            <SelectTrigger className="h-11 rounded-xl bg-white"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
            <SelectContent>
              {formCategories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <FieldError message={errors.categoryId} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Tanggal</Label>
          <Input type="date" value={form.transactionDate} onChange={(event) => onChange({ ...form, transactionDate: event.target.value })} className="h-11 rounded-xl bg-white" />
          <FieldError message={errors.transactionDate} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Nominal <span className="text-red-400">*</span></Label>
          <Input type="number" min="1" value={form.amount} onChange={(event) => onChange({ ...form, amount: event.target.value })} className="h-11 rounded-xl bg-white text-base font-semibold" placeholder="Contoh: 250000" />
          <FieldError message={errors.amount} />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs font-semibold text-gray-600">Judul Transaksi <span className="text-red-400">*</span></Label>
          <Input value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} className="h-11 rounded-xl bg-white" placeholder="Contoh: Sponsor utama / Konsumsi panitia" />
          <FieldError message={errors.title} />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs font-semibold text-gray-600">Catatan</Label>
          <Textarea value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} className="min-h-24 rounded-xl bg-white" placeholder="Tambahkan catatan singkat bila diperlukan" />
          <FieldError message={errors.description} />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs font-semibold text-gray-600">Upload Bukti/File</Label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white p-5 text-center transition hover:border-emerald-300 hover:bg-emerald-50/40">
            <Upload className="h-5 w-5 text-emerald-700" />
            <span className="text-sm font-bold text-[#1B4332]">{proofFile ? proofFile.name : 'Pilih file bukti'}</span>
            <span className="text-xs text-gray-400">JPG, PNG, WebP, atau PDF maksimal 2MB</span>
            <Input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                if (!file) {
                  onProofFileChange(null)
                  return
                }
                const error = validateProofFile(file)
                onProofFileChange(error ? null : file, error)
                if (error) event.currentTarget.value = ''
              }}
            />
          </label>
          {form.proofUrl && !proofFile ? <p className="text-xs text-gray-500">Bukti tersimpan akan tetap dipakai jika tidak upload file baru.</p> : null}
          <FieldError message={errors.proofFile} />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving} className="h-10 rounded-xl">
          Batal
        </Button>
        <Button type="submit" disabled={isSaving} className="h-10 rounded-xl bg-[#1B4332] text-white hover:bg-[#14532d]">
          {isSaving ? 'Menyimpan...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
