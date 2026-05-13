import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_SIZE_BYTES = 100 * 1024
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

function uploadError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gagal mengupload poster'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminPermission(request, 'events.create')

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      throw new Error('File poster wajib diupload')
    }

    const extension = ALLOWED_TYPES[file.type]
    if (!extension) {
      throw new Error('Format poster harus JPG, PNG, atau WebP')
    }

    if (file.size > MAX_SIZE_BYTES) {
      throw new Error('Ukuran poster maksimal 100KB')
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'posters')
    const filename = `poster-${Date.now()}-${randomUUID()}.${extension}`
    const filepath = path.join(uploadDir, filename)

    await mkdir(uploadDir, { recursive: true })
    await writeFile(filepath, buffer)

    return NextResponse.json({ ok: true, url: `/uploads/posters/${filename}` }, { status: 201 })
  } catch (error) {
    return uploadError(error)
  }
}
