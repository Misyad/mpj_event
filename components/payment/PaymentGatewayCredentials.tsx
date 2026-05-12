'use client'

import { useMemo, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

type Regional = {
  id: string
  name: string
  code: string
  status: string
}

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

type FormState = {
  ownerType: 'pusat' | 'regional'
  regionalId: string
  apiKey: string
  webhookSecret: string
  isActive: boolean
}

const defaultForm: FormState = {
  ownerType: 'pusat',
  regionalId: '',
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

export function PaymentGatewayCredentials({
  initialCredentials,
  regionals,
}: {
  initialCredentials: Credential[]
  regionals: Regional[]
}) {
  const [credentials, setCredentials] = useState(initialCredentials)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const activeRegionals = useMemo(() => regionals.filter((regional) => regional.status === 'active'), [regionals])

  async function saveCredential(event: React.FormEvent) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (form.ownerType === 'regional' && !form.regionalId) {
      setError('Regional wajib dipilih.')
      return
    }
    if (!form.apiKey.trim() || !form.webhookSecret.trim()) {
      setError('API key dan webhook secret wajib diisi.')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/super-admin/payment-gateways', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal menyimpan credential')

      setCredentials(payload.credentials ?? [])
      setForm({ ...defaultForm, regionalId: form.ownerType === 'regional' ? form.regionalId : '' })
      setMessage('Credential Paymenku tersimpan.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan credential')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <p className="text-sm font-bold text-[#1B4332]">Daftar Credential</p>
          <p className="mt-1 text-xs text-gray-500">Secret hanya ditampilkan dalam bentuk masked.</p>
        </div>
        <div className="divide-y divide-gray-100">
          {credentials.length === 0 ? (
            <div className="p-8 text-center text-sm font-semibold text-gray-400">Belum ada credential Paymenku.</div>
          ) : (
            credentials.map((credential) => (
              <div key={credential.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#1B4332]">
                      {credential.ownerType === 'pusat' ? 'Admin Pusat' : credential.regionalName || credential.regionalId}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${credential.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {credential.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">API Key: {credential.apiKeyMasked}</p>
                  <p className="mt-1 text-xs text-gray-500">Webhook Secret: {credential.webhookSecretMasked}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Terakhir Update</p>
                  <p className="mt-1 text-xs text-gray-600">{formatDate(credential.updatedAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <form onSubmit={saveCredential} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <p className="text-sm font-bold text-[#1B4332]">Tambah / Rotate Credential</p>
          <p className="mt-1 text-xs text-gray-500">Mengisi ulang owner yang sama akan mengganti credential lama.</p>
        </div>

        <div className="space-y-4">
          {error ? <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div> : null}
          {message ? <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{message}</div> : null}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">Owner</Label>
            <Select
              value={form.ownerType}
              onValueChange={(value) => setForm((current) => ({ ...current, ownerType: value === 'regional' ? 'regional' : 'pusat' }))}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pusat">Admin Pusat</SelectItem>
                <SelectItem value="regional">Admin Regional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.ownerType === 'regional' ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600">Regional</Label>
              <Select
                value={form.regionalId}
                onValueChange={(value) => setForm((current) => ({ ...current, regionalId: value ?? '' }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pilih regional" />
                </SelectTrigger>
                <SelectContent>
                  {activeRegionals.map((regional) => (
                    <SelectItem key={regional.id} value={regional.id}>
                      {regional.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

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
    </div>
  )
}
