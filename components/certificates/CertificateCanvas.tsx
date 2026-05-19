'use client'

import { QRCodeSVG } from 'qrcode.react'
import type { CertificateTemplateFieldKey, CertificateTemplateLayout } from '@/types'
import { CERTIFICATE_CANVAS_HEIGHT, CERTIFICATE_CANVAS_WIDTH, CERTIFICATE_FIELD_LABELS } from '@/components/certificates/certificate-template-layout'

type CertificatePreviewData = Record<CertificateTemplateFieldKey, string>

export function CertificateCanvas({
  templateUrl,
  layout,
  data,
  selectedKey,
  onSelect,
  onMove,
  scale = 1,
}: {
  templateUrl?: string | null
  layout: CertificateTemplateLayout
  data: CertificatePreviewData
  selectedKey?: CertificateTemplateFieldKey
  onSelect?: (key: CertificateTemplateFieldKey) => void
  onMove?: (key: CertificateTemplateFieldKey, x: number, y: number) => void
  scale?: number
}) {
  function startDrag(key: CertificateTemplateFieldKey, event: React.PointerEvent<HTMLDivElement>) {
    if (!onMove) return
    const moveField: (key: CertificateTemplateFieldKey, x: number, y: number) => void = onMove
    const current = layout[key]
    const startX = event.clientX
    const startY = event.clientY
    const originX = current.x
    const originY = current.y
    event.currentTarget.setPointerCapture(event.pointerId)

    function onPointerMove(moveEvent: PointerEvent) {
      const nextX = Math.max(0, Math.round(originX + (moveEvent.clientX - startX) / scale))
      const nextY = Math.max(0, Math.round(originY + (moveEvent.clientY - startY) / scale))
      moveField(key, nextX, nextY)
    }

    function onPointerUp() {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  return (
    <div
      className="relative origin-top-left overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
      style={{
        width: CERTIFICATE_CANVAS_WIDTH,
        height: CERTIFICATE_CANVAS_HEIGHT,
        transform: `scale(${scale})`,
        marginBottom: `${CERTIFICATE_CANVAS_HEIGHT * (scale - 1)}px`,
      }}
    >
      {templateUrl ? (
        templateUrl.toLowerCase().endsWith('.pdf') ? (
          <object data={templateUrl} type="application/pdf" className="absolute inset-0 h-full w-full" aria-label="Template sertifikat" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={templateUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fafc,#eef7f1)]">
          <div className="absolute inset-8 border-[10px] border-[#1B4332]" />
          <div className="absolute inset-16 border border-[#C9A227]" />
          <p className="absolute left-0 right-0 top-24 text-center text-5xl font-black uppercase tracking-[0.18em] text-[#1B4332]">Sertifikat</p>
        </div>
      )}

      {(Object.keys(layout) as CertificateTemplateFieldKey[]).map((key) => {
        const item = layout[key]
        const isSelected = key === selectedKey
        const commonStyle: React.CSSProperties = {
          left: item.x,
          top: item.y,
          width: item.width,
          fontSize: item.fontSize,
          fontWeight: item.fontWeight ?? '600',
          color: item.color ?? '#0f172a',
          textAlign: item.align ?? 'left',
          fontFamily: item.fontFamily ?? 'Inter, Arial, sans-serif',
          lineHeight: item.lineHeight ?? 1.2,
          whiteSpace: item.multiline ? 'normal' : 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }

        return (
          <div
            key={key}
            role={onSelect ? 'button' : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onClick={() => onSelect?.(key)}
            onPointerDown={(event) => startDrag(key, event)}
            className={`absolute select-none rounded-md px-1 ${onMove ? 'cursor-move' : ''} ${isSelected ? 'ring-2 ring-[#C9A227] ring-offset-2' : onMove ? 'hover:ring-1 hover:ring-emerald-500' : ''}`}
            style={commonStyle}
            title={CERTIFICATE_FIELD_LABELS[key]}
          >
            {key === 'qr_code' ? (
              <div className="inline-flex bg-white p-1">
                <QRCodeSVG value={data.qr_code || '-'} size={Math.max(36, item.width - 8)} />
              </div>
            ) : (
              data[key]
            )}
          </div>
        )
      })}
    </div>
  )
}
