import { FinanceRecapClient } from '@/components/finance/FinanceRecapClient'

export const dynamic = 'force-dynamic'

export default function AdminPusatFinanceRecapPage() {
  return (
    <FinanceRecapClient
      title="Rekap Keuangan Event"
      description="Ringkasan pemasukan, pengeluaran, saldo, dan transaksi semua event."
    />
  )
}
