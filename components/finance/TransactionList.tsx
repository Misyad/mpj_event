import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { FinanceTransaction } from '@/components/finance/types'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('id-ID') : '-'
}

export function TransactionList({
  transactions,
  isLoading,
  onEdit,
  onVoid,
}: {
  transactions: FinanceTransaction[]
  isLoading: boolean
  onEdit: (transaction: FinanceTransaction) => void
  onVoid: (transactionId: string) => void
}) {
  if (isLoading) {
    return <div className="p-8 text-center text-sm font-semibold text-gray-500">Memuat transaksi...</div>
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-8 text-center">
        <p className="text-sm font-bold text-[#1B4332]">Belum ada transaksi keuangan.</p>
        <p className="mt-1 text-xs text-gray-500">Tambahkan pemasukan atau pengeluaran manual lewat tombol Tambah Transaksi.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
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
          {transactions.map((transaction) => {
            const editable = transaction.source !== 'payment' && transaction.status !== 'void'
            return (
              <TableRow key={transaction.id} className={transaction.status === 'void' ? 'opacity-60' : ''}>
                <TableCell className="whitespace-nowrap text-xs text-gray-500">{formatDate(transaction.transactionDate)}</TableCell>
                <TableCell>
                  <p className="font-semibold text-[#1B4332]">{transaction.title}</p>
                  {transaction.description ? <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">{transaction.description}</p> : null}
                </TableCell>
                <TableCell className="text-sm text-gray-600">{transaction.categoryName ?? '-'}</TableCell>
                <TableCell>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${transaction.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  </span>
                  <p className="mt-1 text-[11px] text-gray-400">{transaction.source}</p>
                </TableCell>
                <TableCell className={`whitespace-nowrap font-mono font-semibold ${transaction.type === 'income' ? 'text-emerald-700' : 'text-red-600'}`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell>
                  {transaction.proofUrl ? (
                    <a href={transaction.proofUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${transaction.status === 'posted' ? 'bg-slate-100 text-slate-700' : 'bg-gray-100 text-gray-400'}`}>
                    {transaction.status}
                  </span>
                </TableCell>
                <TableCell>
                  {editable ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" type="button" onClick={() => onEdit(transaction)}>Edit</Button>
                      <Button size="sm" variant="outline" type="button" onClick={() => onVoid(transaction.id)}>Void</Button>
                    </div>
                  ) : <span className="text-xs text-gray-400">Read-only</span>}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
