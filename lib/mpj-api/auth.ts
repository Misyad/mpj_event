import { mpjApiRequest, unwrapMpjApiData } from './client'

export type MpjApiUser = {
  id: string
  email: string
  role: string
  akses: unknown[]
  isSuperAdmin: boolean
  statusAccount?: string
  statusPayment?: string
  profileLevel?: string
  nip?: string | null
  namaPesantren?: string | null
  namaPengasuh?: string | null
  namaMedia?: string | null
  alamatSingkat?: string | null
  regionId?: string | null
  logoUrl?: string | null
  namaLengkap?: string | null
}

export type MpjApiLoginResult = {
  token: string
  user: MpjApiUser
}

export async function loginToMpjApi(email: string, password: string) {
  return mpjApiRequest<MpjApiLoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function getMpjApiMe(token: string) {
  const payload = await mpjApiRequest<unknown>('/auth/me', { token })
  return unwrapMpjApiData<MpjApiUser>(payload, 'user')
}
