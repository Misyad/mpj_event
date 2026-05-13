import { FinancePaymentsClient } from '@/components/finance/FinancePaymentsClient'

export const dynamic = 'force-dynamic'

export default function RegionalFinancePaymentsPage() {
  return (
    <FinancePaymentsClient
      title="Monitoring Payment Regional"
      description="Pantau transaksi pembayaran peserta untuk event regional Anda."
    />
  )
}
