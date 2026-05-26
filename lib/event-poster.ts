export const EVENT_POSTER_FALLBACK = 'https://picsum.photos/seed/mpj-event/800/450'

export function normalizeEventPosterUrl(value?: string | null) {
  const posterUrl = String(value || '').trim()
  if (!posterUrl) return EVENT_POSTER_FALLBACK

  const legacyUploadMatch = posterUrl.match(/^\/uploads\/posters\/([^/?#]+)$/)
  if (legacyUploadMatch) return `/api/uploads/posters/${legacyUploadMatch[1]}`

  return posterUrl
}

export function getEventPosterUrl(event: { poster_url?: string | null; posterUrl?: string | null }) {
  return normalizeEventPosterUrl(event.poster_url || event.posterUrl)
}

export function isMissingEventPoster(value?: string | null) {
  return !String(value || '').trim()
}
