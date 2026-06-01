import { mpjApiRequest, unwrapMpjApiData } from './client'

type ApiRecord = Record<string, unknown>

export type MpjRegion = {
  id: string
  name: string
  code: string | null
}

export type MpjCity = {
  id: string
  name: string
  province_id: string | null
}

export type MpjPesantrenDirectoryItem = {
  id: string
  nama_pesantren: string
  alamat?: string | null
  kota_kabupaten?: string | null
  region_id?: string | null
  region?: {
    id?: string
    name?: string
    code?: string | null
  } | null
}

export type MpjCrewLookup = {
  id: string
  niam: string
  fullName: string
  unit: string
  jabatan?: string | null
  profile?: {
    id: string
    namaPesantren: string
    nip: string
    logoUrl?: string | null
  }
}

export type MpjInstitutionOption = {
  id: string
  name: string
  subtitle?: string
  kind: 'pesantren'
}

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === 'object' ? value as ApiRecord : {}
}

function normalizeRegion(value: unknown): MpjRegion {
  const item = asRecord(value)
  return {
    id: String(item.id ?? ''),
    name: String(item.name ?? ''),
    code: typeof item.code === 'string' ? item.code : null,
  }
}

function normalizeCity(value: unknown): MpjCity {
  const item = asRecord(value)
  return {
    id: String(item.id ?? ''),
    name: String(item.name ?? ''),
    province_id: item.province_id !== undefined && item.province_id !== null ? String(item.province_id) : null,
  }
}

function normalizeDirectoryItem(value: unknown): MpjPesantrenDirectoryItem {
  const item = asRecord(value)
  const region = asRecord(item.region)
  return {
    id: String(item.id ?? ''),
    nama_pesantren: String(item.nama_pesantren ?? item.name ?? ''),
    alamat: typeof item.alamat === 'string' ? item.alamat : null,
    kota_kabupaten: typeof item.kota_kabupaten === 'string' ? item.kota_kabupaten : null,
    region_id: item.region_id !== undefined && item.region_id !== null ? String(item.region_id) : null,
    region: item.region
      ? {
          id: region.id !== undefined ? String(region.id) : undefined,
          name: typeof region.name === 'string' ? region.name : undefined,
          code: typeof region.code === 'string' ? region.code : null,
        }
      : null,
  }
}

function normalizeCrewLookup(value: unknown): MpjCrewLookup {
  const item = asRecord(value)
  const profile = asRecord(item.profile)
  return {
    id: String(item.id ?? ''),
    niam: String(item.niam ?? ''),
    fullName: String(item.nama ?? item.full_name ?? ''),
    unit: String(profile.nama_pesantren ?? item.institution ?? ''),
    jabatan: typeof item.jabatan === 'string' ? item.jabatan : null,
    profile: item.profile
      ? {
          id: String(profile.id ?? ''),
          namaPesantren: String(profile.nama_pesantren ?? ''),
          nip: String(profile.nip ?? ''),
          logoUrl: typeof profile.logo_url === 'string' ? profile.logo_url : null,
        }
      : undefined,
  }
}

export async function getMpjRegions() {
  const payload = await mpjApiRequest<unknown>('/public/regions')
  return unwrapMpjApiData<unknown[]>(payload, 'regions').map(normalizeRegion)
}

export async function getMpjCities(provinceId?: string | null) {
  const query = provinceId ? `?province_id=${encodeURIComponent(provinceId)}` : ''
  const payload = await mpjApiRequest<unknown>(`/public/cities${query}`)
  return unwrapMpjApiData<unknown[]>(payload, 'cities').map(normalizeCity)
}

export async function searchMpjPesantrenDirectory(search: string, regionId?: string | null) {
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  if (regionId) params.set('regionId', regionId)

  const payload = await mpjApiRequest<unknown>(`/public/directory-search?${params.toString()}`)
  return unwrapMpjApiData<unknown[]>(payload).map(normalizeDirectoryItem)
}

export async function listMpjInstitutionOptions(search = '', regionId?: string | null): Promise<MpjInstitutionOption[]> {
  const pesantren = await searchMpjPesantrenDirectory(search, regionId)
  const seen = new Set<string>()

  return pesantren
    .map((item) => ({
      id: item.id,
      name: item.nama_pesantren,
      subtitle: [
        item.region?.name,
        item.kota_kabupaten,
        item.alamat,
      ].filter(Boolean).join(' - '),
      kind: 'pesantren' as const,
    }))
    .filter((option) => {
      const key = option.name.trim().toLowerCase()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'id-ID'))
}

export async function getMpjPesantrenProfile(nip: string) {
  return mpjApiRequest<unknown>(`/public/pesantren/${encodeURIComponent(nip)}/profile`)
}

export async function getMpjCrewByNipAndSuffix(nip: string, niamSuffix: string) {
  const payload = await mpjApiRequest<unknown>(`/public/pesantren/${encodeURIComponent(nip)}/crew/${encodeURIComponent(niamSuffix)}`)
  return normalizeCrewLookup(unwrapMpjApiData<unknown>(payload, 'crew'))
}
