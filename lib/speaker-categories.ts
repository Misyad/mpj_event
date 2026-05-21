export const DEFAULT_SPEAKER_CATEGORIES = ['Tech', 'Bisnis', 'Desain', 'Jurnalistik', 'Keagamaan', 'Lainnya'] as const

export function normalizeSpeakerCategory(value: unknown) {
  return String(value ?? '').trim() || 'Lainnya'
}

export function getSpeakerCategorySuggestions(items: Array<{ kategori?: string | null }>) {
  const categories = new Set<string>(DEFAULT_SPEAKER_CATEGORIES)
  for (const item of items) {
    const category = normalizeSpeakerCategory(item.kategori)
    if (category) categories.add(category)
  }
  return Array.from(categories).sort((a, b) => a.localeCompare(b, 'id-ID'))
}
