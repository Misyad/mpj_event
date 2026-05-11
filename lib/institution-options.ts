import { dummyCrew, dummyMedia, dummyPesantren } from '@/lib/dummy'

export type InstitutionOptionKind = 'pesantren' | 'media' | 'unit' | 'custom'

export interface InstitutionOption {
  id: string
  name: string
  subtitle?: string
  kind: InstitutionOptionKind
}

function uniqueByName(options: InstitutionOption[]) {
  const seen = new Set<string>()
  return options.filter((option) => {
    const key = option.name.trim().toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function getInstitutionOptions(): InstitutionOption[] {
  const pesantrenOptions: InstitutionOption[] = dummyPesantren.map((item) => ({
    id: item.id,
    name: item.name,
    subtitle: `${item.region} · ${item.kabupaten}`,
    kind: 'pesantren',
  }))

  const mediaOptions: InstitutionOption[] = dummyMedia.map((item) => ({
    id: item.id,
    name: item.name,
    subtitle: `${item.type} · ${item.region}`,
    kind: 'media',
  }))

  const unitOptions: InstitutionOption[] = dummyCrew.flatMap((item) => [
    {
      id: `unit-${item.id}`,
      name: item.unit,
      subtitle: item.pesantren,
      kind: 'unit' as const,
    },
    {
      id: `crew-pesantren-${item.id}`,
      name: item.pesantren,
      subtitle: item.unit,
      kind: 'pesantren' as const,
    },
  ])

  return uniqueByName([...pesantrenOptions, ...mediaOptions, ...unitOptions]).sort((a, b) =>
    a.name.localeCompare(b.name, 'id-ID'),
  )
}

export function searchInstitutions(query: string): InstitutionOption[] {
  const keyword = query.trim().toLowerCase()
  const options = getInstitutionOptions()

  if (!keyword) return options

  return options.filter((option) => {
    const haystacks = [option.name, option.subtitle ?? '', option.kind]
    return haystacks.some((value) => value.toLowerCase().includes(keyword))
  })
}
