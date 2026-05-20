export type InstitutionOptionKind = 'pesantren' | 'media' | 'unit' | 'custom'

export interface InstitutionOption {
  id: string
  name: string
  subtitle?: string
  kind: InstitutionOptionKind
}

export function getInstitutionOptions(): InstitutionOption[] {
  return []
}

export function searchInstitutions(): InstitutionOption[] {
  return []
}
