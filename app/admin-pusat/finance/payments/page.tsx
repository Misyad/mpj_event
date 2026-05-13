import { FinancePaymentsClient } from '@/components/finance/FinancePaymentsClient'

export const dynamic = 'force-dynamic'

export default function AdminPusatFinancePaymentsPage() {
  return (
    <FinancePaymentsClient
      title="Monitoring Payment"
      description="Pantau seluruh transaksi pembayaran peserta event pusat dan regional."
    />
  )
}
