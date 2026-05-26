import { ArrowDownLeft, ArrowUpRight, ReceiptText, WalletCards } from 'lucide-react'
import type { FinanceSummary } from '@/components/finance/types'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

export function FinanceStatsCards({ summary }: { summary: FinanceSummary }) {
  const items = [
    { label: 'Pemasukan', value: formatCurrency(summary.totalIncome), color: 'text-emerald-700', icon: ArrowUpRight, bg: 'bg-emerald-50' },
    { label: 'Pengeluaran', value: formatCurrency(summary.totalExpense), color: 'text-red-600', icon: ArrowDownLeft, bg: 'bg-red-50' },
    { label: 'Saldo Event', value: formatCurrency(summary.balance), color: 'text-[#1B4332]', icon: WalletCards, bg: 'bg-slate-50' },
    { label: 'Transaksi', value: String(summary.transactionCount), color: 'text-amber-700', icon: ReceiptText, bg: 'bg-amber-50' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map(({ label, value, color, icon: Icon, bg }) => (
        <div key={label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-lg font-extrabold ${color}`}>{value}</p>
              <p className="mt-1 text-xs font-semibold text-gray-400">{label}</p>
            </div>
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
