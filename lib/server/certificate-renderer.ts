import { createHash } from 'crypto'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import QRCode from 'qrcode'
import type { CertificateTemplateFieldKey, CertificateTemplateLayout } from '@/types'
import { CERTIFICATE_CANVAS_HEIGHT, CERTIFICATE_CANVAS_WIDTH, normalizeCertificateLayout } from '@/components/certificates/certificate-template-layout'
import { getStorageAdapter, sanitizePublicUploadUrl } from '@/lib/server/storage'

export type CertificateRenderSnapshot = {
  verificationCode: string
  certificateNumber: string
  participantName: string
  eventTitle: string
  issuedDate: string
  signerName: string
  signerRole: string
  templateUrl: string | null
  layout: CertificateTemplateLayout
}

function hexToRgb(color: string | undefined) {
  const normalized = (color || '#0f172a').replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized.padEnd(6, '0').slice(0, 6)
  const red = Number.parseInt(value.slice(0, 2), 16) / 255
  const green = Number.parseInt(value.slice(2, 4), 16) / 255
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255
  return rgb(Number.isFinite(red) ? red : 0, Number.isFinite(green) ? green : 0, Number.isFinite(blue) ? blue : 0)
}

function textWidthApprox(text: string, fontSize: number) {
  return text.length * fontSize * 0.52
}

function clampText(text: string, width: number, fontSize: number) {
  const maxChars = Math.max(8, Math.floor(width / (fontSize * 0.52)))
  if (text.length <= maxChars) return text
  return `${text.slice(0, Math.max(0, maxChars - 1))}…`
}

function splitLines(text: string, width: number, fontSize: number) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (textWidthApprox(next, fontSize) <= width || !current) {
      current = next
    } else {
      lines.push(current)
      current = word
    }
  }

  if (current) lines.push(current)
  return lines.slice(0, 3)
}

function resolveX(x: number, width: number, text: string, fontSize: number, align?: string) {
  if (align === 'center') return x + Math.max(0, (width - textWidthApprox(text, fontSize)) / 2)
  if (align === 'right') return x + Math.max(0, width - textWidthApprox(text, fontSize))
  return x
}

function dataFromSnapshot(snapshot: CertificateRenderSnapshot): Record<CertificateTemplateFieldKey, string> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '').replace(/\/+$/, '')
  const verifyUrl = appUrl ? `${appUrl}/verify/certificate/${encodeURIComponent(snapshot.verificationCode)}` : `/verify/certificate/${encodeURIComponent(snapshot.verificationCode)}`
  return {
    certificate_number: snapshot.certificateNumber,
    participant_name: snapshot.participantName,
    event_name: snapshot.eventTitle,
    role: snapshot.signerRole,
    signer_name: snapshot.signerName,
    date: snapshot.issuedDate,
    qr_code: verifyUrl,
  }
}

export async function renderCertificatePdf(snapshot: CertificateRenderSnapshot) {
  const layout = normalizeCertificateLayout(snapshot.layout)
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([CERTIFICATE_CANVAS_WIDTH, CERTIFICATE_CANVAS_HEIGHT])
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold)
  const storage = getStorageAdapter()
  const templateUrl = sanitizePublicUploadUrl(snapshot.templateUrl)

  if (templateUrl) {
    const template = await storage.readPublicObject(templateUrl)
    if (template) {
      const lower = templateUrl.toLowerCase()
      try {
        if (lower.endsWith('.png')) {
          const image = await pdf.embedPng(template)
          page.drawImage(image, { x: 0, y: 0, width: CERTIFICATE_CANVAS_WIDTH, height: CERTIFICATE_CANVAS_HEIGHT })
        } else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
          const image = await pdf.embedJpg(template)
          page.drawImage(image, { x: 0, y: 0, width: CERTIFICATE_CANVAS_WIDTH, height: CERTIFICATE_CANVAS_HEIGHT })
        }
      } catch {
        // Fallback certificate background is drawn below when embed fails.
      }
    }
  }

  page.drawRectangle({ x: 30, y: 30, width: CERTIFICATE_CANVAS_WIDTH - 60, height: CERTIFICATE_CANVAS_HEIGHT - 60, borderWidth: 8, borderColor: rgb(0.106, 0.263, 0.196), opacity: templateUrl ? 0 : 1 })
  const data = dataFromSnapshot(snapshot)

  for (const key of Object.keys(layout) as CertificateTemplateFieldKey[]) {
    const item = layout[key]
    const x = item.x
    const y = CERTIFICATE_CANVAS_HEIGHT - item.y - item.fontSize
    const font = Number(item.fontWeight ?? 600) >= 700 ? boldFont : regularFont
    const color = hexToRgb(item.color)

    if (key === 'qr_code') {
      const qrDataUrl = await QRCode.toDataURL(data.qr_code, { margin: 0, width: Math.max(64, item.width) })
      const qrBytes = Buffer.from(qrDataUrl.split(',')[1] || '', 'base64')
      const qrImage = await pdf.embedPng(qrBytes)
      page.drawImage(qrImage, { x, y: CERTIFICATE_CANVAS_HEIGHT - item.y - item.width, width: item.width, height: item.width })
      continue
    }

    const lines = item.multiline ? splitLines(data[key], item.width, item.fontSize) : [clampText(data[key], item.width, item.fontSize)]
    lines.forEach((line, index) => {
      page.drawText(line, {
        x: resolveX(x, item.width, line, item.fontSize, item.align),
        y: y - index * item.fontSize * (item.lineHeight ?? 1.2),
        size: item.fontSize,
        font,
        color,
      })
    })
  }

  const bytes = Buffer.from(await pdf.save())
  return {
    bytes,
    checksum: createHash('sha256').update(bytes).digest('hex'),
  }
}
