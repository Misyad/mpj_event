import { PaymentGatewayCredentials } from '@/components/payment/PaymentGatewayCredentials'
import { listGatewayCredentials } from '@/lib/server/payment-gateway-credentials'
import { listRegionals } from '@/lib/server/rbac'

export const dynamic = 'force-dynamic'

export default async function PaymentGatewaysPage() {
  const [credentials, regionals] = await Promise.all([
    listGatewayCredentials(),
    listRegionals(),
  ])

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">Payment Gateway</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#1B4332]">Credential Paymenku</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola API key dan webhook secret Paymenku untuk pusat dan setiap regional.
          </p>
        </div>
        <PaymentGatewayCredentials initialCredentials={credentials} regionals={regionals} />
      </div>
    </main>
  )
}
