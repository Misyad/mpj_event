'use client'

import { useMemo, useState } from 'react'
import type { CertificateTemplateFieldKey, CertificateTemplateLayout } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { CertificateCanvas } from '@/components/certificates/CertificateCanvas'
import { CERTIFICATE_FIELD_LABELS } from '@/components/certificates/certificate-template-layout'

type PreviewData = Record<CertificateTemplateFieldKey, string>

export function CertificateTemplateEditor({
  templateUrl,
  layout,
  onChange,
  previewData,
}: {
  templateUrl?: string | null
  layout: CertificateTemplateLayout
  onChange: (layout: CertificateTemplateLayout) => void
  previewData: PreviewData
}) {
  const [selectedKey, setSelectedKey] = useState<CertificateTemplateFieldKey>('participant_name')
  const selected = layout[selectedKey]
  const fields = useMemo(() => Object.keys(layout) as CertificateTemplateFieldKey[], [layout])

  function updateSelected(patch: Partial<CertificateTemplateLayout[CertificateTemplateFieldKey]>) {
    onChange({
      ...layout,
      [selectedKey]: {
        ...selected,
        ...patch,
      },
    })
  }

  function moveField(key: CertificateTemplateFieldKey, x: number, y: number) {
    onChange({
      ...layout,
      [key]: {
        ...layout[key],
        x,
        y,
      },
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="overflow-auto rounded-2xl bg-gray-50 p-3">
        <CertificateCanvas
          templateUrl={templateUrl}
          layout={layout}
          data={previewData}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          onMove={moveField}
          scale={0.62}
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Field</Label>
          <Select value={selectedKey} onValueChange={(value) => setSelectedKey(value as CertificateTemplateFieldKey)}>
            <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {fields.map((field) => <SelectItem key={field} value={field}>{CERTIFICATE_FIELD_LABELS[field]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="X" value={selected.x} onChange={(value) => updateSelected({ x: value })} />
          <NumberInput label="Y" value={selected.y} onChange={(value) => updateSelected({ y: value })} />
          <NumberInput label="Width" value={selected.width} onChange={(value) => updateSelected({ width: value })} />
          <NumberInput label="Font" value={selected.fontSize} onChange={(value) => updateSelected({ fontSize: value })} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">Weight</Label>
            <Select value={selected.fontWeight ?? '600'} onValueChange={(value) => updateSelected({ fontWeight: value as '400' | '500' | '600' | '700' | '800' })}>
              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['400', '500', '600', '700', '800'].map((weight) => <SelectItem key={weight} value={weight}>{weight}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">Align</Label>
            <Select value={selected.align ?? 'left'} onValueChange={(value) => updateSelected({ align: value as 'left' | 'center' | 'right' })}>
              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['left', 'center', 'right'].map((align) => <SelectItem key={align} value={align}>{align}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Color</Label>
          <Input type="color" value={selected.color ?? '#0f172a'} onChange={(event) => updateSelected({ color: event.target.value })} className="h-10 rounded-xl p-1" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Font Family</Label>
          <Input value={selected.fontFamily ?? 'Inter, Arial, sans-serif'} onChange={(event) => updateSelected({ fontFamily: event.target.value })} className="h-10 rounded-xl" />
        </div>

        <label className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm font-semibold text-[#1B4332]">
          Multiline
          <input type="checkbox" checked={Boolean(selected.multiline)} onChange={(event) => updateSelected({ multiline: event.target.checked })} />
        </label>

        <Button type="button" variant="outline" className="w-full rounded-xl" onClick={() => updateSelected({ x: 420, align: 'center' })}>
          Center Cepat
        </Button>
      </div>
    </div>
  )
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-600">{label}</Label>
      <Input type="number" value={value} onChange={(event) => onChange(Number(event.target.value || 0))} className="h-10 rounded-xl" />
    </div>
  )
}
