'use client'

import { useState } from 'react'
import { CheckCircle2, KeyRound, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type Credential = {
  id: string
  ownerType: 'pusat' | 'regional'
  regionalId: string | null
  regionalName: string | null
  provider: 'paymenku'
  apiKeyMasked: string
  webhookSecretMasked: string
  isActive: boolean
  updatedAt: string | null
}

type RegionalCredentialStatus = {
  regionalId: string
  regionalName: string
  regionalCode: string
  regionalStatus: string
  hasCredential: boolean
  apiKeyMasked: string
  isActive: boolean
  updatedAt: string | null
}

type FormState = {
  apiKey: string
  webhookSecret: string
  isActive: boolean
}

const defaultForm: FormState = {
  apiKey: '',
  webhookSecret: '',
  isActive: true,
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusBadge({ active, configured }: { active: boolean; configured: boolean }) {
  const className = configured
    ? active
      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
      : 'border-gray-200 bg-gray-50 text-gray-500'
    : 'border-amber-100 bg-amber-50 text-amber-700'

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${className}`}>
      {configured ? (active ? 'Aktif' : 'Nonaktif') : 'Belum diatur'}
    </span>
  )
}

function CredentialForm({
  title,
  description,
  endpoint,
  onSaved,
}: {
  title: string
  description: string
  endpoint: string
  onSaved: (payload: Record<string, unknown>) => void
}) {
  const [form, setForm] = useState<FormState>(defaultForm)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function saveCredential(event: React.FormEvent) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!form.apiKey.trim() || !form.webhookSecret.trim()) {
      setError('API key dan webhook secret wajib diisi.')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal menyimpan credential')

      onSaved(payload)
      setForm(defaultForm)
      setMessage('Credential Paymenku tersimpan.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan credential')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={saveCredential} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#1B4332]/10 text-[#1B4332]">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#1B4332]">{title}</p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
      </div>

      <div className="space-y-4">
        {error ? <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div> : null}
        {message ? <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{message}</div> : null}

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">API Key</Label>
          <Input
            type="password"
            value={form.apiKey}
            onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value }))}
            placeholder="sk_live_..."
            className="rounded-xl font-mono text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Webhook Secret</Label>
          <Input
            type="password"
            value={form.webhookSecret}
            onChange={(event) => setForm((current) => ({ ...current, webhookSecret: event.target.value }))}
            placeholder="whsec_..."
            className="rounded-xl font-mono text-sm"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
          <div>
            <p className="text-xs font-semibold text-[#1B4332]">Aktif</p>
            <p className="text-[11px] text-gray-400">Credential aktif dipakai untuk transaksi dan webhook.</p>
          </div>
          <Switch checked={form.isActive} onCheckedChange={(value) => setForm((current) => ({ ...current, isActive: value }))} />
        </div>

        <Button type="submit" disabled={isSaving} className="w-full rounded-xl bg-[#1B4332] text-white hover:bg-[#14532d]">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Simpan Credential
        </Button>
      </div>
    </form>
  )
}

export function AdminPusatPaymentGatewayCredentials({
  initialCredential,
  initialRegionalStatuses,
}: {
  initialCredential: Credential | null
  initialRegionalStatuses: RegionalCredentialStatus[]
}) {
  const [credential, setCredential] = useState(initialCredential)
  const [regionalStatuses, setRegionalStatuses] = useState(initialRegionalStatuses)

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <p className="text-sm font-bold text-[#1B4332]">Credential Pusat</p>
            <p className="mt-1 text-xs text-gray-500">Hanya credential milik pusat yang bisa diubah dari halaman ini.</p>
          </div>
          <div className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-[#1B4332]">Admin Pusat</p>
                <StatusBadge active={credential?.isActive ?? false} configured={Boolean(credential)} />
              </div>
              <p className="mt-2 text-xs text-gray-500">API Key: {credential?.apiKeyMasked ?? 'Belum diatur'}</p>
              <p className="mt-1 text-xs text-gray-500">Webhook Secret: {credential?.webhookSecretMasked ?? 'Belum diatur'}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Terakhir Update</p>
              <p className="mt-1 text-xs text-gray-600">{formatDate(credential?.updatedAt ?? null)}</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <p className="text-sm font-bold text-[#1B4332]">Status Credential Regional</p>
            <p className="mt-1 text-xs text-gray-500">Admin Pusat hanya melihat kelengkapan credential regional tanpa secret.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {regionalStatuses.length === 0 ? (
              <div className="p-8 text-center text-sm font-semibold text-gray-400">Belum ada data regional.</div>
            ) : (
              regionalStatuses.map((item) => (
                <div key={item.regionalId} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-[#1B4332]">{item.regionalName}</p>
                      <StatusBadge active={item.isActive} configured={item.hasCredential} />
                      {item.hasCredential ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Sudah diatur
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Kode: {item.regionalCode || '-'}</p>
                    <p className="mt-1 text-xs text-gray-500">API Key: {item.apiKeyMasked}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Terakhir Update</p>
                    <p className="mt-1 text-xs text-gray-600">{formatDate(item.updatedAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <CredentialForm
        title="Tambah / Rotate Credential Pusat"
        description="Mengisi ulang credential pusat akan mengganti API key dan webhook secret pusat."
        endpoint="/api/super-admin/payment-gateways"
        onSaved={(payload) => {
          setCredential((payload.credential as Credential | null) ?? null)
          setRegionalStatuses((payload.regionalStatuses as RegionalCredentialStatus[]) ?? [])
        }}
      />
    </div>
  )
}

export function RegionalPaymentGatewayCredentials({
  initialCredential,
  regionalName,
  regionalId,
}: {
  initialCredential: Credential | null
  regionalName: string
  regionalId: string
}) {
  const [credential, setCredential] = useState(initialCredential)

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <p className="text-sm font-bold text-[#1B4332]">Credential Regional</p>
          <p className="mt-1 text-xs text-gray-500">Credential ini hanya berlaku untuk event regional login saat ini.</p>
        </div>
        <div className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-[#1B4332]">{regionalName || regionalId}</p>
              <StatusBadge active={credential?.isActive ?? false} configured={Boolean(credential)} />
            </div>
            <p className="mt-2 text-xs text-gray-500">Regional ID: {regionalId}</p>
            <p className="mt-1 text-xs text-gray-500">API Key: {credential?.apiKeyMasked ?? 'Belum diatur'}</p>
            <p className="mt-1 text-xs text-gray-500">Webhook Secret: {credential?.webhookSecretMasked ?? 'Belum diatur'}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Terakhir Update</p>
            <p className="mt-1 text-xs text-gray-600">{formatDate(credential?.updatedAt ?? null)}</p>
          </div>
        </div>
      </div>

      <CredentialForm
        title="Tambah / Rotate Credential Regional"
        description="Admin regional tidak bisa memilih atau mengubah credential regional lain."
        endpoint="/api/regional/payment-gateway"
        onSaved={(payload) => setCredential((payload.credential as Credential | null) ?? null)}
      />
    </div>
  )
}
