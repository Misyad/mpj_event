import crypto from 'crypto'
import type { GatewayCredentialSecrets } from '@/lib/server/payment-gateway-credentials'

export type PaymenkuChannel = {
  code: string
  name: string
  type: string
  typeLabel?: string
  feeDisplay?: string
}

export type PaymenkuTransaction = {
  trxId: string
  referenceId: string
  amount: number
  status: string
  payUrl: string | null
  paymentInfo: Record<string, unknown> | null
  expiresAt: string | null
}

export type PaymenkuWebhookPayload = {
  event?: string
  trx_id?: string
  reference_id?: string
  status?: string
  amount?: string | number
  total_fee?: string | number
  amount_fee?: string | number
  amount_received?: string | number
  payment_channel?: string | { code?: string; name?: string; type?: string }
  customer_name?: string
  customer_email?: string
  paid_at?: string
  created_at?: string
}

const DEFAULT_BASE_URL = 'https://paymenku.com/api/v1'

function getBaseUrl() {
  return (process.env.PAYMENKU_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

function getApiKey(credential?: GatewayCredentialSecrets) {
  const key = credential?.apiKey?.trim()
  if (!key) throw new Error('Credential API key Paymenku belum dikonfigurasi')
  return key
}

function getWebhookSecret(credential?: Pick<GatewayCredentialSecrets, 'webhookSecret'>) {
  const secret = credential?.webhookSecret?.trim()
  if (!secret) throw new Error('Credential webhook secret Paymenku belum dikonfigurasi')
  return secret
}

async function paymenkuFetch<T>(path: string, init: RequestInit = {}, credential?: GatewayCredentialSecrets): Promise<T> {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey(credential)}`,
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok || payload?.status === 'error') {
    throw new Error(payload?.message || payload?.error || `Paymenku request gagal (${response.status})`)
  }

  return payload as T
}

function toNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizePaymentInfo(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null
}

export function normalizePaymenkuStatus(status: string | undefined) {
  const value = String(status || '').toLowerCase()
  if (value === 'paid' || value === 'success' || value === 'settlement') return 'verified'
  if (value === 'pending') return 'waiting_payment'
  if (value === 'expired') return 'expired'
  if (value === 'cancelled' || value === 'canceled') return 'rejected'
  if (value === 'failed') return 'failed'
  return 'pending'
}

export async function getPaymenkuChannels(credential?: GatewayCredentialSecrets): Promise<PaymenkuChannel[]> {
  const payload = await paymenkuFetch<{ status: string; data: Record<string, unknown[]> | unknown[] }>('/payment-channels', {}, credential)
  const groups = Array.isArray(payload.data) ? { channels: payload.data } : payload.data && typeof payload.data === 'object' ? payload.data : {}

  return Object.values(groups).flatMap((items) => (
    Array.isArray(items)
      ? items.map((item) => {
          const channel = item as Record<string, unknown>
          const fee = normalizePaymentInfo(channel.fee)
          return {
            code: String(channel.code || ''),
            name: String(channel.name || channel.code || ''),
            type: String(channel.type || ''),
            typeLabel: String(channel.type_label || channel.type || ''),
            feeDisplay: fee?.display ? String(fee.display) : undefined,
          }
        }).filter((channel) => channel.code)
      : []
  ))
}

export async function createPaymenkuTransaction(input: {
  referenceId: string
  amount: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  channelCode: string
  returnUrl: string
}, credential?: GatewayCredentialSecrets): Promise<PaymenkuTransaction> {
  const payload = await paymenkuFetch<{
    status: string
    data: {
      trx_id?: string
      reference_id?: string
      amount?: string | number
      status?: string
      pay_url?: string
      payment_info?: Record<string, unknown>
    }
  }>('/transaction/create', {
    method: 'POST',
    body: JSON.stringify({
      reference_id: input.referenceId,
      amount: input.amount,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone || undefined,
      channel_code: input.channelCode,
      return_url: input.returnUrl,
    }),
  }, credential)

  const data = payload.data
  const paymentInfo = normalizePaymentInfo(data.payment_info)

  return {
    trxId: String(data.trx_id || ''),
    referenceId: String(data.reference_id || input.referenceId),
    amount: toNumber(data.amount || input.amount),
    status: String(data.status || 'pending'),
    payUrl: data.pay_url ? String(data.pay_url) : null,
    paymentInfo,
    expiresAt: paymentInfo?.expiration_date ? String(paymentInfo.expiration_date) : null,
  }
}

export async function checkPaymenkuStatus(orderId: string, credential?: GatewayCredentialSecrets): Promise<PaymenkuWebhookPayload> {
  const payload = await paymenkuFetch<{ status: string; data: PaymenkuWebhookPayload }>(`/check-status/${encodeURIComponent(orderId)}`, {}, credential)
  return payload.data
}

export function verifyPaymenkuSignature(rawBody: string, signature: string | null, timestamp: string | null, credential?: Pick<GatewayCredentialSecrets, 'webhookSecret'>) {
  if (!signature || !timestamp) return false

  const expected = crypto
    .createHmac('sha256', getWebhookSecret(credential))
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  const expectedBuffer = Buffer.from(expected, 'hex')
  const signatureBuffer = Buffer.from(signature, 'hex')
  return expectedBuffer.length === signatureBuffer.length && crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
}
