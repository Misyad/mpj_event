import { FinanceRecapClient } from '@/components/finance/FinanceRecapClient'

export const dynamic = 'force-dynamic'

export default function RegionalFinanceRecapPage() {
  return (
    <FinanceRecapClient
      title="Rekap Keuangan Regional"
      description="Ringkasan pemasukan, pengeluaran, saldo, dan transaksi event regional Anda."
    />
  )
}
