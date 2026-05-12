import { redirect } from 'next/navigation'
import { RegionalPaymentGatewayCredentials } from '@/components/payment/PaymentGatewayCredentials'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getGatewayCredentialSummaryForRegional } from '@/lib/server/payment-gateway-credentials'
import { getCurrentAdminSession, listRegionals } from '@/lib/server/rbac'

export const dynamic = 'force-dynamic'

export default async function RegionalPaymentGatewayPage() {
  const session = await getCurrentAdminSession(AUTH_ROLES.regionalAdmin)
  if (!session?.regionalId) redirect('/auth/regional-admin-login')

  const [credential, regionals] = await Promise.all([
    getGatewayCredentialSummaryForRegional(session.regionalId),
    listRegionals(),
  ])
  const regional = regionals.find((item) => item.id === session.regionalId)

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">Payment Gateway</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#1B4332]">Credential Paymenku Regional</h1>
          <p className="mt-1 text-sm text-gray-500">
            Isi, rotate, dan aktifkan credential Paymenku untuk regional login saat ini.
          </p>
        </div>
        <RegionalPaymentGatewayCredentials
          initialCredential={credential}
          regionalName={regional?.name ?? session.regionalId}
          regionalId={session.regionalId}
        />
      </div>
    </main>
  )
}
