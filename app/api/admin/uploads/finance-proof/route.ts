import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminPermission(request, 'events.update')
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') throw new Error('File bukti wajib diupload')
    const extension = ALLOWED_TYPES[file.type]
    if (!extension) throw new Error('Format bukti harus JPG, PNG, WebP, atau PDF')
    if (file.size > MAX_SIZE_BYTES) throw new Error('Ukuran bukti maksimal 2MB')

    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'finance-proofs')
    const filename = `finance-proof-${Date.now()}-${randomUUID()}.${extension}`
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, filename), buffer)
    return NextResponse.json({ ok: true, url: `/uploads/finance-proofs/${filename}` }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal upload bukti transaksi'
    return NextResponse.json({ ok: false, error: message }, { status: message === 'Unauthorized' ? 401 : 400 })
  }
}
