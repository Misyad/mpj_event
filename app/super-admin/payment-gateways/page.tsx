import { AdminPusatPaymentGatewayCredentials } from '@/components/payment/PaymentGatewayCredentials'
import {
  getPusatGatewayCredentialSummary,
  listRegionalCredentialStatuses,
} from '@/lib/server/payment-gateway-credentials'

export const dynamic = 'force-dynamic'

export default async function PaymentGatewaysPage() {
  const [credential, regionalStatuses] = await Promise.all([
    getPusatGatewayCredentialSummary(),
    listRegionalCredentialStatuses(),
  ])

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">Payment Gateway</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#1B4332]">Credential Paymenku</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola credential pusat dan pantau kelengkapan credential regional tanpa membuka secret regional.
          </p>
        </div>
        <AdminPusatPaymentGatewayCredentials initialCredential={credential} initialRegionalStatuses={regionalStatuses} />
      </div>
    </main>
  )
}
