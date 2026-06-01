import { NextResponse } from 'next/server'
import type { InstitutionOption } from '@/lib/institution-options'
import { listMpjInstitutionOptions } from '@/lib/mpj-api/master-data'
import { listInstitutionOptions as listLegacyInstitutionOptions } from '@/lib/server/master-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function matchesSearch(option: InstitutionOption, search: string) {
  const keyword = search.trim().toLowerCase()
  if (!keyword) return true

  return [option.name, option.subtitle ?? '', option.kind].some((value) => value.toLowerCase().includes(keyword))
}

function dedupeOptions(options: InstitutionOption[]) {
  const seen = new Set<string>()

  return options.filter((option) => {
    const key = `${option.kind}:${option.name.trim().toLowerCase()}`
    if (!option.name.trim() || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''
    const regionId = searchParams.get('regionId')
    const legacyOptions = await listLegacyInstitutionOptions()

    try {
      const mpjOptions = await listMpjInstitutionOptions(search, regionId)
      const legacySupplement = legacyOptions
        .filter((option) => option.kind !== 'pesantren')
        .filter((option) => matchesSearch(option, search))

      return NextResponse.json({
        ok: true,
        source: 'mpj-api-main',
        data: dedupeOptions([...mpjOptions, ...legacySupplement]),
      })
    } catch (mpjError) {
      const fallbackOptions = legacyOptions.filter((option) => matchesSearch(option, search))

      return NextResponse.json({
        ok: true,
        source: 'legacy-fallback',
        warning: mpjError instanceof Error ? mpjError.message : 'MPJ API tidak tersedia',
        data: fallbackOptions,
      })
    }
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal memuat instansi' },
      { status: 400 },
    )
  }
}
