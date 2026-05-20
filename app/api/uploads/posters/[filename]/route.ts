import { readFile, stat } from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ filename: string }>
}

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

function isSafePosterFilename(filename: string) {
  return /^poster-\d+-[0-9a-f-]+\.(jpg|jpeg|png|webp)$/i.test(filename)
}

export async function GET(_request: Request, context: RouteContext) {
  const { filename } = await context.params

  if (!isSafePosterFilename(filename)) {
    return NextResponse.json({ ok: false, error: 'Poster tidak valid' }, { status: 400 })
  }

  const extension = path.extname(filename).toLowerCase()
  const contentType = CONTENT_TYPES[extension]
  if (!contentType) {
    return NextResponse.json({ ok: false, error: 'Format poster tidak valid' }, { status: 400 })
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'posters')
  const filepath = path.join(uploadDir, filename)
  const resolvedUploadDir = path.resolve(uploadDir)
  const resolvedFilepath = path.resolve(filepath)

  if (!resolvedFilepath.startsWith(`${resolvedUploadDir}${path.sep}`)) {
    return NextResponse.json({ ok: false, error: 'Poster tidak valid' }, { status: 400 })
  }

  try {
    const info = await stat(resolvedFilepath)
    if (!info.isFile()) {
      return NextResponse.json({ ok: false, error: 'Poster tidak ditemukan' }, { status: 404 })
    }

    const buffer = await readFile(resolvedFilepath)
    return new NextResponse(buffer, {
      headers: {
        'cache-control': 'public, max-age=31536000, immutable',
        'content-length': String(buffer.length),
        'content-type': contentType,
      },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Poster tidak ditemukan' }, { status: 404 })
  }
}
