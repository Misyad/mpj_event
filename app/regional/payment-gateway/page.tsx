import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function RegionalPaymentGatewayPage() {
  redirect('/regional/finance/payments')
}
