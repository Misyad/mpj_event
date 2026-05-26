'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TransactionForm } from '@/components/finance/TransactionForm'
import type { Category, TransactionFormErrors, TransactionFormState } from '@/components/finance/types'

export function AddTransactionDialog({
  open,
  mode,
  form,
  errors,
  categories,
  proofFile,
  isSaving,
  isDirty,
  onOpenChange,
  onFormChange,
  onProofFileChange,
  onSubmit,
}: {
  open: boolean
  mode: 'create' | 'edit'
  form: TransactionFormState
  errors: TransactionFormErrors
  categories: Category[]
  proofFile: File | null
  isSaving: boolean
  isDirty: boolean
  onOpenChange: (open: boolean) => void
  onFormChange: (form: TransactionFormState) => void
  onProofFileChange: (file: File | null, error?: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  function requestClose() {
    if (isDirty && !window.confirm('Form transaksi sudah terisi. Tutup dan buang perubahan?')) return
    onOpenChange(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      requestClose()
      return
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-white/70 bg-[#f8faf9] p-0 shadow-xl sm:max-w-3xl">
        <DialogHeader className="border-b border-gray-100 bg-white px-5 py-4 pr-12">
          <DialogTitle className="text-lg font-extrabold text-[#1B4332]">
            {mode === 'edit' ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </DialogTitle>
          <DialogDescription>
            Input pemasukan atau pengeluaran manual untuk event ini.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 py-5">
          <TransactionForm
            form={form}
            errors={errors}
            categories={categories}
            proofFile={proofFile}
            isSaving={isSaving}
            submitLabel={mode === 'edit' ? 'Simpan Perubahan' : 'Tambah Transaksi'}
            onChange={onFormChange}
            onProofFileChange={onProofFileChange}
            onSubmit={onSubmit}
            onCancel={requestClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
