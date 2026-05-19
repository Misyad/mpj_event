import type { CertificateTemplateFieldKey, CertificateTemplateLayout } from '@/types'

export const CERTIFICATE_CANVAS_WIDTH = 1000
export const CERTIFICATE_CANVAS_HEIGHT = 707

export const CERTIFICATE_FIELD_LABELS: Record<CertificateTemplateFieldKey, string> = {
  certificate_number: 'Nomor Sertifikat',
  participant_name: 'Nama Peserta',
  event_name: 'Nama Event',
  role: 'Jabatan',
  signer_name: 'Nama Penandatangan',
  date: 'Tanggal',
  qr_code: 'QR Verifikasi',
}

export const DEFAULT_CERTIFICATE_LAYOUT: CertificateTemplateLayout = {
  certificate_number: { x: 80, y: 80, width: 260, fontSize: 18, fontWeight: '700', color: '#334155', align: 'left', fontFamily: 'Inter, Arial, sans-serif' },
  participant_name: { x: 180, y: 295, width: 640, fontSize: 42, fontWeight: '800', color: '#1B4332', align: 'center', fontFamily: 'Inter, Arial, sans-serif' },
  event_name: { x: 220, y: 390, width: 560, fontSize: 24, fontWeight: '700', color: '#0f172a', align: 'center', fontFamily: 'Inter, Arial, sans-serif', multiline: true, lineHeight: 1.25 },
  role: { x: 650, y: 560, width: 220, fontSize: 16, fontWeight: '700', color: '#1B4332', align: 'center', fontFamily: 'Inter, Arial, sans-serif' },
  signer_name: { x: 650, y: 520, width: 220, fontSize: 18, fontWeight: '800', color: '#1B4332', align: 'center', fontFamily: 'Inter, Arial, sans-serif' },
  date: { x: 90, y: 560, width: 220, fontSize: 16, fontWeight: '600', color: '#475569', align: 'left', fontFamily: 'Inter, Arial, sans-serif' },
  qr_code: { x: 82, y: 455, width: 92, fontSize: 14, fontWeight: '600', color: '#0f172a', align: 'center', fontFamily: 'Inter, Arial, sans-serif' },
}

export function normalizeCertificateLayout(value: unknown): CertificateTemplateLayout {
  const candidate = value && typeof value === 'object' ? value as Partial<CertificateTemplateLayout> : {}
  return (Object.keys(DEFAULT_CERTIFICATE_LAYOUT) as CertificateTemplateFieldKey[]).reduce((layout, key) => {
    const base = DEFAULT_CERTIFICATE_LAYOUT[key]
    const item = candidate[key]
    layout[key] = {
      ...base,
      ...(item && typeof item === 'object' ? item : {}),
      x: Number(item?.x ?? base.x),
      y: Number(item?.y ?? base.y),
      width: Number(item?.width ?? base.width),
      fontSize: Number(item?.fontSize ?? base.fontSize),
      lineHeight: Number(item?.lineHeight ?? base.lineHeight ?? 1.2),
    }
    return layout
  }, {} as CertificateTemplateLayout)
}
